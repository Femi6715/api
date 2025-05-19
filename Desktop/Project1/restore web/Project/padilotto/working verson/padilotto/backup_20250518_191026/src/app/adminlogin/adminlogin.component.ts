import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { FlashMessagesService } from 'angular2-flash-messages';
import { Router, Route } from '@angular/router';

@Component({
  selector: 'app-adminlogin',
  templateUrl: './adminlogin.component.html',
  styleUrls: ['./adminlogin.component.css']
})
export class AdminloginComponent implements OnInit {

  angForm: FormGroup;

  constructor(private fb: FormBuilder,
    private authService: AuthService,
    private flashMessagesService: FlashMessagesService,
    private router: Router) { this.createForm(); }

  createForm() {
    this.angForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }
  ngOnInit() {
  }

  loginSubmit() {
    const formData = this.angForm.value;
    const reqData = {
      username: formData.username,
      password: formData.password
    };

    // this.authService.authenticateAdmin(reqData)
    // .subscribe(response => {
    //   if (response.success) {
    //     this.authService.storeUserData(response.token, response.user);
    //     this.flashMessagesService.show('You are now logged in', {cssClass: 'alert-success', timeout: 3000});
    //    // console.log(response.msg);
    //     this.router.navigate(['/categories']);
    //   } else {
    //     this.flashMessagesService.show(response.msg, {cssClass: 'alert-danger', timeout: 3000});
    //   //  console.log(response.msg);
    //     this.router.navigate(['/']);
    //   }
    // }, error => {

    // });
  }

}
