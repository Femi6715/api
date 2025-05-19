import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { FlashMessagesModule } from 'angular2-flash-messages';
import { AuthGuard } from './guards/auth.guard';
import { Angular4PaystackModule } from 'angular4-paystack';
import { Ng4LoadingSpinnerModule } from 'ng4-loading-spinner';
import { NgxLoadingModule, ngxLoadingAnimationTypes } from 'ngx-loading';
import { DatabaseService } from './services/database.service';
import { ToastService } from './services/toast.service';
// import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BodyComponent } from './body/body.component';
import { WinningTicketsComponent } from './winning-tickets/winning-tickets.component';
import { CategoriesComponent } from './categories/categories.component';
import { MyTicketsComponent } from './my-tickets/my-tickets.component';
import { ProfileComponent } from './profile/profile.component';
import { DepositComponent } from './deposit/deposit.component';
import { WithdrawComponent } from './withdraw/withdraw.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { RegisterComponent } from './register/register.component';
import { CouponService } from './services/coupon.service';
import { MyTicketsService } from './services/my-tickets.service';
import { PlayComponent } from './play/play.component';
import { RegisterService } from './services/register.service';
import { LoginComponent } from './login/login.component';
import { AuthService } from './services/auth.service';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { TermsComponent } from './terms/terms.component';
import { BlogComponent } from './blog/blog.component';
import { ContactComponent } from './contact/contact.component';
import { PolicyComponent } from './policy/policy.component';
import { ResponsibleComponent } from './responsible/responsible.component';
import { PaymentComponent } from './payment/payment.component';
import { CounterDirective } from './counter.directive';
import { CountdownTimerModule } from 'ngx-countdown-timer';
import { AdminloginComponent } from './adminlogin/adminlogin.component';
import { FilterPipe } from './filter.pipe';
import { AboutComponent } from './about/about.component';
import { HowToPlayComponent } from './how-to-play/how-to-play.component';
import { BonusesComponent } from './bonuses/bonuses.component';
import { MonthlyBonusesComponent } from './monthly-bonuses/monthly-bonuses.component';
import { GamblingComponent } from './responsible-gaming/responsible-gambling.component';
import { HomepageComponent } from './homepage/homepage.component';
import { ComponentsModule } from './components/components.module';
import { DashboardComponent } from './dashboard/dashboard.component';
// const config: SocketIoConfig = { url: 'http://localhost:3000/', options: {} };

// Library for adding animations
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { SwiperModule } from 'ngx-swiper-wrapper';


import {NgxPaginationModule} from 'ngx-pagination';
import { FaqComponent } from './faq/faq.component'; // <-- import the module

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    BodyComponent,
    WinningTicketsComponent,
    CategoriesComponent,
    MyTicketsComponent,
    ProfileComponent,
    ContactComponent,
    BlogComponent,
    PolicyComponent,
    ResponsibleComponent,
    DepositComponent,
    WithdrawComponent,
    TransactionsComponent,
    RegisterComponent,
    PlayComponent,
    LoginComponent,
    HeaderComponent,
    FooterComponent,
    TermsComponent,
    PaymentComponent,
    AdminloginComponent,
    CounterDirective,
    FilterPipe,
    AboutComponent,
    HowToPlayComponent,
    BonusesComponent,
    MonthlyBonusesComponent,
    GamblingComponent,
    HomepageComponent,
    FaqComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    SwiperModule,
    AppRoutingModule,
    NgxPaginationModule,
    HttpClientModule,
    ComponentsModule,
    Angular4PaystackModule,
    FlashMessagesModule.forRoot(),
    CountdownTimerModule.forRoot(),
    Ng4LoadingSpinnerModule.forRoot(),
    NgxLoadingModule.forRoot({
      animationType: ngxLoadingAnimationTypes.chasingDots,
      fullScreenBackdrop: true,
      backdropBackgroundColour: '#002433',
      primaryColour: '#fff',
      secondaryColour: '#FEBF00',
      tertiaryColour: '#FEBF00'
    }),
    //  SocketIoModule.forRoot(config)
  ],
  providers: [
    CouponService,
    MyTicketsService,
    RegisterService,
    AuthService,
    AuthGuard,
    DatabaseService,
    ToastService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
