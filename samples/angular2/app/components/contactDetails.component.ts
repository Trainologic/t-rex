import {Component, Input} from '@angular/core';
import {Contact} from "../services/contacts.service";
import {createLogger} from "t-rex/logger";

@Component({
  selector: "my-contact-details",
  moduleId: module.id,
  templateUrl: "./contactDetails.component.html",
  styleUrls: ["./contactDetails.component.css"]
})
export class ContactDetailsComponent {
  @Input() contact: Contact;
  selected: boolean;

  constructor() {
  }

  ngOnChanges(changes) {
  }

  ngOnDestroy() {
  }
}
