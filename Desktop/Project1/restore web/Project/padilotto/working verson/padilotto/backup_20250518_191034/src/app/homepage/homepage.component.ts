import { Component, OnInit, HostListener, OnDestroy, Input } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AuthService } from '../services/auth.service';
import { FlashMessagesService } from 'angular2-flash-messages';
import { Router } from '@angular/router';
import { CountdownService } from '../services/countdown.service';
import {MyTicketsService} from '../services/my-tickets.service';
import { RandomService } from '../services/random.service';
import * as moment from 'moment';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {

  @Input() newRandMsg: string;

  isSmallScreen: boolean;
  navigationSubscription;
  loggedInStatus: any;
  user: { main_balance: any; username: any; bonus: any; user_id: string};
  user_main_balance: any;
  user_bonus: any;
  user_id: string;
  id: string;
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
  nearestDrawId;
  tommorrow = moment().add(1, 'days');
  oldate = moment();
  formattedToday = this.oldate.format('dddd');
  formattedTomorrow = this.tommorrow.format('dddd');
  date = this.signalStatus ? this.formattedTomorrow : this.formattedToday;
  name = 'home';
  homeBannerConfig = {
    slidesPerView: 1,
    loop: true,
    autoplay: true,
  }
  swiperConfig = {
    autoplay: true,
    loop: true,
    slidesPerView: 4,
    spaceBetween: 50,
    // init: false,
/*     pagination: {
      el: '.swiper-pagination',
      clickable: true,
    }, */
    breakpoints: {
      1024: {
        slidesPerView: 3,
        spaceBetween: 40,
      },
      768: {
        slidesPerView: 3,
        spaceBetween: 30,
      },
      640: {
        slidesPerView: 2,
        spaceBetween: 20,
      },
      320: {
        slidesPerView: 1,
        spaceBetween: 10,
      }
    }
  };

  @HostListener('window:resize', ['$event'])
  checkSize(ev) {
    if (ev.target.innerWidth < 599) {

      this.isSmallScreen = true;
    } else {

      this.isSmallScreen = false;
    }
  }

  constructor(breakpointObserver: BreakpointObserver, private router: Router,
    private someServ: RandomService, private winning_tickets: MyTicketsService, private authService: AuthService, private _countdown: CountdownService) {
    this.isSmallScreen = breakpointObserver.isMatched('(max-width: 599px)');
     
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
    this.someServ.status$.subscribe(sts => this.loggedInStatus = sts);
    try {
      // Check if user is authenticated
      if (!this.authService.isAuthenticated()) {
        console.log('User not logged in, homepage initialized without profile');
        return;
      }

      console.log('User authenticated, fetching profile...');
      // Fetch the latest user profile from backend
      await this.refreshUserProfile();
      
      // Set up polling to refresh profile data every 30 seconds
      setInterval(() => {
        if (this.authService.isAuthenticated()) {
          this.refreshUserProfile();
        }
      }, 30000);
    } catch (error) {
      console.error('Error in ngOnInit:', error);
    }
  }

  async refreshUserProfile() {
    try {
      // Check if user is authenticated
      if (!this.authService.isAuthenticated()) {
        console.log('Not authenticated, skipping profile refresh');
        return;
      }

      // Get latest profile data from server
      console.log('Refreshing user data from server...');
      const profile = await this.authService.refreshUserData();
      
      if ('error' in profile) {
        console.warn('Could not refresh profile from server:', profile.error);
        
        // Fallback to localStorage data
        const currentUserStr = localStorage.getItem('currentUser');
        if (currentUserStr) {
          try {
            const userData = JSON.parse(currentUserStr);
            console.log('Local storage user data:', userData);
            this.user = {
              main_balance: userData.main_balance || '0',
              username: userData.username || '',
              bonus: userData.bonus || '0',
              user_id: userData.id ? userData.id.toString() : ''
            };
            console.log('Using cached profile data for:', this.user.username, 'Main balance:', this.user.main_balance, 'Bonus:', this.user.bonus);
          } catch (e) {
            console.error('Error parsing stored user data:', e);
          }
        }
      } else {
        // Update with server data
        console.log('Profile data from server:', profile);
        this.user = {
          main_balance: profile.main_balance || '0',
          username: profile.username || '',
          bonus: profile.bonus || '0',
          user_id: profile.id ? profile.id.toString() : ''
        };
        console.log('Profile refreshed successfully for:', this.user.username, 'Main balance:', this.user.main_balance, 'Bonus:', this.user.bonus);
      }

      if (this.user.user_id) {
        this.user_id = this.user.user_id.length > 8 ? this.user.user_id.slice(-8) : this.user.user_id;
      } else {
        this.user_id = '';
      }

      // Update balance and bonus in service
      this.someServ.editmsg(this.user.main_balance);
      this.someServ.editBonus(this.user.bonus);
      
      // Subscribe to balance and bonus updates
      this.someServ.telecast.subscribe(msage => this.user_main_balance = msage);
      this.someServ.anotherTeleCast.subscribe(newBonus => this.user_bonus = newBonus);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  }

  onLogoutClick() {
    this.authService.logout();
    this.someServ.updateLoginStatus(false);
    this.router.navigate(['/']);
    return false;
  }
}
