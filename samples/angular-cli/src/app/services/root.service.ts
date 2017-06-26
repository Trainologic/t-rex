import { Injectable } from '@angular/core';
import {ContactService, ContactsState} from "./contact.service";
import {AppStore, configure} from "t-rex";

configure({
  enableLogging: true,
  activityAutoBeginTransaction: false,
  updateAutoBeginTransaction: true,
});

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

  addContact(name: string) {
    this.contactService.add(name);
  }
}
