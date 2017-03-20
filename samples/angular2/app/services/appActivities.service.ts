import {ServiceStore} from "txsvc/ServiceStore";
import {AppStore} from "txsvc/AppStore";
import {ContactsService, ContactsState} from "./contacts.service";
import {Injectable} from "@angular/core";
import {AuthService, AuthState} from "./auth.service";
import {Activity, transaction} from "txsvc/decorators";

export interface AppState {
    contacts: ContactsState;
    auth: AuthState;
}

@Injectable()
export class AppActivities {
    constructor(public store: AppStore<AppState>,
                public authStore: AuthService,
                public contactsStore: ContactsService) {
    }

    //@Transaction()
    logout() {
        transaction(this.store, ()=> {
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
