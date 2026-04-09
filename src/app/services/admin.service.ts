import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getVisitantes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/sessions`);
  }

  getEstudiantes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/users`);
  }

  getEvaluaciones(): Observable<any> {
    return this.http.get(`${this.apiUrl}/evaluaciones`);
  }

  getEstadisticasEvaluaciones(): Observable<any> {
    return this.http.get(`${this.apiUrl}/evaluaciones/stats`);
  }
}
