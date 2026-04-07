import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-caida-libre',
  templateUrl: './caida-libre.component.html',
  styleUrls: ['./caida-libre.component.css']
})
export class CaidaLibreComponent {

  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
