import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { WinningTicketsComponent } from './winning-tickets.component';
import { NgxLoadingModule, ngxLoadingAnimationTypes } from 'ngx-loading';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    WinningTicketsComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    HttpClientModule,
    SharedModule,
    NgxLoadingModule.forRoot({
      animationType: ngxLoadingAnimationTypes.chasingDots,
      fullScreenBackdrop: true,
      backdropBackgroundColour: '#002433',
      primaryColour: '#fff',
      secondaryColour: '#FEBF00',
      tertiaryColour: '#FEBF00'
    })
  ],
  exports: [
    WinningTicketsComponent
  ]
})
export class WinningTicketsModule { } 