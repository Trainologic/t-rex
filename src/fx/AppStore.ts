import {ServiceStore} from "./ServiceStore";
import {PathResolver} from "./PathResolver";
import {ROOT} from "./TransactionalObject";
import {createLogger} from "./logger";
import {IService} from "./Service";

const logger = createLogger("AppStore");

export interface StoreListener<StateT> {
    (newState: StateT, oldState: StateT): void;
}

export interface StoreSubscription {
    (): void;
}

export type ServiceOrStore = ServiceStore<any> | IService<any>;

//
//  Holds application base and allow subscribing to changes
//  Each ServiceStore register itself to it
//  Commit request is delegated from the ServiceStore to this appStore
//
export class AppStore<StateT extends object> {
    private listeners: StoreListener<StateT>[];
    private appState: StateT;
    private stores: ServiceStore<any>[];

    constructor() {
        this.appState = <any>{};
        this.listeners = [];
        this.stores = [];
    }

    init(servicesOrStores: ServiceOrStore[]) {
        const stores: ServiceStore<any>[] = servicesOrStores.map(s => this.extractStore(s));

        for(let store of stores) {
            this.registerStore(store);
        }

        for(let store of stores) {
            store.onAppStoreInitialized(this);
        }

        logger.log("Initial appState", this.appState);
    }

    private extractStore(serviceOrStore: ServiceOrStore): ServiceStore<any> {
        if(serviceOrStore instanceof ServiceStore) {
            return serviceOrStore;
        }
        else if(serviceOrStore.store && serviceOrStore.store instanceof ServiceStore) {
            return serviceOrStore.store;
        }
        else {
            throw new Error("Invalid service/store instance");
        }
    }

    getState(): StateT {
        return this.appState;
    }

    subscribe(listener: StoreListener<StateT>): StoreSubscription {
        this.listeners.push(listener);

        return ()=> {
            this.unsubscribe(listener);
        }
    }

    unsubscribe(listener: StoreListener<StateT>) {
        const index = this.listeners.indexOf(listener);
        if(index != -1) {
            this.listeners.splice(index, 1);
        }
    }

    commit(oldState, newState) {
        if(newState == this.appState) {
            logger.log("Nothing new to commit");
            return;
        }

        if(oldState != this.appState) {
            throw new Error("Concurrency error");
        }

        logger.log("Changing state", oldState, " ==> ", newState);

        this.appState = newState;

        this.emit(oldState, newState);

        return this.appState;
    }

    private emit(oldState, newState) {
        for (let l of this.listeners) {
            try {
                l(this.appState, oldState);
            }
            catch (err) {
                logger.error("Ignoring error during AppStore change event", err);
            }
        }
    }

    private registerStore<StateT>(store: ServiceStore<any>) {
        const metadata = store.getMetadata();
        const conflict: ServiceStore<any> = this.findConflictingPath(metadata.path);
        if(conflict) {
            throw new Error("Service with path: " + metadata.path + " conflicts with existing service with path: " + conflict.getMetadata().path);
        }

        this.stores.push(store);

        if(store.getMetadata().path == ROOT) {
            this.appState = store.getMetadata().initialState;
            return;
        }

        PathResolver.create(metadata.path).set(this.appState, metadata.initialState);
    }

    private findConflictingPath(path: string): ServiceStore<any> {
        if(path == ROOT) {
            return this.stores.find(s=>s.getMetadata().path == ROOT);
        }

        for(let store of this.stores) {
            if(path.indexOf(store.getMetadata().path)==0) {
                return store;
            }
        }

        return null;
    }
}
