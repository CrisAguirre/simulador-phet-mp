import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MuaComponent } from './components/talleres/mua/mua.component';
import { CaidaLibreComponent } from './components/talleres/caida-libre/caida-libre.component';
import { TiroParabolicoComponent } from './components/talleres/tiro-parabolico/tiro-parabolico.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'talleres/mua', component: MuaComponent },
  { path: 'talleres/caida-libre', component: CaidaLibreComponent },
  { path: 'talleres/tiro-parabolico', component: TiroParabolicoComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
