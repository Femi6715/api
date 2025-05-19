import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { phoneNumberValidator } from '../validators/phone-validator';
import { FlashMessagesService } from 'angular2-flash-messages';
import { CouponService } from '../services/coupon.service';
import { AuthService } from '../services/auth.service';
import { CountdownService } from '../services/countdown.service';
import { MyTicketsService } from '../services/my-tickets.service';
import { RandomService } from '../services/random.service';
import { ToastService } from '../services/toast.service';
import * as moment from 'moment';
import { interval, Subject } from 'rxjs';
import { takeUntil, filter, take } from 'rxjs/operators';
import 'rxjs/add/operator/filter';
import { BreakpointObserver } from '@angular/cdk/layout';

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.css']
})
export class PlayComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @Input() newRandMsg: string;
  angForm1: FormGroup;
  angForm2: FormGroup;
  angForm3: FormGroup;
  game_id: any;
  id: any;
  stake_amt: any;
  potential_winning: any;
  newUserInfo: object;
  user: any;
  last5tickets: any;
  updateData;
  newMain_balance: Number;
  public loading = false;
  message: any;
  editedMsg: any;
  account = this.api.loadUser();
  loggedInStatus: boolean = false;
  testing: any;
  final_list: any;
  isSmallScreen: boolean;
  collapse: string;

  secondsCounter = interval(100);
  oldate = moment();
  currentDate = this._countdown.currentDate;
  currentDay = this._countdown.currentDay;
  day = this._countdown.day;
  month = this._countdown.month;
  year = this._countdown.year;
  today = this.year + '-' + this.month + '-' + this.day;
  now = Date.now();
  draw_date: any;
  drawDate: any;
  nearestDrawId;
  newCount;
  signalStatus = this._countdown.signalStatus;
  formattedToday = this.oldate.format('dddd');
  tommorrow = moment().add(1, 'days');
  formattedTomorrow = this.tommorrow.format('dddd');
  date = this.signalStatus ? this.formattedTomorrow : this.formattedToday;
  all_categories: any;

  constructor(private route: ActivatedRoute,
    private fb: FormBuilder,
    private flashMessagesService: FlashMessagesService,
    private toastService: ToastService,
    private router: Router,
    private transaction_api: MyTicketsService,
    private someServ: RandomService,
    private _countdown: CountdownService,
    private api: CouponService,
    private authApi: AuthService,
    private breakpointObserver: BreakpointObserver) {
    this.isSmallScreen = breakpointObserver.isMatched('(max-width: 1200px)');
    this.collapse = this.isSmallScreen ? 'closed' : 'open';
    
    // Initialize forms with empty values
    this.angForm1 = this.fb.group({
      mobile_no: ['', [Validators.required, Validators.minLength(11), phoneNumberValidator]]
    });

    this.angForm2 = this.fb.group({
      mobile_no: ['', [Validators.required, Validators.minLength(11), phoneNumberValidator]]
    });

    this.angForm3 = this.fb.group({
      mobile_no: ['', [Validators.required, Validators.minLength(11), phoneNumberValidator]]
    });
  }

  async ngOnInit() {
    try {
      this.loading = true;
      
      // Check authentication first
      if (!this.authApi.isAuthenticated()) {
        this.router.navigate(['/login']);
        return;
      }

      // Subscribe to auth state changes
      this.authApi.currentUser
        .pipe(
          takeUntil(this.destroy$),
          filter(user => !!user)
        )
        .subscribe(user => {
          this.loggedInStatus = true;
          this.user = user;
          this.createForms();
        });

      // Get current user profile
      const profile = await this.authApi.refreshCurrentUserProfile();
      if (profile && !profile.error) {
        console.log('User profile loaded:', profile);
        this.user = {
          id: profile.id || profile._id,
          main_balance: profile.main_balance || profile.balance || 0,
          bonus: profile.bonus || 0,
          mobile_no: profile.mobile_no
        };
        
        // Update the random service with new balance
        this.someServ.editmsg(this.user.main_balance);
        this.someServ.editBonus(this.user.bonus);

        // Create forms with user's phone number
        this.createForms();
      } else {
        console.error('Failed to load profile:', profile && profile.error);
        this.toastService.error('Please log in to continue');
        this.router.navigate(['/login']);
        return;
      }

      // Get the ID from route params
      this.route.queryParams
        .pipe(
          takeUntil(this.destroy$),
          filter(params => params.id)
        )
        .subscribe(params => {
          this.id = params.id;
          window.scroll(0, 0);
          this.drawDate = this.drawTimer(parseInt(this.id, 10), 'dddd, MMMM Do');
          this.countdownDetector(res => this.newCount = res.draw_date + ' 23:45:00');
        });

      this.countdownDetector(callback => {
        this.newCount = callback;
      });

      this.detailsDetector(this.stake_amt || 0, response => {
        this.draw_date = response.draw_date;
        this.game_id = response.game_id;
      });
    } catch (error) {
      console.error('Error in ngOnInit:', error);
      this.toastService.error('An error occurred while loading the page');
    } finally {
      this.loading = false;
    }
  }

  createForms() {
    if (!this.user) return;
    
    // Update form values with user's phone number
    this.angForm1.patchValue({
      mobile_no: this.user.mobile_no || ''
    });

    this.angForm2.patchValue({
      mobile_no: this.user.mobile_no || ''
    });

    this.angForm3.patchValue({
      mobile_no: this.user.mobile_no || ''
    });
  }

  firstDraw = this.drawTimer(1, 'dddd, MMMM Do');
  secondDraw = this.drawTimer(3, 'dddd, MMMM Do');
  thirdDraw = this.drawTimer(5, 'dddd, MMMM Do');

  drawTimer(dayINeed, formatTpye) {
    const today = moment().isoWeekday();
    let targetDate;
    
    if (today <= dayINeed) {
      targetDate = moment().day(dayINeed);
    } else {
      targetDate = moment().add(1, 'weeks').day(dayINeed);
    }
    
    return targetDate.format(formatTpye);
  }
  afterCountDown() {
  this.signalStatus = false;
  this.countdownDetector(res => {
    this.newCount = res.draw_date + ' 23:45:00';
    this.date = res.draw_date;
  });
}

  randomString(length) {
    let result = '';
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = length; i > 0; --i) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  async registerGame(formName, stake_amt, potential_winning) {
    try {
      this.loading = true;
      const formData = formName.value;
      const day = new Date().getDate();
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      
      if (this.id === '1' || this.id === '3' || this.id === '5') {
        this.detailsDetector(stake_amt, response => {
          this.draw_date = response.draw_date;
          this.game_id = response.game_id;
        });
      }

      // Get fresh user data
      const profile = await this.authApi.refreshCurrentUserProfile();
      if (!profile || profile.error) {
        throw new Error('Failed to get user profile');
      }

      this.user = {
        id: profile.id || profile._id,
        main_balance: profile.main_balance || profile.balance || 0,
        bonus: profile.bonus || 0,
        mobile_no: profile.mobile_no
      };

      const reqData = {
        mobile_no: profile.mobile_no || formData.mobile_no,
        game_id: this.game_id,
        user_id: this.user.id,
        ticket_id: `SL${this.randomString(9)}`,
        stake_amt: stake_amt,
        potential_winning: potential_winning,
        time_stamp: Date.now(),
        draw_time: '11:45 PM',
        draw_date: this.draw_date,
        ticket_status: 'pending'
      };

      if (this.user.bonus >= reqData.stake_amt) {
        const newbonus = this.user.bonus - reqData.stake_amt;
        this.updateData = {
          user_id: this.user.id,
          main_balance: this.user.main_balance,
          bonus: newbonus
        };
        console.log('Using bonus for payment. Update data:', this.updateData);
      } else if (this.user.main_balance >= reqData.stake_amt) {
        this.newMain_balance = this.user.main_balance - reqData.stake_amt;
        this.updateData = {
          user_id: this.user.id,
          main_balance: this.newMain_balance,
          bonus: this.user.bonus
        };
        console.log('Using main balance for payment. Update data:', this.updateData);
      } else {
        this.updateData = undefined;
        console.warn('Insufficient funds for payment');
      }

      const newData = {
        user_id: this.user.id,
        amount_involved: reqData.stake_amt,
        transaction_type: 'ticket_purchase',
        acct_balance: this.newMain_balance,
        time_stamp: Date.now(),
        trans_date: `${day}-${month}-${year}`
      };

      if (this.updateData !== undefined) {
        // Ensure we are authenticated before making the request
        if (!this.authApi.isAuthenticated()) {
          window.scroll(0, 0);
          this.toastService.error('Please log in to continue');
          this.router.navigate(['/login']);
          return;
        }

        this.api.updateAcct(this.updateData)
          .pipe(takeUntil(this.destroy$))
          .subscribe(
          response => {
            if (response && response.success === true) {
              // Update local variables
              this.someServ.editmsg(String(this.updateData.main_balance));
              this.someServ.editBonus(String(this.updateData.bonus));
              
              // Also refresh the full user profile to update UI everywhere
              this.authApi.refreshCurrentUserProfile().then(updatedProfile => {
                if (updatedProfile && !('error' in updatedProfile)) {
                  console.log('User profile refreshed after transaction:', {
                    main_balance: updatedProfile.main_balance,
                    bonus: updatedProfile.bonus
                  });
                }
              });
              
              this.api.newTicket(reqData)
                .pipe(takeUntil(this.destroy$))
                .subscribe(
                ticketResponse => {
                  window.scroll(0, 0);
                  // Check if component is still alive before showing flash message
                  if (!this.destroy$.closed) {
                    this.toastService.success(ticketResponse.msg, 7000);
                  }
                  this.transaction_api.simpleTransaction(newData)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe(
                    result => {
                      console.log('Transaction recorded successfully:', result);
                    },
                    error => {
                      console.error('Transaction error:', error);
                      console.log('Proceeding despite transaction recording failure');
                    }
                  );
                },
                error => {
                  console.error('Ticket creation error:', error);
                  window.scroll(0, 0);
                  // Check if component is still alive before showing flash message
                  if (!this.destroy$.closed) {
                    this.toastService.error('Failed to create ticket');
                  }
                }
              );
            } else {
              window.scroll(0, 0);
              // Check if component is still alive before showing flash message
              if (!this.destroy$.closed) {
                this.toastService.error('Failed to update account');
              }
            }
          },
          error => {
            console.error('Account update error:', error);
            if (error.status === 401) {
              // Handle unauthorized error - refresh token or redirect to login
              // Check if component is still alive before showing flash message
              if (!this.destroy$.closed) {
                this.toastService.error('Session expired. Please log in again');
              }
              this.router.navigate(['/login']);
            } else {
              window.scroll(0, 0);
              // Check if component is still alive before showing flash message
              if (!this.destroy$.closed) {
                this.toastService.error('Failed to update account');
              }
            }
          }
        );
      } else {
        window.scroll(0, 0);
        // this.toastService.error('Insufficient balance, please deposit to play');
      }
    } catch (error) {
      console.error('Error in registerGame:', error);
      // Check if component is still alive before showing flash message
      if (!this.destroy$.closed) {
        this.toastService.error('An error occurred while processing your request');
      }
    } finally {
      this.loading = false;
      this.angForm1.reset();
      this.angForm2.reset();
      this.angForm3.reset();
    }
  }

  detailsDetector(stake_amt, callback) {
    const firstDrawDay = this.drawTimer(parseInt(this.id, 10), 'D');
    const firstDrawMonth = this.drawTimer(parseInt(this.id, 10), 'M');
    const firstDrawYear = this.drawTimer(parseInt(this.id, 10), 'Y');
    return callback({
      draw_date: `${firstDrawDay}-${firstDrawMonth}-${firstDrawYear}`,
      game_id: `Simple-${stake_amt}`
    });
  }

  countdownDetector(callback) {
    const firstDrawDay = this.drawTimer(parseInt(this.id, 10), 'D');
    const firstDrawMonth = this.drawTimer(parseInt(this.id, 10), 'M');
    const firstDrawYear = this.drawTimer(parseInt(this.id, 10), 'Y');
    return callback({
      draw_date: `${firstDrawYear}-${firstDrawMonth}-${firstDrawDay}`
    });
  }

  ngOnDestroy() {
    // Complete the subject to unsubscribe from all observables
    this.destroy$.next();
    this.destroy$.complete();
  }
}
