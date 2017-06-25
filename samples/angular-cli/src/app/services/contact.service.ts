import { Injectable } from '@angular/core';
import {ServiceStore, Activity, push, dec} from "t-rex";
import {Reaction} from "t-rex/decorators";
import {contains} from "../common/stringHelpers";

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

  constructor() {
  }

  get state() {
    return this.store.getState();
  }

  @Activity()
  filter(filter: string) {
    this.store.update({
      filter: filter
    });
  }

  @Activity()
  add(name: string) {
    if(!name) {
      throw new Error("Name must be non empty");
    }

    const contact = {id: this.generateId(), name: name};

    this.store.update({
      all: push(contact)
    });
  }

  @Reaction()
  react() {
    this.store.update(state => ({
      filtered: state.all.filter(c => contains(c.name, state.filter))
    }));
  }

  private generateId(): number {
    return this.store.update("nextId", dec());
  }
}

