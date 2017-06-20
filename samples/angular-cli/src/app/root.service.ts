import { Injectable } from '@angular/core';
import {ContactService, ContactsState} from "./contact.service";
import {AppStore} from "t-rex";

export interface AppState {
  contacts: ContactsState
}

@Injectable()
export class RootService {
  constructor(private contactService: ContactService) {
    const appStore = new AppStore<AppState>();

    appStore.init([
      contactService
    ]);
  }

  init() {
    this.contactService.init();
  }

  addContact(name: string) {
    this.contactService.add(name);
  }
}
