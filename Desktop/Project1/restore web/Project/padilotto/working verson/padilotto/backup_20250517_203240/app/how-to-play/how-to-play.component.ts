import { Component, OnInit, HostListener, OnDestroy, Input } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { FlashMessagesService } from 'angular2-flash-messages';
import { BreakpointObserver } from '@angular/cdk/layout';
import { RandomService } from '../services/random.service';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { CountdownService } from 'src/app/services/countdown.service';
import {MyTicketsService} from 'src/app/services/my-tickets.service';
import * as moment from 'moment';

@Component({
  selector: 'app-how-to-play',
  templateUrl: './how-to-play.component.html',
  styleUrls: ['./how-to-play.component.css']
})
export class HowToPlayComponent implements OnInit {

  @Input() newRandMsg: string;

  hideTop = true;
  lastScrollTop = 0;
  isOpen = true;
  isSubOpen = true;
  loggedInStatus: any;
  showMenu = false;
  collapse = 'closed';
  isSmallScreen: boolean;
  user: { main_balance: string; username: string; bonus: string; user_id: string } | null = null;
  user_main_balance: string = '0';
  user_bonus: string = '0';
  user_id: string = '';
  message: string = '';
  editedMsg: string = '';
  
  navigationSubscription: any;
  public my_countdown: any[] = [];
  signalStatus: boolean = false;
  currentDate: string = '';
  currentDay: string = '';
  day: string = '';
  month: string = '';
  year: string = '';
  today: string = '';
  now: number = Date.now();
  newCount: string = '';
  id: string = '';
  nearestDrawId: string = '';
  tommorrow = moment().add(1, 'days');
  oldate = moment();
  formattedToday: string = '';
  formattedTomorrow: string = '';
  date: string = '';
  

  toggleCollapse() {
    this.collapse = this.collapse === 'open' ? 'closed' : 'open';
    this.showMenu = !this.showMenu;
  }

  @HostListener('window:resize', ['$event'])
  checkSize(ev: Event) {
    if (ev.target && (ev.target as Window).innerWidth < 1025) {
      this.collapse = 'closed';
      this.isSmallScreen = true;
    } else {
      this.collapse = 'open';
      this.isSmallScreen = false;
    }
  }

  @HostListener('window:scroll', ['$event'])
  checkScroll() {
    const st = window.pageYOffset || document.documentElement.scrollTop;
    if (st > this.lastScrollTop) {
      this.isOpen = false;
    } else {
      this.isOpen = true;
    }
    if (st === 0) {
      this.isSubOpen = true;
    } else {
      this.isSubOpen = false;
    }
    this.lastScrollTop = st <= 0 ? 0 : st;
  }

  constructor(
    breakpointObserver: BreakpointObserver,
    private router: Router,
    private someServ: RandomService,
    private winning_tickets: MyTicketsService,
    private authService: AuthService,
    private _countdown: CountdownService
  ) {
    this.isSmallScreen = breakpointObserver.isMatched('(max-width: 1200px)');
    this.collapse = this.isSmallScreen ? 'closed' : 'open';

    const newfirstDraw = this.drawTimer(1, 'DD');
    const newsecondDraw = this.drawTimer(3, 'DD');
    const newthirdDraw = this.drawTimer(5, 'DD');

    if (newfirstDraw < newsecondDraw && newfirstDraw < newthirdDraw) {
      this.nearestDrawId = '1';
    } else if (newsecondDraw < newfirstDraw && newsecondDraw < newthirdDraw) {
      this.nearestDrawId = '3';
    } else {
      this.nearestDrawId = '5';
    }

    this.formattedToday = this.oldate.format('dddd');
    this.formattedTomorrow = this.tommorrow.format('dddd');
    this.date = this.signalStatus ? this.formattedTomorrow : this.formattedToday;
  }

  drawTimer(dayINeed: number, formatType: string): string {
    const today = moment().isoWeekday();
    if (today <= dayINeed) {
      return moment().isoWeekday(dayINeed).format(formatType);
    } else {
      return moment().add(1, 'weeks').isoWeekday(dayINeed).format(formatType);
    }
  }

  countdownDetector(callback: (res: { draw_date: string }) => void) {
    const firstDrawDay = this.drawTimer(parseInt(this.id, 10), 'D');
    const firstDrawMonth = this.drawTimer(parseInt(this.id, 10), 'M');
    const firstDrawYear = this.drawTimer(parseInt(this.id, 10), 'Y');
    callback({
      draw_date: `${firstDrawYear}-${firstDrawMonth}-${firstDrawDay}`
    });
  }

  async ngOnInit() {
    this.hideTop = false;
    // Check the login status
    this.someServ.status$.subscribe(sts => this.loggedInStatus = sts);

    // Getting User
    try {
      const profile = await this.authService.getCurrentUserProfile();
      if (profile) {
        this.user = {
          main_balance: String(profile.main_balance || 0),
          username: profile.username || '',
          bonus: String(profile.bonus || 0),
          user_id: String(profile.id || '')
        };
        if (this.user) {
          this.user_id = this.user.user_id.substr(1, 8);
          this.someServ.editmsg(this.user.main_balance);
          this.someServ.editBonus(this.user.bonus);
          this.someServ.telecast.subscribe(msage => this.user_main_balance = msage);
          this.someServ.anotherTeleCast.subscribe(newBonus => this.user_bonus = newBonus);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }

    if (this.authService.isLoggedIn()) {
      // Your authenticated logic here
    }
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }

  onLogoutClick() {
    this.authService.logout();
    this.someServ.updateLoginStatus(this.authService.isLoggedIn());
    this.router.navigate(['/']);
    return false;
  }
}


