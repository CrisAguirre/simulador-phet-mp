import { Injectable } from '@angular/core';

export interface User {
  email: string;
  name: string;
  age: number;
  password?: string;
}

export interface SessionLog {
  email: string;
  name: string;
  entryTime: string;
  durationSeconds: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USERS_KEY = 'STUDENTS_DB';
  private readonly LOGS_KEY = 'STUDENT_LOGS';
  private readonly ACTIVE_SESSION_KEY = 'ACTIVE_STUDENT_SESSION';

  constructor() { }

  // Utils for Local Storage
  private getDbData(key: string): any[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private setDbData(key: string, data: any[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Auth Methods
  register(userData: User): string {
    const users = this.getDbData(this.USERS_KEY);
    
    // Normalize email
    userData.email = userData.email.trim().toLowerCase();

    // Check if email already exists
    if (users.find(u => u.email.trim().toLowerCase() === userData.email)) {
      throw new Error('El correo ya está registrado.');
    }

    // Generate random password
    const generatedPassword = Math.random().toString(36).substring(2, 8).toUpperCase();
    userData.password = generatedPassword;

    users.push(userData);
    this.setDbData(this.USERS_KEY, users);

    return generatedPassword;
  }

  login(email: string, password: string): User | null {
    const users = this.getDbData(this.USERS_KEY);
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    const user = users.find(u => 
      u.email.trim().toLowerCase() === normalizedEmail && 
      u.password === normalizedPassword
    );
    
    if (user) {
      // Create session
      const sessionData = {
        ...user,
        entryTimestamp: new Date().getTime()
      };
      localStorage.setItem(this.ACTIVE_SESSION_KEY, JSON.stringify(sessionData));
      return user;
    }
    return null;
  }

  logout(): void {
    const sessionString = localStorage.getItem(this.ACTIVE_SESSION_KEY);
    if (sessionString) {
      const session = JSON.parse(sessionString);
      const exitTimestamp = new Date().getTime();
      const duration = Math.floor((exitTimestamp - session.entryTimestamp) / 1000); // in seconds
      
      const log: SessionLog = {
        email: session.email,
        name: session.name,
        entryTime: new Date(session.entryTimestamp).toLocaleString(),
        durationSeconds: duration
      };

      const logs = this.getDbData(this.LOGS_KEY);
      logs.push(log);
      this.setDbData(this.LOGS_KEY, logs);

      localStorage.removeItem(this.ACTIVE_SESSION_KEY);
    }
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.ACTIVE_SESSION_KEY);
  }

  getCurrentUser(): any {
    const data = localStorage.getItem(this.ACTIVE_SESSION_KEY);
    return data ? JSON.parse(data) : null;
  }

  getLogs(): SessionLog[] {
    return this.getDbData(this.LOGS_KEY);
  }
}
