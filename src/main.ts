import { bootstrapApplication } from '@angular/platform-browser';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { environment } from './environment/environment';
import { provideRouter, RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app/app.component';
import { LoginComponent } from './app/pages/login/login.component'; // Login komponens
import { SignupComponent } from './app/pages/signup/signup.component'; // Signup komponens
import { NavbarComponent } from './app/components/navbar/navbar.component'; //Navbar

// Az útvonalak beállítása, ahol a LoginComponent az alapértelmezett oldal
const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },// Ez lesz az alapértelmezett oldal
  { path: 'login', component: LoginComponent }, 
  { path: 'signup', component: SignupComponent }  
];

// Az alkalmazás bootstrapelése routinggal és Firebase integrációval
bootstrapApplication(AppComponent, {
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideRouter(routes),
  ]
}).catch(err => console.error(err));
