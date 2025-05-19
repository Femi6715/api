import { Component, OnInit, HostListener, OnDestroy, Input } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { FlashMessagesService } from 'angular2-flash-messages';
import { BreakpointObserver } from '@angular/cdk/layout';
import { RandomService } from 'src/app/services/random.service';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { CountdownService } from 'src/app/services/countdown.service';
import {MyTicketsService} from 'src/app/services/my-tickets.service';
import * as moment from 'moment';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  animations: [
    trigger('openClose', [
      // ...
      state('open', style({
        opacity: 1,
        // backgroundColor: 'yellow'
      })),
      state('closed', style({
        visibility: 'hidden',
        opacity: 0,
        height: 0,
        margin: '-5px',
        padding: 0
        // backgroundColor: 'green'
      })),
      transition('open => closed', [
        animate('0.3s')
      ]),
      transition('closed => open', [
        animate('0.3s')
      ]),
    ]),
    trigger('collapse', [
      state('open', style({
        opacity: '1',
        display: 'block',
        transform: 'translate3d(0, 0, 0)',
      })),
      state('closed',   style({
        opacity: '0',
        display: 'none',
        transform: 'translate3d(0, -100%, 0)'
      })),
      transition('closed => open', animate('400ms ease-in')),
      transition('open => closed', animate('200ms ease-out'))
    ])
  ],
})
export class NavbarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Input() newRandMsg: string;

  hideTop = true;
  lastScrollTop = 0;
  isOpen = true;
  isSubOpen = true;
  loggedInStatus: boolean = false;
  showMenu = false;
  collapse: string = 'open';
  isSmallScreen: boolean;
  user: any = {
    main_balance: 0,
    username: '',
    bonus: 0,
    user_id: ''
  };
  user_id: string = '';
  user_main_balance: number = 0;
  user_bonus: number = 0;
  message: any;
  editedMsg: any;
  
  navigationSubscription;
  public my_countdown = [];
  signalStatus = this._countdown.signalStatus;
  currentDate = this._countdown.currentDate;
  currentDay = this._countdown.currentDay;
  day = this._countdown.day;
  month = this._countdown.month;
  year = this._countdown.year;
  today = this.year + '-' + this.month + '-' + this.day;
  now = Date.now();
  newCount = this.today + ' 17:45:00';
  id: any;
  nearestDrawId;
  tommorrow = moment().add(1, 'days');
  oldate = moment();
  formattedToday = this.oldate.format('dddd');
  formattedTomorrow = this.tommorrow.format('dddd');
  date = this.signalStatus ? this.formattedTomorrow : this.formattedToday;
  

  toggleCollapse() {
    this.collapse = this.collapse == 'open' ? 'closed' : 'open';
    this.showMenu = !this.showMenu;
  }

  @HostListener('window:resize', ['$event'])
  checkSize(ev) {
    if (ev.target.innerWidth < 1025) {
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
    console.log(st);
    if (st > this.lastScrollTop) {
       // downscroll code
       this.isOpen = false;
    } else {
      this.isOpen = true;
       // upscroll code
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
    
    // Initialize login status from auth service
    this.loggedInStatus = this.authService.isLoggedIn();
    
    // Subscribe to login status changes
    this.someServ.loginStatus$.subscribe(status => {
      this.loggedInStatus = status;
      if (status) {
        this.loadUserProfile();
      }
    });
  }

  async loadUserProfile() {
    try {
      const profile = await this.authService.getCurrentUserProfile();
      if (profile) {
        this.user = profile;
        this.user_id = profile.id ? String(profile.id) : '';
        this.user_main_balance = Number(profile.main_balance) || 0;
        this.user_bonus = Number(profile.bonus) || 0;
        
        console.log('User profile loaded:', {
          username: profile.username,
          main_balance: profile.main_balance,
          bonus: profile.bonus
        });
        
        this.someServ.editmsg(String(profile.main_balance));
        this.someServ.editBonus(String(profile.bonus));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  async ngOnInit() {
    this.hideTop = false;
    
    // Load user profile if logged in
    if (this.loggedInStatus) {
      await this.loadUserProfile();
    }
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }

  onLogoutClick() {
    this.authService.logout();
    this.someServ.updateLoginStatus(false);
    this.router.navigate(['/login']);
    return false;
  }

  toggleMobileMenu(event: Event, menuItem: HTMLElement) {
    event.preventDefault();
    menuItem.classList.toggle('active');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}


