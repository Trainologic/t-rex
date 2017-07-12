import {AppStore, StoreListener, StoreSubscription} from "./AppStore";
import {TransactionScope} from "./TransactionScope";
import {P1, P2} from "./helpers";
import {PathResolver} from "./PathResolver";
import {config} from "./config";
import {StoreOperator} from "./operators";
import {Logger} from "./logger";

export interface ServiceStoreMetadata<StateT> {
    path: string,
    initialState: StateT;
}

export class ServiceStore<StateT extends object> {
    private appStore: AppStore<any>;
    private listeners: StoreListener<StateT>[];
    private metadata: ServiceStoreMetadata<StateT>;
    private pathResolver: PathResolver;
    private logger: Logger;

    constructor(metadata: ServiceStoreMetadata<StateT>) {
        this.logger = Logger.create("ServiceStore", metadata.path);
        this.appStore = null;
        this.metadata = metadata;
        this.pathResolver = new PathResolver(this.metadata.path);
        this.listeners = [];
    }

    runWithOwnAppStore() {
        this.logger.log("runWithOwnAppStore");

        const appStore = new AppStore<any>();
        appStore.init([
            {store: this}
        ]);
    }

    onRegistered(appStore: AppStore<any>) {
        this.appStore = appStore;

        appStore.subscribe((newAppState, oldAppState) => {
            const newState = this.pathResolver.get(newAppState);
            const oldState = this.pathResolver.get(oldAppState);
            if(oldState != newState) {
                this.emit(newState, oldState);
            }
        });
    }

    subscribe(listener: StoreListener<StateT>): StoreSubscription {
        this.ensureInitialized();

        this.listeners.push(listener);

        //
        //  Always notify new subscribers of the existing data
        //
        const state = this.pathResolver.get(this.appStore.getState());
        listener(state, state);

        return () => {
            this.unsubscribe(listener);
        }
    }

    unsubscribe(listener: StoreListener<StateT>) {
        const index = this.listeners.indexOf(listener);
        if(index != -1) {
            this.listeners.splice(index, 1);
        }
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

    getState(): Readonly<StateT> {
        this.ensureInitialized();

        const tranScope = TransactionScope.current();
        const appState = (tranScope ? tranScope.getNewState() : this.appStore.getState());
        const state = this.pathResolver.get(appState);
        return state;
    }

    private resolveUpdateOverloading(key: any, value: any) {
        let changes: Partial<StateT>;

        if(arguments.length == 2) {
            changes = {
            };

            changes[key] = value;
        }
        else if(typeof key == "object") {
            changes = key;
        }
        else {
            changes = key(this.getState());
        }

        return changes;
    }

    update(changesOrFunc: Partial<StateT>): StateT
    update(func: (s: StateT) => Partial<StateT>): StateT
    update<K extends keyof StateT>(key: K, value: StateT[K]): StateT[K]
    update(key: any, value?: any): any {
        const changes = this.resolveUpdateOverloading.apply(this, arguments);
        this.logger.log("update", changes);

        this.ensureInitialized();

        let updated: StateT;

        if(config.updateAutoBeginTransaction) {
            TransactionScope.runInsideTransaction(this.appStore, ()=> {
                this.doUpdate(TransactionScope.current(), changes);
            });
            updated = this.getState();
        }
        else {
            const tranScope = TransactionScope.current();
            if (!tranScope) {
                throw new Error("No ambient transaction to update");
            }

            this.doUpdate(TransactionScope.current(), changes);
            updated = this.getState();
        }

        if(arguments.length == 2) {
            return updated[key];
        }

        return updated;
    }

    private resolveOperators(changes, oldState) {
        const resolved = {};

        for(let key in changes) {
            const value = changes[key];
            if(value instanceof StoreOperator) {
                resolved[key] = value.execute(oldState[key]);
            }
            else {
                resolved[key] = value;
            }
        }

        return resolved;
    }

    private doUpdate(tranScope: TransactionScope, changes: Partial<StateT>) {
        const oldState = this.getState();
        const resolvedChanges = this.resolveOperators(changes, oldState);

        tranScope.update(this.metadata.path, resolvedChanges);
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
                this.logger.error("Ignoring error during ServiceStore change event", err);
            }
        }
    }

    private ensureInitialized() {
        if(!this.appStore) {
            throw new Error("Store is not initialized. Did you call appStore.init ?");
        }
    }
}
