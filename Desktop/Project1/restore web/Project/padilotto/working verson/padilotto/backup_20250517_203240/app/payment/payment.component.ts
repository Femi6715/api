import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MoneymatterService } from '../services/moneymatter.service';
import { AuthService } from '../services/auth.service';
import { MyTicketsService } from '../services/my-tickets.service';
import { RandomService } from '../services/random.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  cancelPayment: any;
  reference = Math.floor((Math.random() * 100000000) + 1);
  depositAmount: number;
  user: any;
  main_balance: number;
  transStatus: any;
  transaction_type: any;
  reqData: any;
  public email:any;
  public new_bonus: number;
  public new_main_balance: number;
  newData: any;
  loading = false;


  constructor(private route: ActivatedRoute, private router: Router,
    private authApi: AuthService, private transaction_api: MyTicketsService,
    private someServ: RandomService,
    private money: MoneymatterService) {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(queryParams => {
      this.depositAmount = queryParams['deposit_amt'] * 100 || 0;
    });
  }

  depo() {
    const day = new Date().getDate();
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    const userID = {
      id: this.user._id
    };
    this.loading = true;
    this.transaction_api.checkTransStatus(userID)
      .pipe(takeUntil(this.destroy$))
      .subscribe((dataStatus: any) => {
      this.transStatus = (dataStatus.success);
      // console.log(this.transStatus);
      if (this.transStatus) {

        if (this.depositAmount >= 100000) {
          this.new_bonus = this.depositAmount + (this.depositAmount * 0.2);
          this.new_main_balance = this.user.main_balance;
        } else {
          this.new_bonus = 0;
          this.new_main_balance = this.user.main_balance + (this.depositAmount / 100);
        }

        } else {
          this.new_bonus = this.depositAmount * 2;
          this.new_main_balance = 0;
          }
          this.reqData = {
            depositAmount : this.depositAmount,
            reference: this.reference,
            user_id: this.user._id,
            main_balance: this.new_main_balance,
            bonus: this.user.bonus,
            new_bonus: this.new_bonus
          };
          this.money.verifyDeposit(this.reqData, this.reqData.reference)
            .pipe(takeUntil(this.destroy$))
            .subscribe(response => {
              this.newData = {
                user_id: this.user._id,
                amount_involved: (this.reqData.depositAmount / 100),
                transaction_type: 'deposit',
                acct_balance: (this.reqData.depositAmount / 100) + this.user.main_balance,
                time_stamp: Date.now(),
                trans_date: `${day}-${month}-${year}`
              };
              this.someServ.editmsg(this.reqData.main_balance);
              this.someServ.editBonus(this.reqData.bonus);
              this.transaction_api.simpleTransaction(this.newData)
                .pipe(takeUntil(this.destroy$))
                .subscribe(cat => {
                  // Only navigate if the component is still active
                  if (!this.destroy$.closed) {
                    this.router.navigate(['/']);
                  }
                  return true;
                });
          }, error => {
            console.log(error);
          });


    }, error => {
      console.log(error);
    });

    this.loading = false;
  }


  async ngOnInit() {
    try {
      const profile = await this.authApi.getCurrentUserProfile();
      if (profile) {
        this.user = profile;
        this.email = this.user.email;
        console.log(this.user.email);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
