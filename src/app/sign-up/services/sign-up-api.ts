import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SignUpRequest } from '../models/sign-up.model';

@Injectable({ providedIn: 'root' })
export class SignUpApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/sign-up';

  submitSignUp(payload: SignUpRequest): Observable<void> {
    return this.http.post<void>(this.apiUrl, payload);
  }
}
