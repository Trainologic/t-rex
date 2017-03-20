import {Activity} from "txsvc/decorators";
import {Injectable} from "@angular/core";
import {ServiceStore} from "txsvc/ServiceStore";

export interface Contact {
    id: number;
    name: string;
}

export interface ContactVM extends Contact {
    selected: boolean;
}

export interface ContactsState {
    all: Contact[];
    displayed: ContactVM[];
}

@Injectable()
export class ContactsService {
    public store = ServiceStore.create("contacts", {
        all: null,
        displayed: null,
    });

    constructor() {
    }

    get state(): ContactsState {
        return this.store.getState();
    }

    @Activity()
    load() {
        const contacts = [
            {id:1, name: "Ori"},
            {id:2, name: "Roni"},
        ];

        this.store.update({
            all: contacts,
            displayed: contacts.map(c=>({...c, selected: false}))
        });
    }
    
    @Activity()
    addContact(contact: Contact) {
        this.store.update({
            all: this.state.all.concat([contact]),
            displayed: this.state.displayed.concat([{...contact, selected: false}])
        });
    }

    @Activity()
    clear() {
        this.store.update({
            all: [],
            displayed: []
        });
    }
}
