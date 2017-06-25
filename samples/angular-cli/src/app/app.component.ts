import { Component } from '@angular/core';
import {ContactService} from "./services/contact.service";
import {RootService} from "./services/root.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor() {
  }
}
