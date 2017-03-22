require("angular");

// import * as angular from "angular";
// import {AppComponent} from "./components/app.component";
// import {appModule} from "./app.module";
// import {AppStore} from "t-rex/AppStore";
// import {ContactListComponent} from "./components/contactList.component";
// import {AddContactComponent} from "./components/addContact.component";
// import {createLogger} from "t-rex/logger";
// import {AppState, RootService} from "./services/root.service";
// import {ContactService} from "./services/contacts.service";
//
// const logger = createLogger("main");
//
// const components = [
//     AppComponent,
//     ContactListComponent,
//     AddContactComponent,
// ];
//
// const services = [
//     RootService,
//     ContactService
// ];
//
// appModule.run(($rootScope, rootService: RootService, contactService: ContactService) => {
//     const appStore = new AppStore<AppState>();
//
//     appStore.subscribe((newState,oldState)=> {
//         logger.log("$applyAsync after appState changed");
//
//         $rootScope.$applyAsync();
//     });
//
//     appStore.init([
//         rootService,
//         contactService,
//     ]);
// });
//
// angular.bootstrap(document.getElementById("html"), [appModule.name]);
