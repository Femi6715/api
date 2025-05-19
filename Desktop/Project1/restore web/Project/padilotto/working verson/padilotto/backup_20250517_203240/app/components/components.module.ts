import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './navbar/navbar.component';
import { FlipclockComponent } from './flipclock/flipclock.component';
import { GameTileComponent } from './game-tile/game-tile.component';
import { StickyHeaderComponent } from './sticky-header/sticky-header.component';
import { HomeFooterComponent } from './home-footer/home-footer.component';
import { ToastComponent } from './toast/toast.component';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    NavbarComponent, 
    FlipclockComponent, 
    GameTileComponent, 
    StickyHeaderComponent, 
    HomeFooterComponent, 
    ToastComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    BrowserAnimationsModule
  ],
  exports: [
    NavbarComponent, 
    FlipclockComponent, 
    GameTileComponent, 
    HomeFooterComponent,
    ToastComponent
  ]
})
export class ComponentsModule { }
