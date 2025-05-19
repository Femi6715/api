import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { ToastService, ToastMessage } from '../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css'],
  animations: [
    trigger('toastAnimation', [
      state('hidden', style({
        opacity: 0,
        transform: 'translateY(100%)'
      })),
      state('visible', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      transition('hidden => visible', animate('300ms ease-in')),
      transition('visible => hidden', animate('300ms ease-out'))
    ])
  ]
})
export class ToastComponent implements OnInit, OnDestroy {
  @Input() message: string = '';
  @Input() type: 'success' | 'error' | 'info' = 'info';
  @Input() duration: number = 3000;
  
  showToast: boolean = false;
  animationState: 'visible' | 'hidden' = 'hidden';
  private subscription: Subscription;

  constructor(private toastService: ToastService) { }

  ngOnInit(): void {
    this.subscription = this.toastService.toast$.subscribe((toast: ToastMessage) => {
      this.message = toast.message;
      this.type = toast.type;
      this.duration = toast.duration || 3000;
      this.show();
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  show(message?: string): void {
    if (message) {
      this.message = message;
    }
    
    this.showToast = true;
    this.animationState = 'visible';
    
    setTimeout(() => {
      this.hide();
    }, this.duration);
  }

  hide(): void {
    this.animationState = 'hidden';
    setTimeout(() => {
      this.showToast = false;
    }, 300);
  }
} 