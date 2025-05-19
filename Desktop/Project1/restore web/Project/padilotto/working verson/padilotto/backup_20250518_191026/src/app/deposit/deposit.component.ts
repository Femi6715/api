import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { phoneNumberValidator } from '../validators/phone-validator';
import { Router } from '@angular/router';

@Component({
  selector: 'app-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.css']
})
export class DepositComponent implements OnInit {

  constructor(private fb: FormBuilder,
    private router: Router) {
      this.createForm3();
      }

  submitted: any;
  angForm3: FormGroup;
  depositValue = [];
  loading = false;

  revert() {
    this.angForm3.reset();
  }

  createForm3() {
    this.angForm3 = this.fb.group({
      deposit_amt: ['', [Validators.required, Validators.minLength(4), phoneNumberValidator]]
    });
  }

  onSubmit() {
    this.loading = true;
    const formData = this.angForm3.value;
    console.log(formData);
   this.router.navigate(['/payment'], { queryParams: formData});
   this.loading = false;
  }

//   onSubmit() {
//     this.loading = true;
//     this.depositForm = this.fb.group({
//       depositAmt: ['', [Validators.required, Validators.minLength(3), phoneNumberValidator]]
//     });
//     const formData = this.depositForm.value;
//     this.depositValue = formData.depositAmt;
//     if (this.depositForm.invalid) {
//       return false;
//   }
//  // alert('SUCCESS!! :-)\n\n' + JSON.stringify(this.depositValue));
//    this.router.navigate(['/payment'], { queryParams: {amt: this.depositValue}});
//    this.loading = false;

//   }
//   get f() { return this.depositForm.controls; }


  ngOnInit() {

  }

}
