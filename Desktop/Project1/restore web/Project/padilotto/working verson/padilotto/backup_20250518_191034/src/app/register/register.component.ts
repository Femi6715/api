import { Component, OnInit } from '@angular/core';
import { RegisterService } from '../services/register.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { FlashMessagesService } from 'angular2-flash-messages';
import { Router } from '@angular/router';
import { phoneNumberValidator } from '../validators/phone-validator';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  // result: string;
  submitted = false;
  loading = false;
  nextForm = false;
  dayOfBirth = [];
  yearOfBirth = [];
  angForm: FormGroup;
  currentDay = new Date(new Date().getTime());
  year = this.currentDay.getFullYear();

  constructor(private fb: FormBuilder,
               private api: RegisterService,
               private _flashMessagesService: FlashMessagesService,
               private router: Router) {
    this.createForm();
                for (let i = 1; i <= 31; i++) {
                  this.dayOfBirth.push(i);
                }
                for (let i = 1900; i <= (this.year - 18); i++) {
                  this.yearOfBirth.push(i);
                }
  }

  otherForm() {
    this.nextForm = true;
  }
  reloadForm() {
    this.nextForm = false;
  }

  createForm() {
    this.angForm = this.fb.group({
      surname: ['', Validators.required],
      firstname: ['', Validators.required],
      gender: ['', Validators.required],
      dayOfB: ['', Validators.required],
      monthOfB: ['', Validators.required],
      yearOfB: ['', Validators.required],
      state: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', Validators.required],
      confirm_password: ['', Validators.required],
      email: ['', Validators.email],
      mobile_no: ['', [Validators.required, phoneNumberValidator]],
      main_balance: ['0', Validators.required],
      bonus: ['0', Validators.required]

    });
  }


  registerUser() {
    this.loading = true;
    const formData = this.angForm.value;
    const reqData = {
      surname: formData.surname,
      firstname: formData.firstname,
      // gender: formData.gender,
      // dob: `${formData.dayOfB}-${formData.monthOfB}-${formData.yearOfB}`,
      gender: 'gender',
      dob: 'dob',
      state: formData.state,
      email: formData.email,
      mobile_no: formData.mobile_no,
      main_balance: formData.main_balance,
      bonus: formData.bonus,
      username: formData.username,
      password: formData.password,
      confirm_password: formData.confirm_password
    };
    if (reqData.password === reqData.confirm_password) {
      this.api.registerUser(reqData)
      .subscribe(response => {
        if (response.success) {
          window.scroll(0, 0);
          this._flashMessagesService.show('Registration Successful, you can now log in', {cssClass: 'alert-success', timeout: 12000 });
          this.angForm.reset();
          this.nextForm = false;
          // this.router.navigate(['/']);
        } else {
          window.scroll(0, 0);
          this._flashMessagesService.show(response.msg, {cssClass: 'alert-info', timeout: 12000 });
          console.log(response.msg);
        }
      }, error => {
        window.scroll(0, 0);
        console.log(error);
        this._flashMessagesService.show('Oops. we\'ve got a serious problem', {cssClass: 'alert-danger'});
      });
    } else {
      window.scroll(0, 0);
      this._flashMessagesService.show('PASSWORD does not match CONFIRM PASSWORD', {cssClass: 'alert-info', timeout: 12000 });
    }

      this.loading = false;

  }



  ngOnInit() {
    // const a = ['Polaris', 'Alderbaran' , 'Deneb' , 'Vega' , 'Attair' , 'Dubhe' , 'Regulus'];
    // const b = ['Usra', 'Minor', 'Tarus', 'Cygnus', 'Lyra', 'Aquila', 'UrsaMajor', 'Leo'];

    // const star_checker = (star_name) => {
    //   for (let i = 0; i < a.length; i++) {
    //     if (star_name === a[i]) {
    //       this.result = (b[i]);
    //     } else {
    //       this.result = 'Star Not Found';
    //     }
    //   }
    //   console.log(this.result);
    // };

    // star_checker('Polaris');
  }

}
