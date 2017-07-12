import {configure} from "t-rex";

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { ContactListComponent } from './components/contact-list/contact-list.component';
import {RootService} from "./services/root.service";
import {ContactService} from "./services/contact.service";
import { ContactAddComponent } from './components/contact-add/contact-add.component';
import { ContactSearchComponent } from './components/contact-search/contact-search.component';

configure({
  enableLogging: true,
  activityAutoBeginTransaction: false,
  updateAutoBeginTransaction: true,
});

@NgModule({
  declarations: [
    AppComponent,
    ContactListComponent,
    ContactAddComponent,
    ContactSearchComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule
  ],
  providers: [
    RootService,
    ContactService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(rootService: RootService) {
    rootService.init();
  }
}
