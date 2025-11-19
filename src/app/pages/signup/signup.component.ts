// login.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {
  email = '';
  password = '';
  password2='';
  errorMessage: string | null = null;  // Hibaüzenet
  Message: string | null = 'A jelszónak legalább 8 karakter hosszúnak kell lennie és tartamlazni kell legalább egy nagybetűt és számot!';
  private authService = inject(AuthService);
  private router = inject(Router);

  onRegister() {
    this.Message=null;
    let szam=/[0-9]/.test(this.password);
    let nagybetu=/[A-Z]/.test(this.password);
    if(this.password!=this.password2){
        this.errorMessage= 'A két jelszónak egyezni kell!'
    }else if(this.password.length<8){
        this.errorMessage= 'A jelszónak legalább 8 karakter hosszúnak kell lennie!'
    }else if(szam==false){
        this.errorMessage= 'A jelszónak legalább egy számnak kell benne szerepelnie!'
    }else if(nagybetu==false){
        this.errorMessage= 'A jelszónak legalább egy nagybetűnek kell benne szerepelnie!'
    }else{
    this.authService.register(this.email, this.password)
      .then(() => {
        this.errorMessage = null; // Ha sikeres, töröljük a hibaüzenetet
        this.router.navigate(['/login']);
      })
      .catch(error => {
        this.errorMessage =/* error.message ||*/ 'Hiba történt a regisztráció során!';
        console.error(error);
      });
    }
  }
  goLogin() {
    this.router.navigate(['/login']);
  }
  
}
