import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { AuthService } from '../../auth.service';
import { getAuth, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule,FormsModule], 
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})

export class NavbarComponent implements OnInit{
  authService = inject(AuthService);
  showAccountPanel = false;
  userEmail: string | null = null;
  userId: string | null = null;
  currentPassword = "";
  newPassword = "";
  confirmPassword = "";
  passwordError = "";
  passwordSuccess = "";
  showCurrent = false;
  showNew = false;
  showConfirm = false;

constructor(private auth: Auth) {}
  ngOnInit() {
    authState(this.auth).subscribe(user => {
      if (user) {
        this.userEmail = user.email;
        this.userId = user.uid;
      } else {
        this.userEmail = null;
        this.userId = null;
      }
    });
  }

  toggleAccountPanel() {
    this.showAccountPanel = !this.showAccountPanel;
  }

  logout() {
    this.authService.logout();
    this.showAccountPanel = false;
  }
  async submitPasswordChange() {
    this.passwordError = "";
    this.passwordSuccess = "";

    if (!this.currentPassword) {
      this.passwordError = "Add meg a régi jelszót!";
      return;
    }

    const pass = this.newPassword;
    if (pass.length < 8 || !/[A-Z]/.test(pass) || !/[0-9]/.test(pass)) {
      this.passwordError = "A jelszónak legalább 8 karaktert, egy nagybetűt és egy számot kell tartalmaznia!";
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = "A két jelszó nem egyezik!";
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;
    const email = this.userEmail || "";

    try {
      const credential = EmailAuthProvider.credential(email, this.currentPassword);
      await reauthenticateWithCredential(user!, credential);
      await updatePassword(user!, this.newPassword);

      this.passwordSuccess = "✅ Sikeres jelszócsere!";
      this.currentPassword = "";
      this.newPassword = "";
      this.confirmPassword = "";
    } catch (error) {
      this.passwordError = "❌ Hibás jelszó vagy hiba történt!";
    }
  }
}
