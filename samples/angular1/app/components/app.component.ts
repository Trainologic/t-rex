import {appModule} from "../app.module";
import {ContactService, Contact, ContactsState} from "../services/contacts.service";
import {createLogger} from "t-rex/logger";

export class AppComponent {
    contacts: Contact[];

    constructor(private contactService: ContactService) {
    }

    $onInit() {
        this.contactService.store.subscribe((newState: ContactsState)=> {
            this.contacts = newState.all;

            //debugger;

            //this.contactsStore.add({id:-1, name: "XXX"});

            //console.log("xxx");
        });
    }

    onDeleteContact($event) {
        this.contactService.deleteById($event.contact.id);
    }
}

appModule.component("myApp", {
    controller: AppComponent,
    template: require("./app.component.html")
});
