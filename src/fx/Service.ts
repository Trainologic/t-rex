import {AppStore} from "./AppStore";
import {ServiceStore} from "./ServiceStore";

export interface IService<T extends object> {
    store: AppStore<T> | ServiceStore<T>;
}
