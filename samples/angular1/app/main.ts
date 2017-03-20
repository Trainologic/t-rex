import * as angular from "angular";
import {AppComponent} from "./components/app.component";
import {appModule} from "./app.module";
import {RootStore, AppState} from "./stores/root.store";
import {ContactsStore} from "./stores/contacts.store";
import {AppStore} from "txsvc/AppStore";
import {ContactListComponent} from "./components/contactList.component";
import {AddContactComponent} from "./components/addContact.component";
import {createLogger} from "txsvc/logger";

const logger = createLogger("main");

const components = [
    AppComponent,
    ContactListComponent,
    AddContactComponent,
];

const stores = [
    RootStore,
    ContactsStore
];

appModule.run(($rootScope, rootStore: RootStore, contactsStore: ContactsStore) => {
    const appStore = new AppStore<AppState>();

    appStore.subscribe((newState,oldState)=> {
        logger.log("$applyAsync after appState changed");

        $rootScope.$applyAsync();
    });

    appStore.init([
        rootStore.store,
        contactsStore.store,
    ]);
});

angular.bootstrap(document.getElementById("html"), [appModule.name]);
