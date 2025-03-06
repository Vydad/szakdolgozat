import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideFirebaseApp(() => initializeApp({ projectId: "szakdolgozat-8a45b", appId: "1:741759249396:web:d2d0ffe68f864faa4167a1", databaseURL: "https://szakdolgozat-8a45b-default-rtdb.europe-west1.firebasedatabase.app", storageBucket: "szakdolgozat-8a45b.firebasestorage.app", apiKey: "AIzaSyB1OVKnlwX-Sw9_HNF0BoN4_Ibq36JKVOg", authDomain: "szakdolgozat-8a45b.firebaseapp.com", messagingSenderId: "741759249396", measurementId: "G-80SLD22QNR" })), provideAuth(() => getAuth()), provideFirestore(() => getFirestore())]
};
