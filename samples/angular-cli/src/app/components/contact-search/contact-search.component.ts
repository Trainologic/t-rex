import { Component, OnInit } from '@angular/core';
import {ContactService} from "../../services/contact.service";

@Component({
  selector: 'app-contact-search',
  templateUrl: './contact-search.component.html',
  styleUrls: ['./contact-search.component.css']
})
export class ContactSearchComponent implements OnInit {
  filter: string;

  constructor(private contactService: ContactService) { }

  ngOnInit() {
  }

  search(filter) {
    this.contactService.filter(filter);
  }
}
