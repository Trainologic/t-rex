import {Component, Input} from '@angular/core';
import {Contact, ContactVM} from "../services/contacts.service";

@Component({
  selector: "my-contact-list",
  moduleId: module.id,
  templateUrl: "./contactList.component.html",
  styleUrls: ["./contactList.component.css"]
})
export class ContactListComponent {
  @Input() contacts: ContactVM[];

  constructor() {
  }

  ngOnChanges(changes) {
  }

  dump() {
    for(let c of this.contacts) {
      console.log(c.name + ", " + c.selected);
    }
  }

  identify(index, contact) {
    return index;
  }
}
