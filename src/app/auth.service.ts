import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, onAuthStateChanged, User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);

  // Felhasználói állapot figyelése
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$: Observable<User | null> = this.userSubject.asObservable();

  constructor() {
    // Firebase figyeli, hogy változik-e a bejelentkezett felhasználó
    onAuthStateChanged(this.auth, (user) => {
      this.userSubject.next(user);
    });
  }

  // Bejelentkezés e-mail és jelszóval
  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password)
      .then((userCredential) => {
        this.userSubject.next(userCredential.user);
      });
  }

  // Regisztráció e-mail és jelszóval
  register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password)
      .then((userCredential) => {
        this.userSubject.next(userCredential.user);
      });
  }

  // Kijelentkezés
  logout() {
    return signOut(this.auth).then(() => {
      this.userSubject.next(null);
      this.router.navigate(['/home']);
    });
  }

  // Ellenőrizzük, hogy be van-e jelentkezve
  isAuthenticated(): boolean {
    return this.userSubject.value !== null;
  }

  // Ha van bejelentkezett felhasználó, visszaadja az UID-ját
  getUserId(): Promise<string | null> {
  return new Promise(resolve => {
    onAuthStateChanged(this.auth, user => {
      if (user) {
        resolve(user.uid);
      } else {
        resolve(null);
      }
    });
  });
}


  // Szerepkör ellenőrzés (Ha Firestore-ban lenne tárolva az adat)
  getUserRole(): string {
    return this.userSubject.value?.email === "admin@vydad2001.com" ? "admin" : "user";
  }
  getAuth() {
    return this.auth;
  }
}
