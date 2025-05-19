import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { DatabaseService } from './database.service';
import { environment } from '../../environments/environment';

interface User {
  id: number;
  surname: string;
  firstname: string;
  state: string;
  email: string;
  mobile_no: string;
  username: string;
  main_balance: string;
  bonus: string;
  createdAt: string;
  updatedAt: string;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject: BehaviorSubject<User | null>;
  private loggedInSubject: BehaviorSubject<boolean>;
  private _loggedIn: boolean = false;
  public currentUser: Observable<User | null>;
  public loggedIn: Observable<boolean>;
  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private databaseService: DatabaseService
  ) {
    this.currentUserSubject = new BehaviorSubject<User | null>(JSON.parse(localStorage.getItem('currentUser') || 'null'));
    this.loggedInSubject = new BehaviorSubject<boolean>(!!this.currentUserSubject.value);
    this.currentUser = this.currentUserSubject.asObservable();
    this.loggedIn = this.loggedInSubject.asObservable();

    // Initialize from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      this._loggedIn = true;
      this.loggedInSubject.next(true);
    }
  }

  // Get current user value
  currentUserValue(): User | null {
    const user = this.currentUserSubject.value;
    if (!user) {
      // Try to load from localStorage as a fallback
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // Update the BehaviorSubject
          this.currentUserSubject.next(parsedUser);
          // Set logged in state
          this._loggedIn = true;
          this.loggedInSubject.next(true);
          return parsedUser;
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
    }
    return user;
  }

  // Get current login status
  isLoggedIn(): boolean {
    return this._loggedIn || !!localStorage.getItem('token');
  }

  // Get token
  token(): string | null {
    return localStorage.getItem('token');
  }

  // Logout method
  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.loggedInSubject.next(false);
    this._loggedIn = false;
  }

  // Get headers for authenticated requests
  getHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders()
      .set('Content-Type', 'application/json');
    
    if (token) {
      // Use Bearer token format for consistency
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return { headers };
  }

  // Get current user profile
  getCurrentUserProfile(): User | null {
    return this.currentUserSubject.value;
  }

  // Check authentication status
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const currentUser = this.currentUserValue();
    return !!token && !!currentUser;
  }

  // Reset password with token
  async resetPasswordWithToken(token: string, password: string): Promise<ResetPasswordResponse> {
    try {
      await this.http.post<any>(`${this.apiUrl}/users/reset-password`, { 
        token,
        password
      }, this.getHeaders()).toPromise();
      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, message: error.message || 'Failed to reset password' };
    }
  }

  // Reset password with username
  async resetPassword(username: string, newPassword: string): Promise<ResetPasswordResponse> {
    try {
      await this.http.post<any>(`${this.apiUrl}/users/reset-password`, { 
        username: username, 
        new_pwd: newPassword 
      }, this.getHeaders()).toPromise();
      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, message: error.message || 'Failed to reset password' };
    }
  }

  // Reset user with email
  async resetUserWithEmail(email: string): Promise<ResetPasswordResponse> {
    try {
      await this.http.post<any>(`${this.apiUrl}/users/reset-password-email`, { email }, this.getHeaders()).toPromise();
      return { success: true, message: 'Password reset link sent successfully' };
    } catch (error) {
      console.error('Reset with email error:', error);
      return { success: false, message: error.message || 'Failed to reset password' };
    }
  }

  // Reset user with phone
  async resetUserWithPhone(phoneNumber: string): Promise<ResetPasswordResponse> {
    try {
      await this.http.post<any>(`${this.apiUrl}/users/reset-password-phone`, { phoneNumber }, this.getHeaders()).toPromise();
      return { success: true, message: 'Password reset link sent successfully' };
    } catch (error) {
      console.error('Reset with phone error:', error);
      return { success: false, message: error.message || 'Failed to reset password' };
    }
  }

  async login(username: string, password: string): Promise<User | { error: string }> {
    try {
      console.log('Attempting login for user:', username);
      
      // Enhanced response handling
      const response = await this.http.post<any>(`${this.apiUrl}/users/authenticate`, 
        { username, password },
        { observe: 'response' }
      ).toPromise();
      
      console.log('Full login response:', response);
      
      if (!response || !response.body || !response.body.success) {
        const errorMsg = response && response.body && response.body.msg ? response.body.msg : 'Login failed';
        console.error('Login failed:', errorMsg);
        return { error: errorMsg };
      }

      const responseData = response.body;
      
      // Store token first - this is critical
      localStorage.setItem('token', responseData.token);
      
      // Create user object with response data
      const userData = responseData.user;
      
      const user: User = {
        id: userData.id,
        surname: userData.surname || '',
        firstname: userData.firstname || '',
        state: userData.state || '',
        email: userData.email || '',
        mobile_no: userData.mobile_no || '',
        username: userData.username || username,
        main_balance: String(userData.main_balance !== undefined ? userData.main_balance : 0),
        bonus: String(userData.bonus !== undefined ? userData.bonus : 0),
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: userData.updatedAt || new Date().toISOString()
      };

      console.log('Created user object:', user);

      // Store user data in memory and localStorage
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUserSubject.next(user);
      this._loggedIn = true;
      this.loggedInSubject.next(true);
      
      console.log('User logged in successfully:', user.username, 'Main balance:', user.main_balance, 'Bonus:', user.bonus);
      
      // Verify data is stored properly
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('currentUser');
      if (!storedToken || !storedUser) {
        console.warn('Storage verification failed after login');
      }
      
      return user;
    } catch (error) {
      console.error('Login error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      
      // For network errors, provide more detailed information
      if (error.status === 401) {
        return { error: 'Invalid username or password' };
      } else if (error.status === 404) {
        return { error: 'Authentication service not found. The API endpoint may be incorrect.' };
      } else if (error.status === 0) {
        return { error: 'Network error. The backend server may not be running.' };
      }
      
      return { error: error.message || 'Login failed' };
    }
  }

  async refreshProfile(): Promise<User | { error: string }> {
    try {
      const currentUser = this.currentUserValue();
      if (!currentUser || !currentUser.id) {
        console.log('No current user found in localStorage');
        return { error: 'No user logged in' };
      }

      const response = await this.http.get<any>(`${this.apiUrl}/users/${currentUser.id}`, this.getHeaders()).toPromise();
      
      if (!response || !response.id) {
        console.error('Invalid response from server:', response);
        return { error: 'Invalid response from server' };
      }

      const user: User = {
        id: response.id,
        surname: response.surname,
        firstname: response.firstname,
        state: response.state,
        email: response.email,
        mobile_no: response.mobile_no,
        username: response.username,
        main_balance: String(response.main_balance),
        bonus: String(response.bonus),
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
      };

      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUserSubject.next(user);
      this._loggedIn = true;
      return user;
    } catch (error) {
      console.error('Error refreshing profile:', error);
      return { error: error.message || 'Error refreshing profile' };
    }
  }

  async updateUser(userId: string, data: any): Promise<User | { error: string }> {
    try {
      const response = await this.http.put<User>(`${this.apiUrl}/users/${userId}`, data, this.getHeaders()).toPromise();
      
      if (!response || !response.id) {
        return { error: 'Invalid response from server' };
      }

      const user: User = {
        id: response.id,
        surname: response.surname,
        firstname: response.firstname,
        state: response.state,
        email: response.email,
        mobile_no: response.mobile_no,
        username: response.username,
        main_balance: String(response.main_balance),
        bonus: String(response.bonus),
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
      };

      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUserSubject.next(user);
      this._loggedIn = true;
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      return { error: error.message || 'Failed to update user' };
    }
  }

  async register(username: string, email: string, password: string): Promise<User | { error: string }> {
    try {
      const response = await this.http.post<any>(`${this.apiUrl}/users/register`, {
        username,
        email,
        password
      }, this.getHeaders()).toPromise();

      if (response && response.error) {
        return { error: response.error };
      }

      // Auto login after registration
      return this.login(username, password);
    } catch (error) {
      console.error('Registration error:', error);
      return { error: error.message || 'Registration failed' };
    }
  }

  async updateProfile(userId: string, data: { username?: string, email?: string, currentPassword?: string, newPassword?: string }): Promise<User | { error: string }> {
    try {
      const response = await this.http.put<any>(`${this.apiUrl}/users/${userId}`, data, this.getHeaders()).toPromise();
      
      if (!response || !response.id) {
        return { error: 'Invalid response from server' };
      }

      const user: User = {
        id: response.id,
        surname: response.surname,
        firstname: response.firstname,
        state: response.state,
        email: response.email,
        mobile_no: response.mobile_no,
        username: response.username,
        main_balance: String(response.main_balance),
        bonus: String(response.bonus),
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
      };

      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUserSubject.next(user);
      this._loggedIn = true;
      return user;
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error: error.message || 'Failed to update profile' };
    }
  }

  async getProfile(userId?: string): Promise<User | { error: string }> {
    try {
      const id = userId || (this.currentUserValue() ? String(this.currentUserValue().id) : undefined);
      
      if (!id) {
        return { error: 'No user ID provided' };
      }

      const response = await this.http.get<any>(`${this.apiUrl}/users/${id}`, this.getHeaders()).toPromise();
      
      if (!response || !response.id) {
        return { error: 'User not found' };
      }

      const user: User = {
        id: response.id,
        surname: response.surname,
        firstname: response.firstname,
        state: response.state,
        email: response.email,
        mobile_no: response.mobile_no,
        username: response.username,
        main_balance: String(response.main_balance),
        bonus: String(response.bonus),
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
      };

      return user;
    } catch (error) {
      console.error('Get profile error:', error);
      return { error: error.message || 'Failed to get profile' };
    }
  }

  async authenticateUserWithPhoneNumber(phoneNumber: string, code: string): Promise<User | { error: string }> {
    try {
      const user = await this.databaseService.getUserByPhoneNumber(phoneNumber);
      if (!user) {
        return { error: 'User not found' };
      }
      // In a real app, you would verify the code here
      return this.storeUserData(user);
    } catch (error) {
      console.error('Phone authentication error:', error);
      return { error: error.message || 'Authentication failed' };
    }
  }

  async authenticateUser(username: string, password: string): Promise<User | { error: string }> {
    return this.login(username, password);
  }

  getUserId(): string {
    const user = this.currentUserValue();
    return user ? String(user.id) : '';
  }

  updateUserProfile(userId: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/${userId}`, data, this.getHeaders());
  }

  async refreshCurrentUserProfile(): Promise<any> {
    try {
      // Use token to check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found in localStorage');
        return { error: 'Not logged in' };
      }

      // Get user ID from localStorage first
      const currentUserStr = localStorage.getItem('currentUser');
      if (!currentUserStr) {
        console.log('No current user found in localStorage');
        return { error: 'No user data found' };
      }

      const storedUser = JSON.parse(currentUserStr);
      const userId = storedUser.id;
      
      if (!userId) {
        console.error('No user ID found in stored user data');
        return { error: 'Invalid user data' };
      }
      
      // Actually fetch fresh data from the server
      console.log('Fetching fresh user data for ID:', userId);
      try {
        const freshUserData = await this.getUserProfile(String(userId));
        if ('error' in freshUserData) {
          throw new Error(freshUserData.error);
        }
        console.log('Fresh user data retrieved:', {
          username: freshUserData.username,
          main_balance: freshUserData.main_balance,
          bonus: freshUserData.bonus
        });
        return freshUserData;
      } catch (err) {
        console.warn('Failed to fetch fresh data, using stored data:', err);
        // Return the stored data as fallback
        this.currentUserSubject.next(storedUser);
        this._loggedIn = true;
        return storedUser;
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      this.logout();
      return { error: error.message || 'Failed to refresh profile' };
    }
  }

  private storeUserData(user: User): User {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
    this._loggedIn = true;
    this.loggedInSubject.next(true);
    return user;
  }

  // Get user profile by ID
  async getUserProfile(userId: string): Promise<User | { error: string }> {
    try {
      if (!userId) {
        return { error: 'No user ID provided' };
      }

      console.log('Fetching user profile for ID:', userId);
      
      // Try enhanced error logging
      const response = await this.http.get<any>(`${this.apiUrl}/users/${userId}`, {
        headers: this.getHeaders().headers,
        observe: 'response'
      }).toPromise();
      
      console.log('Full response:', response);
      
      if (!response || !response.body || !response.body.success) {
        const errorMsg = response && response.body && response.body.msg ? response.body.msg : 'Failed to get user profile';
        console.error('Failed to get user profile:', errorMsg);
        return { error: errorMsg };
      }

      console.log('User profile response:', response.body);
      
      // Server returns data in user property
      const userData = response.body.user;
      
      const user: User = {
        id: userData.id,
        surname: userData.surname || '',
        firstname: userData.firstname || '',
        state: userData.state || '',
        email: userData.email || '',
        mobile_no: userData.mobile_no || '',
        username: userData.username || '',
        main_balance: String(userData.main_balance !== undefined ? userData.main_balance : 0),
        bonus: String(userData.bonus !== undefined ? userData.bonus : 0),
        createdAt: userData.createdAt || '',
        updatedAt: userData.updatedAt || ''
      };

      console.log('User profile processed:', user);

      // Update stored user data
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUserSubject.next(user);
      return user;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      // For network errors, provide more detailed information
      if (error.status === 404) {
        return { error: 'User not found. The API endpoint may be incorrect.' };
      } else if (error.status === 0) {
        return { error: 'Network error. The backend server may not be running.' };
      }
      
      return { error: error.message || 'Failed to get user profile' };
    }
  }

  // Get user's main balance
  async getMainBalance(): Promise<string | { error: string }> {
    try {
      const currentUser = this.currentUserValue();
      if (!currentUser || !currentUser.id) {
        return { error: 'No user logged in' };
      }

      const response = await this.http.get<any>(`${this.apiUrl}/users/${currentUser.id}/main-balance`, this.getHeaders()).toPromise();
      
      if (!response || (response && response.error)) {
        return { error: response && response.error ? response.error : 'Failed to get main balance' };
      }

      const mainBalance = String(response.main_balance || 0);
      
      // Update stored user data
      const updatedUser = { ...currentUser, main_balance: mainBalance };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);
      
      return mainBalance;
    } catch (error) {
      console.error('Error fetching main balance:', error);
      return { error: error.message || 'Failed to get main balance' };
    }
  }

  // Get user's bonus
  async getBonus(): Promise<string | { error: string }> {
    try {
      const currentUser = this.currentUserValue();
      if (!currentUser || !currentUser.id) {
        return { error: 'No user logged in' };
      }

      const response = await this.http.get<any>(`${this.apiUrl}/users/${currentUser.id}/bonus`, this.getHeaders()).toPromise();
      
      if (!response || (response && response.error)) {
        return { error: response && response.error ? response.error : 'Failed to get bonus' };
      }

      const bonus = String(response.bonus || 0);
      
      // Update stored user data
      const updatedUser = { ...currentUser, bonus };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);
      
      return bonus;
    } catch (error) {
      console.error('Error fetching bonus:', error);
      return { error: error.message || 'Failed to get bonus' };
    }
  }

  // Refresh all user data
  async refreshUserData(): Promise<User | { error: string }> {
    try {
      // First make sure we have the current user (this will load from localStorage if needed)
      const currentUser = this.currentUserValue();
      if (!currentUser || !currentUser.id) {
        return { error: 'No user logged in' };
      }

      // Get latest user profile
      const userProfile = await this.getUserProfile(String(currentUser.id));
      if ('error' in userProfile) {
        return userProfile;
      }

      return userProfile;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return { error: error.message || 'Failed to refresh user data' };
    }
  }
}