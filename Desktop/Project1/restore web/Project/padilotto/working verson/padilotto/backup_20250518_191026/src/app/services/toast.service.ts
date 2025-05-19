import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new Subject<ToastMessage>();
  public toast$: Observable<ToastMessage> = this.toastSubject.asObservable();

  constructor() {}

  success(message: string, duration: number = 3000): void {
    this.show({
      message,
      type: 'success',
      duration
    });
  }

  error(message: string, duration: number = 3000): void {
    this.show({
      message,
      type: 'error',
      duration
    });
  }

  info(message: string, duration: number = 3000): void {
    this.show({
      message,
      type: 'info',
      duration
    });
  }

  private show(toast: ToastMessage): void {
    this.toastSubject.next(toast);
  }
} 