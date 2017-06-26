import { Component, OnInit } from '@angular/core';
import {ContactService} from "../../services/contact.service";

@Component({
  selector: 'app-contact-add',
  templateUrl: './contact-add.component.html',
  styleUrls: ['./contact-add.component.css']
})
export class ContactAddComponent {
  name: string;

  constructor(private contactService: ContactService) { }

  add() {
    this.contactService.add(this.name);
  }
}
