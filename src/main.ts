import { bootstrapApplication } from '@angular/platform-browser';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { environment } from './environment/environment';
import { provideRouter, Routes } from '@angular/router';
import { AppComponent } from './app/app.component';
import { LoginComponent } from './app/pages/login/login.component';
import { SignupComponent } from './app/pages/signup/signup.component';
import { HomeComponent } from './app/pages/home/home.component';
import { CharactersComponent } from './app/pages/characters/characters.component';
import { CharacterSheetComponent } from './app/pages/character-sheet/character-sheet.component';
import { CharacterCreateComponent } from './app/pages/charactercreate/charactercreate.component';
import { CampaignsComponent } from './app/pages/campaings/campaigns.component';
import { CampaignComponent } from './app/pages/campaign/campaign.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'home', component: HomeComponent },
  { path: 'characters', component: CharactersComponent },
  { path: 'charactercreate', component: CharacterCreateComponent },
  { path: 'character-sheet/:id', component: CharacterSheetComponent },
  { path: 'campaigns',component:CampaignsComponent },
  { path: 'campaign/:id',component:CampaignComponent },
  { path: 'join/campaign/:id', component: CharactersComponent }
];

bootstrapApplication(AppComponent, {
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideStorage(() => getStorage()),
    provideRouter(routes),
  ]
}).catch(err => console.error(err));
