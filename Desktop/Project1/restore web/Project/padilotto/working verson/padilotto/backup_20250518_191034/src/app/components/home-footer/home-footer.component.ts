import { Component, OnInit } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { FlashMessagesService } from 'angular2-flash-messages';
import { BreakpointObserver } from '@angular/cdk/layout';
import { RandomService } from 'src/app/services/random.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CountdownService } from 'src/app/services/countdown.service';
import {MyTicketsService} from 'src/app/services/my-tickets.service';
import * as moment from 'moment';

@Component({
  selector: 'app-home-footer',
  templateUrl: './home-footer.component.html',
  styleUrls: ['./home-footer.component.css']
})
export class HomeFooterComponent implements OnInit {

  

  hideTop = true;
  lastScrollTop = 0;
  isOpen = true;
  isSubOpen = true;
  loggedInStatus: any;
  showMenu = false;
  collapse = 'closed';
  isSmallScreen: boolean;
  user: any = {};
  user_main_balance: any;
  user_bonus: any;
  user_id: string;
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
  
  loading = true;
  error = '';

  toggleCollapse() {
    this.collapse = this.collapse == 'open' ? 'closed' : 'open';
    this.showMenu = !this.showMenu;
  }

 
  checkSize(ev) {
    if (ev.target.innerWidth < 1025) {
      this.collapse = 'closed';
      this.isSmallScreen = true;
    } else {
      this.collapse = 'open';
      this.isSmallScreen = false;
    }
  }

  
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
  constructor(breakpointObserver: BreakpointObserver, private router: Router,
    private someServ: RandomService, private winning_tickets: MyTicketsService, private authService: AuthService, private _countdown: CountdownService) {
    this.isSmallScreen = breakpointObserver.isMatched('(max-width: 1200px)');
    this.collapse = this.isSmallScreen ? 'closed' : 'open'; 
    // if (this.firstDraw < this.secondDraw && this.firstDraw < this.thirdDraw) {
                //   this.nearestDrawId = '1';
                // }  else if (this.secondDraw < this.firstDraw && this.secondDraw < this.thirdDraw) {
                //   this.nearestDrawId = '3';
                // } else  {
                //   this.nearestDrawId = '5';
                // }
                const newfirstDraw = this.drawTimer(1, 'DD');
                const newsecondDraw = this.drawTimer(3, 'DD');
                const newthirdDraw = this.drawTimer(5, 'DD');
                if (newfirstDraw < newsecondDraw && newfirstDraw < newthirdDraw) {
                  this.nearestDrawId = '1';
                }  else if (newsecondDraw < newfirstDraw && newsecondDraw < newthirdDraw) {
                  this.nearestDrawId = '3';
                } else  {
                  this.nearestDrawId = '5';
                }
               }

               firstDraw = this.drawTimer(1, 'dddd, MMMM Do');
               secondDraw = this.drawTimer(3, 'dddd, MMMM Do');
               thirdDraw = this.drawTimer(5, 'dddd, MMMM Do');

              afterCountDown() {
                this.signalStatus = true;
                this.countdownDetector(res => {
                  this.newCount = res.draw_date + ' 23:45:00';
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
    

  async ngOnInit() {
    this.hideTop = false;
    // Check the login status
    this.someServ.status$.subscribe(sts => this.loggedInStatus = sts);

    try {
      const profile = this.authService.getCurrentUserProfile();
      if (profile) {
        this.user = profile;
      } else {
        // If no profile, try to refresh from API
        const userResult = await this.authService.refreshUserData();
        if ('error' in userResult) {
          this.error = userResult.error;
        } else {
          this.user = userResult;
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      this.error = 'Error loading profile';
    } finally {
      this.loading = false;
    }
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }

  onLogoutClick() {
    this.authService.logout();
    this.someServ.updateLoginStatus(false);
    this.router.navigate(['/']);
    return false;
  }
}



