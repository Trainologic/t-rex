import { Injectable } from '@angular/core';
import {Activity, ServiceStore, transaction} from "t-rex";
import {push} from "./common/immutable";

export interface Contact {
    id: number;
    name: string;
}

export interface ContactsState {
  all: Contact[];
  filtered: Contact[];
  nextId: number;
}

@Injectable()
export class ContactService {
  store = ServiceStore.create<ContactsState>("contacts", {
    all: null,
    filtered: null,
    nextId: -1,
  });

  constructor() {
  }

  get state() {
    return this.store.getState();
  }

  init() {
    const all = [
      {"id": 1, "name": "Ori"},
      {"id": 2, "name": "Roni"},
    ];

    transaction(this.store, ()=> {
      this.store.update({
        all: all,
        filtered: all,
      });
    });
  }

  @Activity()
  filter(filter: string) {
    transaction(this.store, ()=> {
      this.store.update({
        filtered: this.state.all.filter(c => c.name.toLowerCase().indexOf(filter.toLowerCase())!=-1),
      });
    });
  }

  @Activity()
  add(name: string) {
    if(!name) {
      throw new Error("Name must be non empty");
    }

    this.transaction((store, state) => {
      const contact = {id: this.generateId(), name: name};

      store.update({
        all: push(state.all, contact)
      });

      this.filter()
    });
  }

  private generateId() {
    let id;

    this.transaction((store, state) => {
      id = state.nextId - 1;

      store.update({
        nextId: id,
      });
    });

    return id;
  }

  private transaction(action: (store: ServiceStore<ContactsState>, state: ContactsState)=>any) {
    return transaction(this.store, ()=> {
      return action(this.store, this.store.getState());
    });
  }
}

