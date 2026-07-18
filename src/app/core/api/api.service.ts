import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
@Injectable({ providedIn: 'root' })
export class ApiService {
  #http = inject(HttpClient);
  #base = environment.apiBaseUrl;
  get<T>(path: string, params?: Record<string, string | number | boolean>) {
    return this.#http.get<T>(`${this.#base}${path}`, {
      params: this.#params(params),
      withCredentials: this.#sameOrigin(),
    });
  }
  post<T>(path: string, body: unknown) {
    return this.#http.post<T>(`${this.#base}${path}`, body, { withCredentials: this.#sameOrigin() });
  }
  put<T>(path: string, body: unknown) {
    return this.#http.put<T>(`${this.#base}${path}`, body, { withCredentials: this.#sameOrigin() });
  }
  delete<T>(path: string) {
    return this.#http.delete<T>(`${this.#base}${path}`, { withCredentials: this.#sameOrigin() });
  }
  #params(p?: Record<string, string | number | boolean>) {
    let params = new HttpParams();
    Object.entries(p ?? {}).forEach(([k, v]) => (params = params.set(k, String(v))));
    return params;
  }
  #sameOrigin() {
    try {
      return new URL(this.#base, location.origin).origin === location.origin;
    } catch {
      return false;
    }
  }
}
