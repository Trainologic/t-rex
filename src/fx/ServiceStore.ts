import {AppStore, StoreListener} from "./AppStore";
import {TransactionScope} from "./TransactionScope";
import {P1, P2} from "./helpers";
import {PathResolver} from "./PathResolver";
import {createLogger} from "./logger";

const logger = createLogger("ServiceStore");

export interface ServiceStoreMetadata<StateT> {
    path: string,
    initialState: StateT;
}

export class ServiceStore<StateT extends object> {
    private appStore: AppStore<any>;
    private listeners: StoreListener<StateT>[];
    private metadata: ServiceStoreMetadata<StateT>;
    private pathResolver: PathResolver;

    constructor(metadata: ServiceStoreMetadata<StateT>) {
        this.appStore = null;
        this.metadata = metadata;
        this.pathResolver = new PathResolver(this.metadata.path);
        this.listeners = [];
    }

    onAppStoreInitialized(appStore: AppStore<any>) {
        this.appStore = appStore;

        appStore.subscribe((newAppState, oldAppState) => {
            const newState = this.pathResolver.get(newAppState);
            const oldState = this.pathResolver.get(oldAppState);
            if(oldState != newState) {
                this.emit(newState, oldState);
            }
        });
    }

    subscribe(listener: (newState: StateT, oldState: StateT)=>void) {
        this.ensureInitialized();

        this.listeners.push(listener);

        //
        //  Always notify new subscribers of the existing data
        //
        const state = this.pathResolver.get(this.appStore.getState());
        listener(state, state);
    }

    subscribeTo(path: string, listener: (newState, oldState)=>void) {
        this.ensureInitialized();

        const pathResolver = new PathResolver(path);

        this.listeners.push((s1, s2)=> {
            const c1 = pathResolver.get(s1);
            const c2 = pathResolver.get(s2);
            if(c1 != c2) {
                listener(c1, c2);
            }
        });
    }

    subscribeTo1<K1 extends keyof StateT>(key1: K1, listener: (newState: StateT[K1], oldState: StateT[K1])=>void) {
        this.ensureInitialized();

        this.listeners.push((s1, s2)=> {
            const c1 = P1(s1, key1);
            const c2 = P1(s2, key1);
            if(c1 != c2) {
                listener(c1, c2);
            }
        });
    }

    subscribeTo2<K1 extends keyof StateT, K2 extends keyof StateT[K1]>(key1: K1, key2: K2, listener: (newState: StateT[K1][K2], oldState: StateT[K1][K2])=>void) {
        this.ensureInitialized();

        this.listeners.push((s1, s2)=> {
            const c1 = P2(s1, key1, key2);
            const c2 = P2(s2, key1, key2);
            if(c1 != c2) {
                listener(c1, c2);
            }
        });
    }

    getAppStore(): AppStore<any> {
        this.ensureInitialized();

        return this.appStore;
    }

    getMetadata(): ServiceStoreMetadata<StateT> {
        return this.metadata;
    }

    getState(): StateT {
        this.ensureInitialized();

        const tranScope = TransactionScope.current();
        const appState = (tranScope ? tranScope.getNewState() : this.appStore.getState());
        const state = this.pathResolver.get(appState);
        return state;
    }

    update(changes: Partial<StateT>): StateT {
        logger.log("update", changes);

        this.ensureInitialized();

        const tranScope = TransactionScope.current();
        if(!tranScope) {
            throw new Error("No ambient transaction to update");
        }

        tranScope.update(this.metadata.path, changes);

        const state = this.pathResolver.get(tranScope.getNewState());
        logger.log("update new state is", state);
        return state;
    }

    static create<StateT extends object>(path: string, initialState: StateT) {
        return new ServiceStore<StateT>({
            path: path,
            initialState: initialState,
        });
    }

    private emit(newState, oldState) {
        for(let l of this.listeners) {
            try {
                l(newState, oldState);
            }
            catch(err) {
                logger.error("Ignoring error during ServiceStore change event", err);
            }
        }
    }

    private ensureInitialized() {
        if(!this.appStore) {
            throw new Error("Store is not initialized. Did you call appStore.init ?");
        }
    }
}
