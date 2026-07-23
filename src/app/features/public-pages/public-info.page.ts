import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'b0-public-info',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  template: `<main class="mx-auto grid min-h-screen max-w-3xl content-center gap-6 px-6 py-16 text-[var(--b0-text)]">
    <a class="brand-lockup" routerLink="/" aria-label="Mind Unlocking Academy home">
      <span class="brand-mark" aria-hidden="true">M</span>
      <span class="font-black">Mind Unlocking Academy</span>
    </a>
    <section class="rounded-[2rem] border border-[var(--b0-border)] bg-white/90 p-8 shadow-[var(--b0-shadow-sm)]">
      <p class="m-0 text-sm font-black uppercase tracking-[0.22em] text-indigo-700">Public information</p>
      <h1 class="mt-3 text-4xl font-black tracking-tight text-slate-950">{{ route.snapshot.data['title'] }}</h1>
      <p class="mt-4 text-lg leading-8 text-slate-600">{{ route.snapshot.data['description'] }}</p>
      <div class="mt-6 flex flex-wrap gap-3">
        <a mat-raised-button color="primary" routerLink="/register">Join the Challenge</a>
        <a mat-stroked-button color="primary" routerLink="/">Back home</a>
      </div>
    </section>
  </main>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicInfoPage {
  readonly route = inject(ActivatedRoute);
}
