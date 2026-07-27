import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { MentorTeam, MentorTeamCardComponent } from './mentor-team-card.component';

interface ApiState<T> {
  status: 'loading' | 'loaded' | 'empty' | 'error';
  data?: T;
  message?: string;
}
type TeamRecord = Partial<MentorTeam> & {
  teamId?: string;
  scholarsCount?: number;
  membersCount?: number;
  atRiskCount?: number;
  challenge?: { id?: string; name?: string };
};

export function normalizeMentorTeams(response: unknown): MentorTeam[] {
  const container = response && typeof response === 'object' ? (response as Record<string, unknown>) : {};
  const records = Array.isArray(response)
    ? response
    : (['items', 'teams', 'data', 'results'].map((key) => container[key]).find(Array.isArray) ?? []);
  return (records as TeamRecord[])
    .filter((team) => team && (team.id || team.teamId))
    .map((team) => ({
      id: String(team.id ?? team.teamId),
      name: team.name?.trim() || 'Unnamed team',
      description: team.description,
      challengeId: team.challengeId ?? team.challenge?.id,
      challengeName: team.challengeName ?? team.challenge?.name,
      memberCount: Number(team.memberCount ?? team.membersCount ?? team.scholarsCount ?? 0),
      needsAttentionCount: Number(team.needsAttentionCount ?? team.atRiskCount ?? 0),
      status: team.status || 'active',
    }));
}

@Component({
  selector: 'b0-mentor-teams',
  standalone: true,
  imports: [AsyncPipe, MentorTeamCardComponent, LoadingSkeletonComponent, EmptyStateComponent, ErrorStateComponent],
  template: `<section class="teams-page" aria-labelledby="teams-title">
    <header class="teams-hero">
      <div>
        <p class="eyebrow">Mentor workspace</p>
        <h1 id="teams-title">Your teams</h1>
        <p class="lede">Keep an eye on scholar momentum and open a team when someone needs support.</p>
      </div>
      @if (state$ | async; as summaryState) {
        @if (summaryState.status === 'loaded') {
          <div class="team-total" aria-label="Assigned team count">
            <strong>{{ summaryState.data.length }}</strong
            ><span>Assigned teams</span>
          </div>
        }
      }
    </header>
    @if (state$ | async; as state) {
      @if (state.status === 'loading') {
        <b0-loading-skeleton [rows]="6" />
      } @else if (state.status === 'error') {
        <b0-error-state [message]="state.message || 'Unable to load your teams.'" (retry)="reload()" />
      } @else if (state.status === 'empty') {
        <b0-empty-state
          title="No teams assigned"
          message="You do not have a mentor team yet. Ask an administrator to assign one to your account."
        />
      } @else {
        <div class="toolbar">
          <label class="search"
            ><span aria-hidden="true">⌕</span><span class="sr-only">Search teams</span
            ><input
              type="search"
              placeholder="Search teams or challenges"
              [value]="query()"
              (input)="updateQuery($event)"
          /></label>
          <span class="results" aria-live="polite"
            >{{ filteredTeams(state.data).length }}
            {{ filteredTeams(state.data).length === 1 ? 'team' : 'teams' }}</span
          >
        </div>
        @if (filteredTeams(state.data).length) {
          <div class="team-grid">
            @for (team of filteredTeams(state.data); track team.id) {
              <b0-mentor-team-card [team]="team" />
            }
          </div>
        } @else {
          <b0-empty-state title="No matching teams" message="Try a different team or challenge name." />
        }
      }
    }
  </section>`,
  styles: [
    `
      :host {
        display: block;
        max-width: var(--b0-container);
        margin: 0 auto;
      }
      .teams-page {
        display: grid;
        gap: 1.5rem;
      }
      .teams-hero {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 2rem;
        padding: clamp(0.5rem, 2vw, 1.25rem) 0 1.25rem;
        border-bottom: 1px solid var(--b0-border);
      }
      .eyebrow {
        margin: 0 0 0.85rem;
      }
      h1 {
        margin: 0;
        font-size: clamp(2.1rem, 5vw, 3.75rem);
        line-height: 1;
        letter-spacing: -0.055em;
      }
      .lede {
        max-width: 40rem;
        margin: 0.8rem 0 0;
        color: var(--b0-text-muted);
        line-height: 1.6;
      }
      .team-total {
        display: grid;
        min-width: 9rem;
        padding: 1rem 1.2rem;
        border: 1px solid var(--b0-border);
        border-radius: 1rem;
        background: var(--b0-surface);
        text-align: right;
        box-shadow: var(--b0-shadow-sm);
      }
      .team-total strong {
        color: var(--b0-primary);
        font-size: 1.8rem;
        line-height: 1;
      }
      .team-total span {
        margin-top: 0.3rem;
        color: var(--b0-text-muted);
        font-size: 0.75rem;
        font-weight: 700;
      }
      .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }
      .search {
        display: flex;
        align-items: center;
        width: min(100%, 25rem);
        min-height: 2.9rem;
        gap: 0.65rem;
        border: 1px solid var(--b0-border);
        border-radius: 0.85rem;
        background: var(--b0-surface-strong);
        padding: 0 0.9rem;
        color: var(--b0-text-muted);
      }
      .search:focus-within {
        border-color: var(--b0-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--b0-primary) 15%, transparent);
      }
      input {
        width: 100%;
        border: 0;
        outline: 0;
        background: transparent;
        color: var(--b0-text);
        font: inherit;
      }
      .results {
        color: var(--b0-text-muted);
        font-size: 0.82rem;
        font-weight: 700;
        white-space: nowrap;
      }
      .team-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
        gap: 1rem;
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
      }
      @media (max-width: 600px) {
        .teams-hero {
          align-items: start;
          flex-direction: column;
        }
        .team-total {
          width: 100%;
          text-align: left;
        }
        .toolbar {
          align-items: stretch;
          flex-direction: column;
        }
        .search {
          width: 100%;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorTeamsPage {
  readonly #api = inject(ApiService);
  readonly #route = inject(ActivatedRoute);
  readonly query = signal('');
  readonly state$ = this.#route.data.pipe(
    switchMap((data) =>
      this.#api.get<unknown>(String(data['apiPath'] ?? '/mentor/teams')).pipe(
        map((response) => {
          const teams = normalizeMentorTeams(response);
          return { status: teams.length ? 'loaded' : 'empty', data: teams } satisfies ApiState<MentorTeam[]>;
        }),
        startWith({ status: 'loading' } satisfies ApiState<MentorTeam[]>),
        catchError((error: unknown) =>
          of({
            status: 'error',
            message: error instanceof Error ? error.message : 'The teams service is unavailable.',
          } satisfies ApiState<MentorTeam[]>),
        ),
      ),
    ),
  );
  updateQuery(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
  }
  filteredTeams(teams: MentorTeam[] = []) {
    const query = this.query().trim().toLowerCase();
    return query
      ? teams.filter((team) =>
          `${team.name} ${team.challengeName ?? ''} ${team.challengeId ?? ''}`.toLowerCase().includes(query),
        )
      : teams;
  }
  reload() {
    window.location.reload();
  }
}
