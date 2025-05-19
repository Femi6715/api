import { Component, OnInit, OnDestroy } from '@angular/core';
import { CouponService } from '../services/coupon.service';
import * as moment from 'moment';
import { AuthService } from '../services/auth.service';
import { CountdownService } from '../services/countdown.service';
import { interval, Observable } from 'rxjs';
import { FlashMessagesService } from 'angular2-flash-messages';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css']
})
export class CategoriesComponent implements OnInit {

  secondsCounter = interval(100);
  oldate = moment();
  currentDate = this._countdown.currentDate;
  currentDay = this._countdown.currentDay;
  day = this._countdown.day;
  month = this._countdown.month;
  year = this._countdown.year;
  today = this.year + '-' + this.month + '-' + this.day;
  now = Date.now();
  user: any;
  newCount = this.today + ' 17:45:00';
  signalStatus = this._countdown.signalStatus;
  formattedToday = this.oldate.format('dddd');
  tommorrow = moment().add(1, 'days');
  formattedTomorrow = this.tommorrow.format('dddd');
  date = this.signalStatus ? this.formattedTomorrow : this.formattedToday;
  loading = false;
  all_categories: any;
  private apiUrl = 'http://localhost:3000/api';

  constructor(private categoryGetter: CouponService,
    private authService: AuthService,
    private _flashMessagesService: FlashMessagesService,
    private _countdown: CountdownService,
    private http: HttpClient) { }


    tomorrowday: number = this._countdown.tomorrowday;
    tomorrowmonth = this._countdown.tomorrowmonth;
    tomorrowyear = this._countdown.tomorrowyear;
    another_tomorrow = this.tomorrowyear + '-' + this.tomorrowmonth + '-' + this.tomorrowday;
    winners = 0;

    afterCountDown() {
    this.signalStatus = true;
    this.newCount = this.another_tomorrow + ' 17:45:00';
    this.date = this.formattedTomorrow;
    }

  getCategories(): Observable<any> {
    return this.http.get(`${this.apiUrl}/categories`);
  }

  ngOnInit() {
    this.loading = true;
    this.authService.getProfile().then(profile => {
      if (!('error' in profile)) {
        this.user = profile;
        if (this.user.main_balance < 25) {
          this._flashMessagesService.show(`Welcome ${this.user.firstname}.
  Get 100% bonus on your first deposit and 20% bonus on every other deposit above 1,000 Naira`, {cssClass: 'alert-info', timeout: 10000});
        }
      }
    });

    this.getCategories().subscribe(
      (data) => {
        this.all_categories = data;
        this.loading = false;
      },
      (error) => {
        console.error('Error fetching categories:', error);
        this.loading = false;
      }
    );
  }
}
