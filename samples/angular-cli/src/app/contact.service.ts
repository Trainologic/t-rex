import { Injectable } from '@angular/core';
import {Activity, ServiceStore, transaction} from "t-rex";

export interface Contact {
    id: number;
    name: string;
}

export interface ContactServiceState {
  all: Contact[],
  filtered: Contact[],
}

@Injectable()
export class ContactService {
  store = ServiceStore.create<ContactServiceState>("contacts", {
    all: null,
    filtered: null
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
}

