import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from './../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  apiUrl = 'https://simplelottto-0071c1b5572a.herokuapp.com/users';

  // apiUrl = 'http://localhost:3000/users';

  constructor(private http: HttpClient) {}

  registerUser(data) {
    return this.http.post<any>(`${this.apiUrl}/admin/register`, data);
  }
}
