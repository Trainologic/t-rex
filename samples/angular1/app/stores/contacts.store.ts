import {ServiceStore} from "txsvc/ServiceStore";
import {appModule} from "../app.module";
import {Activity, Service} from "txsvc/decorators";

export interface Contact {
    id: number;
    name: string;
}

export interface ContactsState {
    all: Contact[];
}

export class ContactsStore {
    public store = ServiceStore.create<ContactsState>("contacts", {
        all: [
            {id:1, name: "Ori"},
            {id:2, name: "Roni"},
        ]
    });

    get state() {
        return this.store.getState();
    }

    @Activity()
    add(contact: Contact) {
        this.store.update({
            all: this.state.all.concat(contact)
        });
    }

    @Activity()
    deleteById(id: number) {
        const index = this.state.all.findIndex(c => c.id == id);
        if(index == -1) {
            return;
        }

        const all = [].concat(this.state.all);
        all.splice(index, 1);

        this.store.update({
            all: all,
        });
    }
}

appModule.service("contactsStore", ContactsStore);
