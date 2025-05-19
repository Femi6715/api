import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
declare var $: any;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  hidden: boolean;
  constructor(private router: Router) {
    this.checkEvents();
 }

/*the router events is used to show and hde the navbar */
checkEvents() {
  this.router.events.subscribe(event => {
    switch (true) {
      case event instanceof NavigationEnd:
        if (event['url'] === '/') {
          console.log('Home');
          this.hidden = true;
        } else {
          this.hidden = false;
        }
        break;

      default:
        break;
    }
  });
}
}
