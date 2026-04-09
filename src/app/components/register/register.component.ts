import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  generatedPassword = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      age: ['', [Validators.required, Validators.min(10)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.errorMessage = '';
      
      const userData = this.registerForm.value;
      const generatedPass = Math.random().toString(36).substring(2, 8).toUpperCase();
      userData.password = generatedPass;

      this.authService.register(userData).subscribe({
        next: () => {
          this.generatedPassword = generatedPass;
          this.registerForm.reset();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Error al registrar al estudiante.';
        }
      });
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
