import {ServiceStore} from "t-rex/ServiceStore";
import {AppStore} from "t-rex";
import {ContactsService, ContactsState} from "./contacts.service";
import {Injectable} from "@angular/core";
import {AuthService, AuthState} from "./auth.service";
import {Activity, transaction} from "t-rex";

export interface AppState {
    contacts: ContactsState;
    auth: AuthState;
}

@Injectable()
export class AppActivities {
    constructor(public appStore: AppStore<AppState>,
                public authStore: AuthService,
                public contactsStore: ContactsService) {
    }

    //@Transaction()
    logout() {
        transaction(this.appStore, ()=> {
            this.authStore.logout();
            this.contactsStore.clear();
        });
    }

    @Activity()
    login(userName: string, password: string) {
        this.contactsStore.load();
        this.authStore.login(userName, password);
    }
}
