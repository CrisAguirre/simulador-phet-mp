import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, SessionLog, User } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: any;
  logs: SessionLog[] = [];
  activeTimeSeconds: number = 0;
  timerInterval: any;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.currentUser = this.authService.getCurrentUser();
    this.logs = this.authService.getLogs();

    this.timerInterval = setInterval(() => {
      const now = new Date().getTime();
      this.activeTimeSeconds = Math.floor((now - this.currentUser.entryTimestamp) / 1000);
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
