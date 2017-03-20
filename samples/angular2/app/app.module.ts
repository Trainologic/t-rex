import {NgModule}      from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppComponent}  from './components/app.component';
import {ClockComponent} from "./components/clock.component";
import {ContactListComponent} from "./components/contactList.component";
import {ContactDetailsComponent} from "./components/contactDetails.component";
import {AppActivities, AppState} from "./services/appActivities.service";
import {NewContactComponent} from "./components/newContact.component";
import {FormsModule} from "@angular/forms";
import {AppStore} from "txsvc/AppStore";
import {AuthService} from "./services/auth.service";
import {ContactsService} from "./services/contacts.service";

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
    ],
    declarations: [
        AppComponent,
        ClockComponent,
        ContactListComponent,
        ContactDetailsComponent,
        NewContactComponent,
    ],
    bootstrap: [AppComponent],
    providers: [
        AppActivities,
        AppStore,
        AuthService,
        ContactsService
    ]
})
export class AppModule {
    constructor(appStore: AppStore<AppState>,
                authService: AuthService,
                contactsService: ContactsService) {
        appStore.init([
            authService,
            contactsService
        ]);
    }
}
