import {configure} from "./config";

configure({
    enableLogging: true,
    //activityAutoBeginTransaction: false,
});

import {ActivityListener, AppStore, StoreListener} from "./AppStore";
import {ServiceStore} from "./ServiceStore";
import {Activity, transaction} from "./decorators";
import {collectValues} from "../spec/collectValues";
import {toBeEqualArray} from "../spec/toBeEqualArray";
import {toDeeplyEqual} from "../spec/toDeeplyEqual";
import {TransactionScope} from "./TransactionScope";
import {ActivityScope} from "./ActivityScope";

describe("ActivityScope", function() {
    interface AppState {
        counters: CounterState,
    }

    class RootService {
        store: ServiceStore<AppState> = ServiceStore.create<AppState>("/", {
            counters: null,
        });

        constructor(private counterStore: CounterService) {
        }

        get state() {
            return this.store.getState();
        }

        @Activity()
        incSync() {
            this.counterStore.inc();
        }

        @Activity()
        async incAsync() {
            this.counterStore.inc();
        }

        @Activity()
        incSyncFail() {
            this.counterStore.inc();
            throw new Error("Ooops");
        }

        @Activity()
        async incAsyncFail() {
            this.counterStore.inc();
            throw new Error("Ooops");
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

    class Listener implements ActivityListener{
        begin: number = 0;
        success: number = 0;
        error: number = 0;
        complete: number = 0;
        asyncComplete: number = 0;
        zoneComplete: number = 0;

        onActivityBegin(activity) {
            ++this.begin;
        }

        onActivitySuccess(activity, res) {
            ++this.success;
        }

        onActivityError(activity, res) {
            ++this.error;
        }

        onActivitySyncComplete(activity) {
            ++this.complete;
        }

        onActivityAsyncComplete(activity) {
            ++this.asyncComplete;
        }

        onActivityZoneComplete(activity) {
            ++this.zoneComplete;
        }
    }

    let appStore: AppStore<AppState>;
    let counterService: CounterService;
    let rootService: RootService;
    let listener: Listener;

    beforeEach(function() {
        jasmine.addMatchers({
            toBeEqualArray: toBeEqualArray,
            toDeeplyEqual: toDeeplyEqual
        });

        appStore = new AppStore<AppState>();
        counterService = new CounterService();
        rootService = new RootService(counterService);
        listener = new Listener();

        appStore.init([
            rootService,
            counterService
        ]);

        appStore.registerListener(listener);
    });

    it("Notifies listeners when activity completes without error", function() {
        rootService.incSync();
        expect(listener.success).toBe(1);
    });

    it("Notifies listeners when async activity completes without error", async function(done) {
        await rootService.incAsync();
        expect(listener.success).toBe(1);

        done();
    });

    it("Notifies listeners when activity fails", async function(done) {
        await rootService.incSyncFail();
        expect(listener.success).toBe(0);
        expect(listener.error).toBe(1);

        done();
    });

    it("Notifies listeners when async activity fails", async function(done) {
        let err = null;

        try {
            await rootService.incAsyncFail();
        }
        catch(e) {
            err = e;
        }

        expect(err).toBeDefined();
        expect(listener.success).toBe(0);
        expect(listener.error).toBe(1);

        done();
    });
});
