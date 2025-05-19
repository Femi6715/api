import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { FlashMessagesService } from 'angular2-flash-messages';
import { RandomService } from '../services/random.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: any;
  profileForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private flashMessagesService: FlashMessagesService,
    private authService: AuthService,
    private someServ: RandomService,
    private router: Router
  ) {
    this.createForm();
  }

  createForm() {
    this.profileForm = this.fb.group({
      _id: [''],
      surname: ['', Validators.required],
      firstname: ['', Validators.required],
      state: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      mobile_no: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
      username: ['', Validators.required],
      old_password: ['', Validators.minLength(6)],
      password: ['', Validators.minLength(6)],
      confirm_password: ['', Validators.minLength(6)],
      main_balance: [0],
      bonus: [0]
    });
  }

  updateUser() {
    this.loading = true;
    const formData = this.profileForm.value;
    
    if (formData.password && formData.password !== formData.confirm_password) {
      this.flashMessagesService.show('Password does not match confirm password', {
        cssClass: 'alert-danger',
        timeout: 5000
      });
      this.loading = false;
      return;
    }

    const reqData = {
      user_id: this.user.id,
      surname: this.user.surname,
      firstname: this.user.firstname,
      username: this.user.username,
      state: formData.state,
      email: formData.email,
      mobile_no: formData.mobile_no,
      old_password: formData.old_password,
      password: formData.password
    };

    this.authService.updateUser(this.user.id, reqData)
      .then(response => {
        this.loading = false;
        this.flashMessagesService.show('Profile updated successfully', {
          cssClass: 'alert-success',
          timeout: 5000
        });
      })
      .catch(error => {
        this.loading = false;
        this.flashMessagesService.show(error.message || 'Failed to update profile', {
          cssClass: 'alert-danger',
          timeout: 5000
        });
      });
  }

  async ngOnInit() {
    try {
      const profile = await this.authService.getCurrentUserProfile();
      if (profile) {
        this.user = profile;
        this.profileForm.patchValue({
          _id: profile.id,
          surname: profile.surname || '',
          firstname: profile.firstname || '',
          state: profile.state || '',
          email: profile.email || '',
          mobile_no: profile.mobile_no || '',
          username: profile.username || '',
          main_balance: profile.main_balance || 0,
          bonus: profile.bonus || 0
        });
      } else {
        this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      this.router.navigate(['/login']);
    }
  }
}
