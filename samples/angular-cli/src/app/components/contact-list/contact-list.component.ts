import { Component, OnInit } from '@angular/core';
import {ContactService} from "../../services/contact.service";

@Component({
  selector: 'app-contact-list',
  templateUrl: './contact-list.component.html',
  styleUrls: ['./contact-list.component.css']
})
export class ContactListComponent {
  constructor(private contactService: ContactService) { }

  get contacts() {
    return this.contactService.state.filtered;
  }
}
