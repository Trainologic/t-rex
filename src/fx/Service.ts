import {AppStore} from "./AppStore";
import {ServiceStore} from "./ServiceStore";

export interface IService<T extends object> {
    store: ServiceStore<T>;
}
