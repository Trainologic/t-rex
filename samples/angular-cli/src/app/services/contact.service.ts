import { Injectable } from '@angular/core';
import {ServiceStore, Activity, push, dec, transaction} from "t-rex";
import {Reaction} from "t-rex";
import {contains} from "../common/stringHelpers";
import {Http} from "@angular/http";
import "rxjs/add/operator/toPromise";

export interface Contact {
    id: number;
    name: string;
}

export interface ContactsState {
  all: Contact[];
  filtered: Contact[];
  filter: string;
  nextId: number;
}

@Injectable()
export class ContactService {
  store = ServiceStore.create<ContactsState>("contacts", {
    all: [
      {"id": 1, "name": "Ori"},
      {"id": 2, "name": "Roni"},
    ],
    filtered: null,
    filter: "",
    nextId: -1,
  });

  constructor(private http: Http) {
  }

  get state() {
    return this.store.getState();
  }

  @Activity()
  async init() {
    await this.refresh();
  }

  filter(filter: string) {
    this.store.update({
      filter: filter
    });
  }

  @Activity()
  async add(name: string) {
    if(!name) {
      throw new Error("Name must be non empty");
    }

    await delay(1000);

    return transaction(this.store, ()=> {
      const contact = {id: this.generateId(), name: name};

      this.store.update({
        all: push(contact)
      });

      return contact;
    });
  }

  @Reaction()
  react() {
    this.store.update(state => ({
      filtered: state.all.filter(c => contains(c.name, state.filter, false))
    }));
  }

  private generateId(): number {
    return this.store.update("nextId", dec());
  }

  @Activity()
  async refresh() {
    const res = await this.http.get("/assets/contacts.json").toPromise();
    const contacts = res.json();

    this.store.update({
      all: contacts
    });

    return contacts;
  }
}

function delay(ms) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve();
    }, ms);
  });
}
