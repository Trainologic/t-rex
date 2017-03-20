import { Component } from '@angular/core';
import {Contact, ContactsState, ContactsService} from "../services/contacts.service";
import {AuthState, AuthService} from "../services/auth.service";
import {AppActivities} from "../services/appActivities.service";

@Component({
  selector: "my-app",
  moduleId: module.id,
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent {
  contacts: ContactsState;
  auth: AuthState;

  constructor(private appActivities: AppActivities) {
  }

  ngOnInit() {
    this.appActivities.store.subscribe(state => {
      this.contacts = state.contacts;
      this.auth = state.auth;
    });
  }

  isLoggedIn() {
    return this.auth && this.auth.user;
  }

  login() {
    this.appActivities.login("oric", "123");
  }

  logout() {
    this.appActivities.logout();
  }
}
