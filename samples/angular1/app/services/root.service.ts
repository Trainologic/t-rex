import {ServiceStore} from "t-rex/ServiceStore";
import {ContactService} from "./contacts.service";
import {AppStore} from "t-rex/AppStore";
import {appModule} from "../app.module";

export interface AppState {
}

export class RootService {
    public store = ServiceStore.create<AppState>("/", {});

    constructor() {
    }
}

appModule.service("rootService", RootService);
