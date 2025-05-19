import { Component, OnInit } from '@angular/core';
import {MyTicketsService} from '../services/my-tickets.service';
import {AuthService} from '../services/auth.service';
import { interval } from 'rxjs';
import { CountdownService } from '../services/countdown.service';
import {FilterPipe} from '../filter.pipe';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { Router } from '@angular/router';

@Component({
  selector: 'app-winning-tickets',
  templateUrl: './winning-tickets.component.html',
  styleUrls: ['./winning-tickets.component.css'],
  providers: [FilterPipe]
})
export class WinningTicketsComponent implements OnInit {

  p: number = 1;
  user: any;
  term: any;
  secondsCounter = interval(500);
  public winningTickets: any;
  public winners: any;
  recent25kWinningTickets: any;
  recent50kWinningTickets: any;
  recent100kWinningTickets: any;
  arr: any;
  status: any;
  signalStatus = this._countdown.signalStatus;
  count: any;
  public loading = false;
  menu1Signal = true;
  menu2Signal = false;
  menu3Signal = false;

  constructor(private winning_tickets: MyTicketsService,
     private auth: AuthService,
     private spinnerService: Ng4LoadingSpinnerService,
     private _countdown: CountdownService,
     private router: Router) {
    //   this.winning_tickets.getWinningTickets()
    //   .subscribe(res => {this.winningTickets = res;
    // }, error => {
    //     console.log(`The shuffling is not working at the moment: ${error}`);
    //     console.log(error);
    //   });
      }

  currentDate = this._countdown.currentDate;
  currentDay = this._countdown.currentDay;
  day = this._countdown.day;
  month = this._countdown.month;
  year = this._countdown.year;

  today = this.year + '-' + this.month + '-' + this.day;
  now = Date.now();
  newCount = this.today + ' 18:00:00';

  tomorrowday: number = this._countdown.tomorrowday;
  tomorrowmonth = this._countdown.tomorrowmonth;
  tomorrowyear = this._countdown.tomorrowyear;
  another_tomorrow = this.tomorrowyear + '-' + this.tomorrowmonth + '-' + this.tomorrowday;


  afterCountDown() {
    this.signalStatus = true;
    this.newCount = this.another_tomorrow + ' 18:00:00';
  }

  menu1() {
    this.menu1Signal = true;
    this.menu2Signal = false;
    this.menu3Signal = false;
  }

  menu2() {
    this.menu1Signal = false;
    this.menu2Signal = true;
    this.menu3Signal = false;
  }
  menu3() {
    this.menu1Signal = false;
    this.menu2Signal = false;
    this.menu3Signal = true;
  }

  async ngOnInit() {
    this.loading = true;
    
    // Check if user is authenticated
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      // Get user profile first
      const profile = await this.auth.getCurrentUserProfile();
      if (profile && !('error' in profile)) {
        this.user = profile;
        
        // Now make the API calls
        this.winning_tickets.getWinningTickets()
          .subscribe(
            (res: any[]) => {
              this.winningTickets = res.reverse();
              this.loading = false;
            },
            error => {
              console.error('Error fetching winning tickets:', error);
              this.loading = false;
            }
          );

        this.winning_tickets.getPast25kWinners()
          .subscribe(
            (res: any[]) => {
              this.recent25kWinningTickets = res.reverse();
              this.loading = false;
            },
            error => {
              console.error('Error fetching 25k winners:', error);
              this.loading = false;
            }
          );

        this.winning_tickets.getPast50kWinners()
          .subscribe(
            (res: any[]) => {
              this.recent50kWinningTickets = res.reverse();
              this.loading = false;
            },
            error => {
              console.error('Error fetching 50k winners:', error);
              this.loading = false;
            }
          );

        this.winning_tickets.getPast100kWinners()
          .subscribe(
            (res: any[]) => {
              this.recent100kWinningTickets = res.reverse();
              this.loading = false;
            },
            error => {
              console.error('Error fetching 100k winners:', error);
              this.loading = false;
            }
          );
      } else {
        console.error('Failed to load profile:', profile);
        this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error('Error in ngOnInit:', error);
      this.loading = false;
    }
  }
    

}
