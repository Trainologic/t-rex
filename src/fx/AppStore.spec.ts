import {AppStore} from "./AppStore";
import {ServiceStore} from "./ServiceStore";
import {transaction} from "./decorators";

describe("AppStore", function() {
    interface AppState {
        counter: number;
    }

    class RootService {
        store = ServiceStore.create<AppState>("/", {
            counter: 0
        });

        get state() {
            return this.store.getState();
        }
    }

    it("notifies listeners when change occurs", function() {
        const appStore: AppStore<AppState> = new AppStore<AppState>();
        const root = new RootService();
        appStore.init([
            root
        ]);

        let notified: boolean = false;
        appStore.subscribe(()=> {
            notified = true;
        });

        transaction(appStore, ()=> {
            root.store.update({
                counter: root.state.counter + 1,
            });
        });

        expect(notified).toBe(true);
    });

    it("does not notify listener which unsubscribe", function() {
        const appStore: AppStore<AppState> = new AppStore<AppState>();
        const root = new RootService();
        appStore.init([
            root
        ]);

        let notified: boolean = false;
        const off = appStore.subscribe(()=> {
            notified = true;
        });

        off();

        transaction(appStore, ()=> {
            root.store.update({
                counter: root.state.counter + 1,
            });
        });

        expect(notified).toBe(false);
    });
});
