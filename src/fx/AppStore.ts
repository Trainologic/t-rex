import {ServiceStore} from "./ServiceStore";
import {PathResolver} from "./PathResolver";
import {ROOT} from "./TransactionalObject";
import {IService} from "./Service";
import {ActivityScope} from "./ActivityScope";
import {appLogger} from "./logger";

const logger = appLogger.create("AppStore");

export interface StoreListener<StateT> {
    (newState: StateT, oldState: StateT): void;
}

export interface StoreSubscription {
    (): void;
}

export type ServiceOrStore = ServiceStore<any> | IService<any>;

export class SystemState {
    initialized: boolean;
    nextTranId: number;
    nextActivityId: number;
}

export interface StoreMiddleware {
    (activity: ActivityScope, next: StoreMiddlewareNext): any;
}

export interface StoreMiddlewareNext {
    (activity: ActivityScope): any;
}

export interface AppStoreConfig {
    activityAutoBeginTransaction?: boolean;
    updateAutoBeginTransaction?: boolean;
    allowConcurrencyErrors?: boolean;
}

//
//  Holds application base and allow subscribing to changes
//  Each ServiceStore register itself to it
//  Commit request is delegated from the ServiceStore to this appStore
//
export class AppStore<StateT extends object> {
    private listeners: StoreListener<StateT>[];
    private appState: StateT;
    private stores: ServiceStore<any>[];
    private services: IService<any>[];
    private activityListeners: ActivityListener[] = [];
    private middleware: StoreMiddleware;
    private middlewareNext: StoreMiddlewareNext;
    private _config: AppStoreConfig;

    constructor() {
        this.appState = <any>{};
        this.listeners = [];
        this.stores = [];
        this.services = [];
        this.middleware = null;
        this.middlewareNext = null;

        this._config = {
            activityAutoBeginTransaction: false,
            updateAutoBeginTransaction: true,
            allowConcurrencyErrors: true,
        };
    }

    configure(config: AppStoreConfig) {
        Object.assign(this._config, config);
    }

    get config() {
        return this._config;
    }

    init(services: IService<any>[]) {
        logger("BEGIN - init").log();

        for(let service of services) {
            this.registerStore(service.store);
        }

        const systemStore = ServiceStore.create<SystemState>("$$system", {
            initialized: false,
            nextActivityId: 1,
            nextTranId: 1,
        });

        this.registerStore(systemStore);

        this.services = services;

        logger("Registered services are", this.services).log();

        systemStore.update({
            initialized: true,
        });

        logger("Initial appState", this.appState).log();

        logger("END - init").log();
    }

    executeReactions() {
        logger("BEGIN - executeReactions").log();

        for (let service of this.services) {
            const reactions = Reflect.get(service.constructor, "reactions");
            if (reactions) {
                for (let reaction of reactions) {
                    const method = service[reaction];
                    if (method) {
                        logger("BEGIN - " + service.constructor.name + "." + reaction).log();
                        method.call(service);
                        logger("END - " + service.constructor.name + "." + reaction).log();
                    }
                }
            }
        }

        logger("END - executeReactions").log();
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
            logger("Nothing new to commit").log();
            return;
        }

        if(!this._config.allowConcurrencyErrors && oldState != this.appState) {
            logger("A request for new state", newState, "with base", oldState, "is conflicting with existing state", this.appState);
            throw new Error("Concurrency error");
        }

        logger("Changing state", oldState, " ==> ", newState).log();

        this.appState = newState;

        //this.runReactions();

        //this.emit(oldState, newState);

        return this.appState;
    }

    emit(oldState, newState) {
        for (let l of this.listeners) {
            try {
                l(this.appState, oldState);
            }
            catch (err) {
                logger("Ignoring error during AppStore change event", err).error();
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
        }
        else {
            PathResolver.create(metadata.path).set(this.appState, metadata.initialState);
        }

        store.onRegistered(this);
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

    registerListener(listener: Partial<ActivityListener>) {
        const fullListener = Object.create(listener);

        const methods = [
            "onActivityBegin",
            "onActivitySuccess",
            "onActivityError",
            "onActivitySyncComplete",
            "onActivityAsyncComplete",
            "onActivityZoneComplete"
        ];

        for(const method of methods) {
            fullListener[method] = fullListener[method] || noop;
        }

        this.activityListeners.push(fullListener as ActivityListener);
    }

    unregisterListener(listener: Partial<ActivityListener>) {
        const index = this.activityListeners.indexOf(listener as ActivityListener);
        if(index != -1) {
            this.listeners.splice(index, 1);
        }
    }

    registerMiddleware(middleware: (activity, next)=>any) {
        const oldMiddleware = this.middleware;
        const oldMiddlewareNext = this.middlewareNext;
        this.middlewareNext = function(activity: ActivityScope) {
            if(oldMiddleware) {
                return oldMiddleware(activity, oldMiddlewareNext);
            }
        }

        this.middleware = middleware;
    }

    private emitActivityEvent(func: (l:ActivityListener)=>void, activity: ActivityScope) {
        logger("emitActivityEvent", activity).log();

        for(let listener of this.activityListeners) {
            func(listener);
        }
    }

    _onActivityBegin(activity: ActivityScope) {
        this.emitActivityEvent(l=>l.onActivityBegin(activity), activity);
    }

    _runActivity(activity: ActivityScope, func: () => any) {
        if(this.middleware) {
            return this.middleware(activity, func)
        }

        return func();
    }

    _onActivityError(activity: ActivityScope, err) {
        this.emitActivityEvent(l=>l.onActivityError(activity, err), activity);
    }

    _onActivitySuccess(activity: ActivityScope, res) {
        this.emitActivityEvent(l=>l.onActivitySuccess(activity, res), activity);
    }

    _onActivitySyncComplete(activity: ActivityScope) {
        this.emitActivityEvent(l=>l.onActivitySyncComplete(activity), activity);
    }

    _onActivityAsyncComplete(activity: ActivityScope) {
        this.emitActivityEvent(l=>l.onActivityAsyncComplete(activity), activity);
    }

    _onActivityZoneComplete(activity: ActivityScope) {
        this.emitActivityEvent(l=>l.onActivityZoneComplete(activity), activity);
    }
}

export interface ActivityListener {
    onActivityBegin(activity: ActivityScope);
    onActivitySuccess(activity: ActivityScope, res: any);
    onActivityError(activity: ActivityScope, err: any);
    onActivitySyncComplete(activity: ActivityScope);
    onActivityAsyncComplete(activity: ActivityScope);
    onActivityZoneComplete(activity: ActivityScope);
}

function noop() {
}
