import {appModule} from "../app.module";
import {ContactsStore, Contact, ContactsState} from "../stores/contacts.store";

export class ContactListComponent {
    contacts: Contact[];
    onDelete: (args: {$event: {contact: Contact}})=>void;

    delete(contact) {
        this.onDelete({$event: {contact: contact}});
    }
}

appModule.component("myContactList", {
    controller: ContactListComponent,
    template: require("./contactList.component.html"),
    bindings: {
        "contacts": "<",
        "onDelete": "&",
    }
});
