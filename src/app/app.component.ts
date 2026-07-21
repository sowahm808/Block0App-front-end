import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { AuthStore } from './core/auth/auth.store';
import { ThemeService } from './core/theme/theme.service';

@Component({
  selector: 'b0-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  #auth = inject(AuthService);
  #store = inject(AuthStore);
  #theme = inject(ThemeService);

  ngOnInit() {
    if (this.#store.accessToken() && !this.#store.user()) {
      this.#auth.loadProfile().subscribe({ error: () => this.#store.clear() });
    }
  }
}
