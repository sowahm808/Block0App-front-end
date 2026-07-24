import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
@Injectable({ providedIn: 'root' })
export class ApiService {
  #http = inject(HttpClient);
  #base = environment.apiBaseUrl;
  get<T>(path: string, params?: Record<string, string | number | boolean>) {
    return this.#http.get<T>(`${this.#base}${path}`, {
      params: this.#params(params),
      withCredentials: this.#withCredentials(),
    });
  }
  post<T>(path: string, body: unknown, options?: { headers?: Record<string, string> }) {
    return this.#http.post<T>(`${this.#base}${path}`, body, {
      headers: this.#headers(options?.headers),
      withCredentials: this.#withCredentials(),
    });
  }
  put<T>(path: string, body: unknown) {
    return this.#http.put<T>(`${this.#base}${path}`, body, { withCredentials: this.#withCredentials() });
  }
  delete<T>(path: string) {
    return this.#http.delete<T>(`${this.#base}${path}`, { withCredentials: this.#withCredentials() });
  }
  #headers(headers?: Record<string, string>) {
    let httpHeaders = new HttpHeaders();
    Object.entries(headers ?? {}).forEach(([k, v]) => (httpHeaders = httpHeaders.set(k, v)));
    return httpHeaders;
  }
  #params(p?: Record<string, string | number | boolean>) {
    let params = new HttpParams();
    Object.entries(p ?? {}).forEach(([k, v]) => (params = params.set(k, String(v))));
    return params;
  }
  #withCredentials() {
    return environment.apiWithCredentials;
  }
}
