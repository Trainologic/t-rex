import {appModule} from "../app.module";
import {ContactService, Contact, ContactsState} from "../services/contacts.service";

export class AddContactComponent {
    name: string;

    constructor(private contactService: ContactService) {
    }

    add() {
        if(!this.name) {
            return;
        }

        this.contactService.add({id:-1, name: this.name});
    }
}

appModule.component("myAddContact", {
    controller: AddContactComponent,
    template: require("./addContact.component.html"),
    bindings: {
    }
});
