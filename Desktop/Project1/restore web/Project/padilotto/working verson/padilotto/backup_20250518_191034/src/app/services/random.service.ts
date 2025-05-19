import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RandomService {
  private messageSource = new BehaviorSubject<string>('0');
  private bonusSource = new BehaviorSubject<string>('0');
  private loginStatusSubject = new BehaviorSubject<boolean>(false);
  private statusSubject = new BehaviorSubject<boolean>(false);
  private nxtGameid = new BehaviorSubject<{ [key: string]: any }>({});

  status$: Observable<boolean> = this.statusSubject.asObservable();
  telecast: Observable<string> = this.messageSource.asObservable();
  anotherTeleCast: Observable<string> = this.bonusSource.asObservable();
  loginStatus$: Observable<boolean> = this.loginStatusSubject.asObservable();
  nextGameId: Observable<{ [key: string]: any }> = this.nxtGameid.asObservable();

  constructor(private authService: AuthService) {
    // Initialize with current auth status
    this.loginStatusSubject.next(this.authService.isLoggedIn());

    // Subscribe to auth service changes
    this.authService.currentUser.subscribe(user => {
      this.loginStatusSubject.next(!!user);
    });

    // Also listen for direct status changes from auth service
    this.authService.loggedIn.subscribe(loggedIn => {
      this.loginStatusSubject.next(loggedIn);
    });
  }

  editmsg(message: string) {
    this.messageSource.next(message);
  }

  editBonus(bonus: string) {
    this.bonusSource.next(bonus);
  }

  updateLoginStatus(status: boolean) {
    this.loginStatusSubject.next(status);
  }

  get loginStatus(): boolean {
    return this.loginStatusSubject.value;
  }

  get status(): boolean {
    return this.statusSubject.value;
  }

  gameId(id: { [key: string]: any }) {
    this.nxtGameid.next(id);
  }
}
