import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mua',
  templateUrl: './mua.component.html',
  styleUrls: ['./mua.component.css']
})
export class MuaComponent {

  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
