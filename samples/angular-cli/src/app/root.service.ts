import { Injectable } from '@angular/core';
import {ContactService, ContactServiceState} from "./contact.service";
import {AppStore} from "t-rex";

export interface AppState {
  contacts: ContactServiceState
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
}
