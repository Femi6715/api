import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { FlashMessagesService } from 'angular2-flash-messages';
import { Router } from '@angular/router';
import { CountdownService } from '../services/countdown.service';
import {MyTicketsService} from '../services/my-tickets.service';
import { RandomService } from '../services/random.service';
import * as moment from 'moment';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  @Input() newRandMsg: string;

  navigationSubscription;
  loggedInStatus: boolean;
  user: any;
  user_id: string;
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
  message: any;
  editedMsg: any;
  main_balance: number = 0;
  bonus: number = 0;
  user_main_balance: string = '0';
  user_bonus: string = '0';
  id: any;
  nearestDrawId;
  tommorrow = moment().add(1, 'days');
  oldate = moment();
  formattedToday = this.oldate.format('dddd');
  formattedTomorrow = this.tommorrow.format('dddd');
  date = this.signalStatus ? this.formattedTomorrow : this.formattedToday;

  constructor(private authService: AuthService,
              private router: Router,
              private winning_tickets: MyTicketsService,
              private _flashMessagesService: FlashMessagesService,
              private someServ: RandomService,
              private _countdown: CountdownService) {
    this.someServ.status$.subscribe(sts => this.loggedInStatus = sts);
    this.loadUserProfile();
  }

  async loadUserProfile() {
    try {
      const profile = await this.authService.getCurrentUserProfile();
      if (profile) {
        this.user = profile;
        this.main_balance = Number(profile.main_balance);
        this.bonus = Number(profile.bonus);
        this.user_id = this.user.user_id.substr(1, 8);
        
        // Fetch main and bonus values
        this.winning_tickets.getMainValue().subscribe(
          mainValue => {
            this.user_main_balance = String(mainValue);
            this.someServ.editmsg(String(mainValue));
          }
        );
        
        this.winning_tickets.getBonusValue().subscribe(
          bonusValue => {
            this.user_bonus = String(bonusValue);
            this.someServ.editBonus(String(bonusValue));
          }
        );
        
        // Subscribe to updates
        this.someServ.telecast.subscribe(msage => this.user_main_balance = String(msage));
        this.someServ.anotherTeleCast.subscribe(newBonus => this.user_bonus = String(newBonus));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  afterCountDown() {
    this.signalStatus = true;
    this.countdownDetector(res => {
      this.newCount = res.draw_date + ' 18:00:00';
      this.date = res.draw_date;
    });
  }

  drawTimer(dayINeed, formatTpye) {
    const today = moment().isoWeekday();
    if (today <= dayINeed) {
      return (moment().isoWeekday(dayINeed).format(formatTpye));
    } else {
      return (moment().add(1, 'weeks').isoWeekday(dayINeed).format(formatTpye));
    }
  }

  countdownDetector(callback) {
    const firstDrawDay = this.drawTimer(parseInt(this.id, 10), 'D');
    const firstDrawMonth = this.drawTimer(parseInt(this.id, 10), 'M');
    const firstDrawYear = this.drawTimer(parseInt(this.id, 10), 'Y');
    return callback({
      draw_date : `${firstDrawYear}-${firstDrawMonth}-${firstDrawDay}`
    });
  }

  onLogoutClick() {
    this.authService.logout();
    this.someServ.updateLoginStatus(this.authService.isLoggedIn());
    this.router.navigate(['/']);
    return false;
  }

  async ngOnInit() {
    this.someServ.status$.subscribe(async sts => {
      this.loggedInStatus = sts;
      if (this.loggedInStatus) {
        await this.loadUserProfile();
      }
    });
  }
}
