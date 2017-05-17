import { Component, OnInit } from '@angular/core';
import {ContactService} from "../contact.service";

@Component({
  selector: 'app-contact-list',
  templateUrl: './contact-list.component.html',
  styleUrls: ['./contact-list.component.css']
})
export class ContactListComponent implements OnInit {
  constructor(private contactService: ContactService) { }

  ngOnInit() {
  }

  get contacts() {
    return this.contactService.state.filtered;
  }
}
