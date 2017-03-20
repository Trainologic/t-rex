import {appModule} from "../app.module";
import {ContactsStore, Contact, ContactsState} from "../stores/contacts.store";

export class AddContactComponent {
    name: string;

    constructor(private contactsStore: ContactsStore) {
    }

    add() {
        if(!this.name) {
            return;
        }

        this.contactsStore.add({id:-1, name: this.name});
    }
}

appModule.component("myAddContact", {
    controller: AddContactComponent,
    template: require("./addContact.component.html"),
    bindings: {
    }
});
