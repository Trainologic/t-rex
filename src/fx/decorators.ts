import {TransactionScope} from "./TransactionScope";
import {ServiceStore} from "./ServiceStore";
import {AppStore} from "./AppStore";
import {IService} from "./Service";
import {config} from "./config";
import {ActivityScope} from "./ActivityScope";
import {Logger} from "./logger";

const logger = Logger.create("decorators");

const ACTIVITY_SERVICE = "t-rex:service";

export function transaction<T extends object>(store: AppStore<T> | ServiceStore<T>, func) {
    const appStore = getAppStoreFromStore(store);
    return TransactionScope.runInsideTransaction(appStore, function() {
        return func();
    });
}

export interface ActivityOptions {
    name?: string;
    beginTransaction?: boolean;
}

function getStoreFromService(service: IService<any>) {
    let store = service.store;
    if(!store) {
        logger.error("No store field was found for store instance", service);
        throw new Error("No store field was found for store instance");
    }

    return getAppStoreFromStore(store);
}

function getAppStoreFromStore<T extends object>(store: AppStore<T> | ServiceStore<T>): AppStore<T> {
    if(store instanceof AppStore) {
        return store;
    }

    if(store instanceof ServiceStore) {
        return store.getAppStore();
    }

    throw new Error("Unexpected store value. Should be of type AppStore | ServiceStore");
}

function logActivity(service, method, args) {
    const serviceType = service.constructor;
    if(!serviceType) {
        throw new Error("Activity cannot be logged since the service instance has no constructor property");
    }

    const serviceMetadata = Reflect.get(serviceType, ACTIVITY_SERVICE);
    if(!serviceMetadata) {
        throw new Error("Activity cannot be logged since service has no metadata");
    }
}

function getAppStoreFromService(service) {
    let appStore: AppStore<any>;

    if(service.store) {
        if(!(service.store instanceof ServiceStore)) {
            throw new Error("Unexpected store value. Should be of type ServiceStore");
        }

        return service.store.getAppStore();
    }
    else if(service.appStore) {
        if(!(service.appStore instanceof AppStore)) {
            throw new Error("Unexpected appStore value. Should be of type AppStore");
        }

        return service.appStore;
    }

    throw new Error("No store/appStore field was found for service instance");
}

export interface ServiceOptions {
    name: string;
}

export function Service(options: ServiceOptions) {
    return function(target: any) {
        logger.log(target);

        Reflect.set(target, ACTIVITY_SERVICE, {});

        const res = Reflect.get(target, ACTIVITY_SERVICE);
        logger.log("RES", res);
        return target;
    }
}

function getOptionOrDefault<T>(options: any, propName: string, defValue: T): T {
    let propVal: T;

    if(options && options.hasOwnProperty(propName)) {
        propVal = options[propName];
    }
    else {
        propVal = defValue;
    }

    return propVal;
}

export function Activity(options?: ActivityOptions) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = function (...args) {
            const service = this;
            let appStore = getAppStoreFromService(service);
            const beginTransaction: boolean = getOptionOrDefault(options, "beginTransaction", config.activityAutoBeginTransaction);

            return ActivityScope.runInsideActivity(appStore, ()=> {
                if(beginTransaction) {
                    return TransactionScope.runInsideTransaction(appStore, function () {
                        return method.apply(service, args);
                    });
                }
                else {
                    return method.apply(service, args);
                }
            });

        }

        return descriptor;
    }
}

export function Reaction() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const ctor = target.constructor;
        if(!ctor) {
            logger.warn("Target of @Reaction has no constructor")
            return;
        }

        let reactions = Reflect.get(ctor, "reactions");
        if(!reactions) {
            reactions = [];
            Reflect.set(ctor, "reactions", reactions);
        }

        reactions.push(propertyKey);

        return descriptor;
    }
}
