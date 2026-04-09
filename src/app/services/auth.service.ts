import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id?: string;
  email: string;
  name?: string; // Optional, as backend currently only requires email
  age?: number;
  password?: string;
  role?: string;
  createdAt?: string;
}

export interface SessionLog {
  email: string;
  name?: string;
  entryTime: string;
  durationSeconds?: number;
  loginTime?: string; // Backend uses loginTime
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private readonly TOKEN_KEY = 'PHET_TOKEN';
  private readonly CURRENT_USER_KEY = 'PHET_USER';
  private readonly SESSION_START_KEY = 'PHET_SESSION_START';

  // Observable for auth state
  private currentUserSubject = new BehaviorSubject<User | null>(this.getCurrentUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Auth Methods
  register(userData: User): Observable<any> {
    // Generate random password if not provided
    if (!userData.password) {
      userData.password = Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    
    return this.http.post(`${this.apiUrl}/auth/register`, {
      name: userData.name,
      age: userData.age,
      email: userData.email,
      password: userData.password
    }).pipe(
      tap(() => {
        // We will return the generated password to show it to the user
      })
    );
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap((response: any) => {
        if (response.status === 'success' && response.token) {
          // Guardar Token y datos de usuario en localStorage
          localStorage.setItem(this.TOKEN_KEY, response.token);
          localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(response.data.user));
          
          // Registrar tiempo de entrada al log normal
          localStorage.setItem(this.SESSION_START_KEY, new Date().getTime().toString());
          
          this.currentUserSubject.next(response.data.user);

          // Hacer log en el backend para trackear visitantes
          if (response.data.user.role !== 'admin') {
               this.http.post(`${this.apiUrl}/sessions`, {
                 userId: response.data.user.id,
                 email: response.data.user.email,
                 deviceInfo: navigator.userAgent
               }).subscribe();
          }
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.CURRENT_USER_KEY);
    localStorage.removeItem(this.SESSION_START_KEY);
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    const data = localStorage.getItem(this.CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  }
}
