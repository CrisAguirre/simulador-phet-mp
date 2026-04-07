import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tiro-parabolico',
  templateUrl: './tiro-parabolico.component.html',
  styleUrls: ['./tiro-parabolico.component.css']
})
export class TiroParabolicoComponent {

  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
