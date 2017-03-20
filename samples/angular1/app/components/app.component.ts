import {appModule} from "../app.module";
import {ContactsStore, Contact, ContactsState} from "../stores/contacts.store";
import {createLogger} from "txsvc/logger";

export class AppComponent {
    contacts: Contact[];

    constructor(private contactsStore: ContactsStore) {
    }

    $onInit() {
        this.contactsStore.store.subscribe((newState: ContactsState)=> {
            this.contacts = newState.all;

            //debugger;

            //this.contactsStore.add({id:-1, name: "XXX"});

            //console.log("xxx");
        });
    }

    onDeleteContact($event) {
        this.contactsStore.deleteById($event.contact.id);
    }
}

appModule.component("myApp", {
    controller: AppComponent,
    template: require("./app.component.html")
});
