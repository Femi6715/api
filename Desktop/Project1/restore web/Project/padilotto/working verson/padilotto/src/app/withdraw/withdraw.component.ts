import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { phoneNumberValidator } from '../validators/phone-validator';
import { MoneymatterService } from '../services/moneymatter.service';
import { AuthService } from '../services/auth.service';
import { FlashMessagesService } from 'angular2-flash-messages';
import { MyTicketsService } from '../services/my-tickets.service';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-withdraw',
  templateUrl: './withdraw.component.html',
  styleUrls: ['./withdraw.component.css']
})
export class WithdrawComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  user: any;
  correctAcctDetails = false;
  transferDetails: any;
  withdraw: FormGroup;
  cashOut: FormGroup;
  account_name: any;
  account_number: any;
  bank_code: any;
  recipient_code: any;
  public loading = false;

  constructor(private authService: AuthService, private fb: FormBuilder,
     private payoutApi: MoneymatterService,
     private spinnerService: Ng4LoadingSpinnerService,
     private transaction_api: MyTicketsService,
     private _flashMessagesService: FlashMessagesService) { this.createForm(); }

  createForm() {
    this.withdraw = this.fb.group({
      acct_name: ['', Validators.required],
      acct_no: ['', Validators.required],
      bank: ['', [Validators.required, phoneNumberValidator]],
    });
    this.cashOut = this.fb.group({
      withdraw_amt: ['', [Validators.required, Validators.minLength(4), Validators.min(2000), phoneNumberValidator]]
    });
  }

  withdrawalForm() {
    const formData = this.withdraw.value;
    const reqData = {
      user_id: this.user._id,
      acct_name: formData.acct_name,
      acct_no: formData.acct_no,
      bank_code: formData.bank
    };

    this.loading = true;
    this.payoutApi.createPayout(reqData)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        // console.log(response);
        this.loading = false;
      }, error => console.log(error));
    this.loading = false;
  }

  proceed() {
    this.correctAcctDetails = true;
  }

  cashOutForm() {
    const day = new Date().getDate();
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();

    this.loading = true;
    const cashOutFormData = this.cashOut.value;
    if (this.user.main_balance >= cashOutFormData.withdraw_amt) {
      const cashOutData = {
        source: 'balance',
        amount: cashOutFormData.withdraw_amt,
        recipient: this.recipient_code,
        new_balance: (this.user.main_balance - cashOutFormData.withdraw_amt),
        bonus: this.user.bonus,
        user_id: this.user._id
      };
      const newData = {
        user_id: this.user._id,
        amount_involved: cashOutFormData.withdraw_amt,
        transaction_type: 'withdrawal',
        acct_balance: cashOutData.new_balance,
        time_stamp: Date.now(),
        trans_date: `${day}-${month}-${year}`
      };

      // this.spinnerService.show();
      this.payoutApi.cashOUt(cashOutData)
        .pipe(takeUntil(this.destroy$))
        .subscribe(response => {
          this.transaction_api.simpleTransaction(newData)
            .pipe(takeUntil(this.destroy$))
            .subscribe(cat => {
              return true;
            });
        });
    } else {
      // Only show flash message if component is still active
      if (!this.destroy$.closed) {
        this._flashMessagesService.show('Insufficient fund!', {cssClass: 'alert-danger', timeout: 12000});
      }
    }
    this.cashOut.reset();
    this.loading = false;
  }

  async ngOnInit() {
    // this.spinnerService.show();
    try {
      const profile = await this.authService.getCurrentUserProfile();
      if (profile) {
        this.user = profile;
        const data = {
          id: this.user.id
        };
        this.payoutApi.transferDetails(data)
          .pipe(takeUntil(this.destroy$))
          .subscribe((response: any) => {
            this.account_name = response.acct_name;
            this.account_number = response.acct_num;
            this.bank_code = response.bank_code;
            this.recipient_code = response.recipient_code;
            // console.log(response);
          });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
    // this.spinnerService.hide();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
