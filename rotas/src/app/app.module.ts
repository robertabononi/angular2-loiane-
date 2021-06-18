import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { AuthService } from './login/auth.service';
import { AuthGuard } from './guard/auth.guard';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    TooltipModule.forRoot(),
    AppRoutingModule
  ],
  providers: [AuthService, AuthGuard],
  bootstrap: [AppComponent]
})
export class AppModule { }
