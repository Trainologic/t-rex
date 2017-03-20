import {ServiceStore} from "txsvc/ServiceStore";
import {ContactsStore} from "./contacts.store";
import {AppStore} from "txsvc/AppStore";
import {appModule} from "../app.module";

export interface AppState {
}

export class RootStore {
    public store = ServiceStore.create<AppState>("/", {});

    constructor() {
    }
}

appModule.service("rootStore", RootStore);
