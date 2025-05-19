import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WinningTicketsComponent } from './winning-tickets/winning-tickets.component';
import { BodyComponent } from './body/body.component';
import { CategoriesComponent } from './categories/categories.component';
import { DepositComponent } from './deposit/deposit.component';
import { MyTicketsComponent } from './my-tickets/my-tickets.component';
import { ProfileComponent } from './profile/profile.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { WithdrawComponent } from './withdraw/withdraw.component';
import { RegisterComponent } from './register/register.component';
import { PlayComponent } from './play/play.component';
import { PaymentComponent } from './payment/payment.component';
import { AuthGuard } from './guards/auth.guard';
import { HeaderComponent } from './header/header.component';
import { LoginComponent } from './login/login.component';
import { AboutComponent } from './about/about.component';
import { HowToPlayComponent } from './how-to-play/how-to-play.component';
import { BonusesComponent } from './bonuses/bonuses.component';
import { TermsComponent } from './terms/terms.component';
import { BlogComponent } from './blog/blog.component';
import { ResponsibleComponent } from './responsible/responsible.component';
import { ContactComponent } from './contact/contact.component';
import { PolicyComponent } from './policy/policy.component';
import { FaqComponent } from './faq/faq.component';
import { MonthlyBonusesComponent } from './monthly-bonuses/monthly-bonuses.component';
import { HomepageComponent } from './homepage/homepage.component';
import { DashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [
  // {path: 'categories/play/:id', component: PlayComponent, canActivate: [AuthGuard]},
  {path: 'winning-tickets', component: WinningTicketsComponent},
  { path: 'h', component: HeaderComponent, runGuardsAndResolvers: 'always' },
  // OLD HOMEPAGE
  { path: 'body', component: BodyComponent },
  { path: '', component: HomepageComponent },
  {path: 'about', component: AboutComponent},
  {path: 'how-to-play', component: HowToPlayComponent},
  {path: 'terms', component: TermsComponent},
  {path: 'faq', component: FaqComponent},
  {path: 'bonuses', component: BonusesComponent},
  {path: 'blog', component: BlogComponent},
  {path: 'monthly-jackpot', component: MonthlyBonusesComponent},
  // {path: 'login/register', component: RegisterComponent},
  // {path: 'play/:id', component: PlayComponent, canActivate: [AuthGuard]},
  {path: 'play', component: PlayComponent},
  {path: 'responsible', component: ResponsibleComponent},
  {path: 'policy', component: PolicyComponent},
  {path: 'contact', component: ContactComponent},
  {path: 'categories', component: CategoriesComponent},
  {path: 'deposit', component: DepositComponent, canActivate: [AuthGuard]},
  {path: 'payment', component: PaymentComponent, canActivate: [AuthGuard]},
  {path: 'my-tickets', component: MyTicketsComponent, canActivate: [AuthGuard]},
  {path: 'profile', component: ProfileComponent, canActivate: [AuthGuard]},
  {path: 'transactions', component: TransactionsComponent, canActivate: [AuthGuard]},
  {path: 'withdraw', component: WithdrawComponent, canActivate: [AuthGuard]},
  {path: 'register', component: RegisterComponent},
  {path: 'login', component: LoginComponent},
  { path: 'dashboard', component: DashboardComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {onSameUrlNavigation: 'reload'})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
