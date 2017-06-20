import { Component } from '@angular/core';
import {ContactService} from "./contact.service";
import {RootService} from "./root.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  filter: string;

  constructor(private contactService: ContactService) {
  }

  filter(filter) {
    this.contactService.filter(filter);
  }
}
