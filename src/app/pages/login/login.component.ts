// login.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule,NavbarComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage: string | null = null;  // Hibaüzenet
  private authService = inject(AuthService);
  private router = inject(Router);

  onLogin() {
    this.authService.login(this.email, this.password)
      .then(() => this.router.navigate(['/']))
      .catch(error => {
        this.errorMessage = error.message;  // Hibaüzenet megjelenítése
        console.error(error);
      });
  }

  goRegister() {
    this.router.navigate(['/signup']);
  }
}
