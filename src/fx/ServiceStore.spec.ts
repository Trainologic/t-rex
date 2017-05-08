import {enableLogging} from "./logger";
enableLogging(false);

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
        store: ServiceStore<AppState> = new ServiceStore<AppState>({
            path: "/",
            initialState: {
                counters: null,
            }
        });

        constructor(private counterStore: CounterService, private authStore: AuthService) {
        }

        get state() {
            return this.store.getState();
        }

        @Activity()
        async incAndFail() {
            this.counterStore.inc();
            throw new Error("Ooops");
        }

        @Activity()
        async incAndLogin(userName: string) {
            this.counterStore.inc();
            await this.authStore.login(userName);
        }
    }

    interface CounterState {
        value: number;
    }

    class CounterService {
        store: ServiceStore<CounterState> = new ServiceStore<CounterState>({
            path: "counters",
            initialState: {
                value: 0,
            }
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
            this.store.update({
                userName: userName,
            });

            callback();
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
    let counterStore: CounterService;
    let authStore: AuthService;
    let rootStore: RootService;

    beforeEach(function() {
        jasmine.addMatchers({
            toBeEqualArray: toBeEqualArray,
            toDeeplyEqual: toDeeplyEqual
        });

        appStore = new AppStore<AppState>();
        counterStore = new CounterService();
        authStore = new AuthService();
        rootStore = new RootService(counterStore, authStore);

        appStore.init([
            rootStore,
            authStore,
            counterStore
        ]);
    });

    it("with @Activity automatically commits changes to appStore", async function(done) {
        await counterStore.inc();
        expect(rootStore.state.counters.value).toBe(1);

        done();
    });

    it("Supports nested trasactions", async function(done) {
        await rootStore.incAndLogin("Ori");

        expect(rootStore.state).toDeeplyEqual({
            counters: {
                value: 1,
            },
            auth: {
                userName: "Ori",
                roles: [],
            }
        });

        done();
    });

    it("No commit in case of exception", async function(done) {
        const beforeState = collectValues(rootStore.state);
        try {
            await rootStore.incAndFail();
        }
        catch(err) {
        }
        const afterState = collectValues(rootStore.state);

        expect(afterState).toBeEqualArray(beforeState);

        done();
    });

    it("Does not allow second commit", async function(done) {
        let tranScope;
        await authStore.loginAndRunCallback("userName", function() {
            tranScope = TransactionScope.current();
        });

        expect(() => {
            tranScope.commit();
        }).toThrow(new Error("Activity was already committed"));

        done();
    });

    it("subscribeTo fires when specific property has changed", async function (done) {
        let fired = false;
        authStore.store.subscribeTo("userName", (newState, oldState)=> {
            fired = true;
        });

        await authStore.login("Ori");

        //await authStore.logout();

        expect(fired).toBe(true);
        //expect(authStore.state).toEqual({userName: null, roles: []});

        done();
    });

    it("subscribeTo does not fire on specific property that was not changed", async function (done) {
        let fired;
        authStore.store.subscribeTo("userName", (newState, oldState)=> {
            fired = true;
        });
        fired = false;


        expect(fired).toBe(false);

        done();
    });

    it("raises concurrency error when an array is modified by two parallel activities", async function (done) {
        interface AppState {
            nums: number[];
        }

        function delay(ms) {
            return new Promise((resolve, reject)=> {
                setTimeout(function() {
                    resolve();
                }, ms);
            });
        }

        class Service1 {
            store = ServiceStore.create<AppState>("/", {
                nums: [],
            });

            get state() {
                return this.store.getState();
            }

            @Activity()
            async run() {
                await delay(0);

                await this.store.update({
                    nums: this.state.nums.concat([1])
                })
            }
        }

        const appStore = new AppStore<AppState>();
        const service1 = new Service1();
        appStore.init([
            service1
        ]);

        let thrown = false;
        try {
            await Promise.all([
                service1.run(),
                service1.run()
            ]);
        }
        catch(err) {
            thrown = true;
        }

        expect(thrown).toEqual(true);

        done();
    });

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

    it("does not raise error when parallel transactions update different branches", async function (done) {
        interface Branch1State {
            obj: any;
        }

        interface AppState {
            branch1: Branch1State;
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
                obj: null,
            });

            get state() {
                return this.store.getState();
            }

            @Activity()
            async load() {
                await delay(0);

                await this.store.update({
                    obj: {}
                })
            }
        }

        const appStore = new AppStore<AppState>();
        const service1 = new Service1();
        appStore.init([
            service1,
        ]);

        let thrown = false;
        try {
            await Promise.all([
                service1.load(),
                service1.load(),
            ]);
        }
        catch(err) {
            thrown = true;
        }

        expect(thrown).toEqual(false);

        done();
    });
});
