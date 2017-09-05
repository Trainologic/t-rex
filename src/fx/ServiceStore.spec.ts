import {AppStore} from "./AppStore";
import {ServiceStore} from "./ServiceStore";
import {Activity, transaction} from "./decorators";
import {collectValues} from "../spec/collectValues";
import {toBeEqualArray} from "../spec/toBeEqualArray";
import {toDeeplyEqual} from "../spec/toDeeplyEqual";
import {TransactionScope} from "./TransactionScope";

describe("ServiceStore", function() {
    interface AppState {
        counters: CounterState,
    }

    class RootService {
        store: ServiceStore<AppState> = ServiceStore.create<AppState>("/", {
            counters: null,
        });

        constructor(private counterStore: CounterService, private authStore: AuthService) {
        }

        get state() {
            return this.store.getState();
        }

        @Activity()
        incAndFail() {
            transaction(this.store, ()=> {
                this.counterStore.inc();
                throw new Error("Ooops");
            });
        }

        @Activity()
        incAndLogin(userName: string) {
            this.counterStore.inc();
            this.authStore.login(userName);
        }
    }

    interface CounterState {
        value: number;
    }

    class CounterService {
        store: ServiceStore<CounterState> = ServiceStore.create<CounterState>("counters", {
            value: 0,
        });

        get state() {
            return this.store.getState();
        }

        @Activity()
        inc() {
            this.store.update({
                value: this.state.value + 1,
            });
        }
    }

    interface AuthState {
        userName: string;
        roles: string[];
    }

    class AuthService {
        store: ServiceStore<AuthState> = new ServiceStore<AuthState>({
            path: "auth",
            initialState: {
                userName: null,
                roles: [],
            }
        });

        get state() {
            return this.store.getState();
        }

        @Activity()
        login(userName: string) {
            this.store.update({
                userName: userName,
            });
        }

        @Activity()
        loginAndRunCallback(userName: string, callback) {
            transaction(this.store, ()=> {
                this.store.update({
                    userName: userName,
                });

                callback();
            });

            //setTimeout(callback, 100);
        }

        @Activity()
        logout() {
            this.store.update({
                userName: null,
                roles: [],
            });
        }

        @Activity()
        loadRoles() {
            this.store.update({
                roles: ["admin"],
            });
        }
    }

    let appStore: AppStore<AppState>;
    let counterService: CounterService;
    let authService: AuthService;
    let rootService: RootService;

    beforeEach(function() {
        jasmine.addMatchers({
            toBeEqualArray: toBeEqualArray,
            toDeeplyEqual: toDeeplyEqual
        });

        appStore = new AppStore<AppState>();
        counterService = new CounterService();
        authService = new AuthService();
        rootService = new RootService(counterService, authService);

        appStore.init([
            rootService,
            authService,
            counterService
        ]);
    });

    it("with @Activity automatically commits changes to appStore", function() {
        counterService.inc();
        expect(rootService.state.counters.value).toBe(1);
    });

    it("Supports nested trasactions", function() {
        rootService.incAndLogin("Ori");

        expect(rootService.state).toDeeplyEqual({
            counters: {
                value: 1,
            },
            auth: {
                userName: "Ori",
                roles: [],
            }
        });
    });

    it("No commit in case of exception", function() {
        const beforeState = collectValues(rootService.state);
        try {
            rootService.incAndFail();
        }
        catch(err) {
        }
        const afterState = collectValues(rootService.state);

        expect(afterState).toBeEqualArray(beforeState);

        console.log(beforeState);
        console.log(afterState);
    });

    it("Does not allow second commit", async function(done) {
        let tranScope;
        await authService.loginAndRunCallback("userName", function() {
            tranScope = TransactionScope.current;
        });

        expect(() => {
            tranScope.commit();
        }).toThrow(new Error("Activity was already committed"));

        done();
    });

    it("subscribeTo fires when specific property has changed", async function (done) {
        let fired = false;
        authService.store.subscribeTo("userName", (newState, oldState)=> {
            fired = true;
        });

        await authService.login("Ori");

        //await authStore.logout();

        expect(fired).toBe(true);
        //expect(authStore.state).toEqual({userName: null, roles: []});

        done();
    });

    it("subscribeTo does not fire on specific property that was not changed", async function (done) {
        let fired;
        authService.store.subscribeTo("userName", (newState, oldState)=> {
            fired = true;
        });
        fired = false;


        expect(fired).toBe(false);

        done();
    });

    //
    //  Disable for now. Consider reenable
    //  Since TransactionScope is no more async there is no way to produce concurrency errors
    //  Consider moving the concurrency checks to ActivityScope
    //
    // it("raises concurrency error when an array is modified by two parallel activities", async function (done) {
    //     interface AppState {
    //         nums: number[];
    //     }
    //
    //     function delay(ms) {
    //         return new Promise((resolve, reject)=> {
    //             setTimeout(function() {
    //                 resolve();
    //             }, ms);
    //         });
    //     }
    //
    //     class Service1 {
    //         store = ServiceStore.create<AppState>("/", {
    //             nums: [],
    //         });
    //
    //         get state() {
    //             return this.store.getState();
    //         }
    //
    //         @Activity()
    //         async run() {
    //             await delay(0);
    //
    //             this.store.update({
    //                 nums: this.state.nums.concat([1])
    //             })
    //         }
    //     }
    //
    //     const appStore = new AppStore<AppState>();
    //     appStore.configure({
    //         allowConcurrencyErrors: false
    //     });
    //
    //     const service1 = new Service1();
    //     appStore.init([
    //         service1
    //     ]);
    //
    //     let thrown = false;
    //     try {
    //         await Promise.all([
    //             service1.run(),
    //             service1.run()
    //         ]);
    //     }
    //     catch(err) {
    //         thrown = true;
    //     }
    //
    //     expect(thrown).toEqual(true);
    //
    //     done();
    // });

    it("does not raise error when parallel transactions update different branches", async function (done) {
        interface Branch1State {
            counter: number;
        }

        interface Branch2State {
            counter: number;
        }

        interface AppState {
            branch1: Branch1State;
            branch2: Branch2State;
        }

        function delay(ms) {
            return new Promise((resolve, reject)=> {
                setTimeout(function() {
                    resolve();
                }, ms);
            });
        }

        class Service1 {
            store = ServiceStore.create<Branch1State>("branch1", {
                counter: 0,
            });

            get state() {
                return this.store.getState();
            }

            @Activity()
            async inc() {
                await delay(0);

                await this.store.update({
                    counter: this.state.counter + 1
                })
            }
        }

        class Service2 {
            store = ServiceStore.create<Branch2State>("branch2", {
                counter: 0,
            });

            get state() {
                return this.store.getState();
            }

            @Activity()
            async inc() {
                await delay(0);

                await this.store.update({
                    counter: this.state.counter + 1
                })
            }
        }

        const appStore = new AppStore<AppState>();
        const service1 = new Service1();
        const service2 = new Service2();
        appStore.init([
            service1,
            service2,
        ]);

        let thrown = false;
        try {
            await Promise.all([
                service1.inc(),
                service2.inc()
            ]);
        }
        catch(err) {
            thrown = true;
        }

        expect(thrown).toEqual(false);

        done();
    });

    it("notifies listeners when change occurs", function() {
        let notified: boolean = false;

        appStore.subscribe(()=> {
            notified = true;
        });

        transaction(appStore, ()=> {
            counterService.store.update({
                value: counterService.state.value + 1,
            });
        });

        expect(notified).toBe(true);
    });

    it("does not notify listener which unsubscribe", function() {
        let notified: boolean = false;

        const off = appStore.subscribe(()=> {
            notified = true;
        });

        off();

        transaction(appStore, ()=> {
            counterService.store.update({
                value: counterService.state.value + 1,
            });
        });

        expect(notified).toBe(false);
    });

    it("Allows for update without transaction when updateAutoBeginTransaction is true", function() {
        appStore.configure({
            updateAutoBeginTransaction: true,
        });

        try {
            counterService.store.update({
                value: counterService.state.value + 1,
            });

            expect(true).toBe(true);
        }
        catch (err) {
            expect(false).toBe(true);
        }
    });

    it("Does not allow for update without ambient transaction", function() {
        appStore.configure({
            updateAutoBeginTransaction: false
        });

        try {
            counterService.store.update({
                value: counterService.state.value + 1,
            });

            expect(false).toBe(true);
        }
        catch (err) {
            expect(true).toBe(true);
        }
    });
});
