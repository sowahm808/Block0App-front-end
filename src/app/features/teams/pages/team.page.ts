import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { catchError, map, of, startWith } from 'rxjs';
import { TeamsApiService } from '../../../core/api/feature-api.services';

interface TeamField {
  label: string;
  value: string;
}

interface TeamCard {
  title: string;
  subtitle?: string;
  fields: TeamField[];
}

@Component({
  standalone: true,
  imports: [AsyncPipe, MatButtonModule, MatCardModule],
  template: `<section class="grid gap-5" aria-labelledby="team-title">
    <div class="feature-hero">
      <div class="grid gap-3">
        <p class="eyebrow">/teams</p>
        <h1 id="team-title" class="text-3xl font-black tracking-tight sm:text-4xl">Team accountability</h1>
        <p class="max-w-3xl leading-7 text-slate-600">
          Team view intentionally shows participation, streaks, encouragement, and help indicators only. It never
          displays answers, private confidence, support notes, or weaknesses.
        </p>
      </div>
    </div>
    <div class="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <mat-card class="p-4 sm:p-6">
        <h2 class="text-xl font-black">Team snapshot</h2>
        @if (vm$ | async; as vm) {
          @if (vm.loading) {
            <p class="mt-4">Loading team data…</p>
          } @else if (vm.error) {
            <p class="mt-4 rounded-2xl bg-amber-50 p-4 text-amber-900">Team API is wired but unavailable right now.</p>
          } @else if (!vm.cards.length) {
            <p class="mt-4 rounded-2xl border border-[var(--b0-border)] p-4 text-[var(--b0-text-muted)]">
              No team activity is available yet.
            </p>
          } @else {
            <div class="feature-card-grid mt-4">
              @for (card of vm.cards; track card.title) {
                <article class="feature-data-card">
                  <h3>{{ card.title }}</h3>
                  @if (card.subtitle) {
                    <p>{{ card.subtitle }}</p>
                  }
                  <dl>
                    @for (field of card.fields; track field.label) {
                      <div>
                        <dt>{{ field.label }}</dt>
                        <dd>{{ field.value }}</dd>
                      </div>
                    }
                  </dl>
                </article>
              }
            </div>
          }
        }
      </mat-card>
      <mat-card class="grid content-start gap-3 p-4 sm:p-6">
        <h2 class="text-xl font-black">Accountability actions</h2>
        <button mat-button>Encourage teammate</button>
        <button mat-button>Request help</button>
        <button mat-button>Complete daily commitment</button>
      </mat-card>
    </div>
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamPage {
  #api = inject(TeamsApiService);
  vm$ = this.#api.list<unknown>().pipe(
    map((data) => ({ cards: this.#toCards(data), loading: false, error: null })),
    catchError((error) => of({ cards: [], loading: false, error })),
    startWith({ cards: [], loading: true, error: null }),
  );

  #toCards(data: unknown): TeamCard[] {
    const records = Array.isArray(data)
      ? data
      : this.#isRecord(data) && Array.isArray(data['items'])
        ? data['items']
        : [];
    return records.slice(0, 12).map((record, index) => this.#toCard(record, index));
  }

  #toCard(record: unknown, index: number): TeamCard {
    if (!this.#isRecord(record)) return { title: String(record), fields: [] };
    const entries = Object.entries(record).filter(([, value]) => this.#isPrimitive(value));
    const title = entries.find(([key]) => /^(name|displayName|email|teamName)$/i.test(key));
    const subtitle = entries.find(([key]) => /^(status|role|streak|participation)$/i.test(key) && key !== title?.[0]);
    return {
      title: title ? this.#formatValue(title[1]) : `Teammate ${index + 1}`,
      subtitle: subtitle ? this.#formatValue(subtitle[1]) : undefined,
      fields: entries
        .filter(([key]) => key !== title?.[0] && key !== subtitle?.[0])
        .slice(0, 6)
        .map(([key, value]) => ({ label: this.#humanize(key), value: this.#formatValue(value) })),
    };
  }

  #isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  #isPrimitive(value: unknown): value is string | number | boolean | null | undefined {
    return value == null || ['string', 'number', 'boolean'].includes(typeof value);
  }

  #formatValue(value: unknown): string {
    if (value == null || value === '') return 'Not set';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  }

  #humanize(key: string): string {
    return key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/^./, (char) => char.toUpperCase());
  }
}
