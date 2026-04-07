import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, SessionLog } from '../../services/auth.service';

interface Taller {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  route: string;
  accentColor: string;
  accentGlow: string;
  isCentral: boolean;
}

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
  showLogs: boolean = false;

  talleres: Taller[] = [
    {
      id: 'mua',
      title: 'Movimiento Uniforme Acelerado',
      subtitle: 'MUA',
      description: 'Estudia cómo los objetos cambian su velocidad de forma constante. Aprende sobre aceleración, velocidad y desplazamiento.',
      icon: '🚀',
      route: '/talleres/mua',
      accentColor: '#4fc3f7',
      accentGlow: 'rgba(79, 195, 247, 0.3)',
      isCentral: false
    },
    {
      id: 'caida-libre',
      title: 'Caída Libre',
      subtitle: 'Gravedad',
      description: 'Explora cómo caen los objetos bajo la acción exclusiva de la gravedad. Descubre la aceleración gravitacional y sus efectos.',
      icon: '🍎',
      route: '/talleres/caida-libre',
      accentColor: '#29b6f6',
      accentGlow: 'rgba(41, 182, 246, 0.3)',
      isCentral: false
    },
    {
      id: 'tiro-parabolico',
      title: 'Tiro Parabólico',
      subtitle: 'Proyectil',
      description: 'El módulo central del curso. Analiza la trayectoria de un proyectil y experimenta con un simulador interactivo PhET.',
      icon: '🎯',
      route: '/talleres/tiro-parabolico',
      accentColor: '#03a9f4',
      accentGlow: 'rgba(3, 169, 244, 0.4)',
      isCentral: true
    }
  ];

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

  get formattedTime(): string {
    const minutes = Math.floor(this.activeTimeSeconds / 60);
    const seconds = this.activeTimeSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  navigateToTaller(route: string): void {
    this.router.navigate([route]);
  }

  toggleLogs(): void {
    this.showLogs = !this.showLogs;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
