import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StatusBadgeComponent, StatusTone } from '../../shared/ui/status-badge/status-badge.component';

export interface MentorTeam {
  id: string;
  name: string;
  description?: string;
  challengeId?: string;
  challengeName?: string;
  memberCount: number;
  needsAttentionCount?: number;
  status: string;
}

@Component({
  selector: 'b0-mentor-team-card',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  template: `<article class="team-card">
    <div class="team-card__topline">
      <div class="team-mark" aria-hidden="true">{{ initials() }}</div>
      <b0-status-badge [label]="statusLabel()" [tone]="statusTone()" />
    </div>
    <div class="team-card__body">
      <h2>{{ team().name }}</h2>
      <p>{{ team().description || 'A focused learning team working through the Block Zero programme.' }}</p>
    </div>
    <dl class="team-facts">
      <div>
        <dt>Scholars</dt>
        <dd>{{ team().memberCount }}</dd>
      </div>
      <div>
        <dt>Need support</dt>
        <dd [class.has-alerts]="(team().needsAttentionCount || 0) > 0">{{ team().needsAttentionCount || 0 }}</dd>
      </div>
    </dl>
    @if (team().challengeName || team().challengeId) {
      <div class="challenge">
        <span>Current challenge</span><strong>{{ team().challengeName || humanize(team().challengeId!) }}</strong>
      </div>
    }
    <a class="team-link" [routerLink]="['/mentor/teams', team().id]" [attr.aria-label]="'View ' + team().name">
      View team <span aria-hidden="true">→</span>
    </a>
  </article>`,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }
      .team-card {
        display: flex;
        flex-direction: column;
        min-height: 100%;
        overflow: hidden;
        border: 1px solid var(--b0-border);
        border-radius: 1.25rem;
        background: var(--b0-surface-strong);
        box-shadow: var(--b0-shadow-sm);
        transition:
          transform var(--b0-motion-base),
          box-shadow var(--b0-motion-base),
          border-color var(--b0-motion-base);
      }
      .team-card:hover {
        transform: translateY(-3px);
        border-color: color-mix(in srgb, var(--b0-primary) 38%, var(--b0-border));
        box-shadow: var(--b0-shadow-md);
      }
      .team-card__topline {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.25rem 1.25rem 0;
      }
      .team-mark {
        display: grid;
        width: 2.75rem;
        height: 2.75rem;
        place-items: center;
        border-radius: 0.9rem;
        background: color-mix(in srgb, var(--b0-primary) 12%, var(--b0-surface-strong));
        color: var(--b0-primary);
        font-size: 0.8rem;
        font-weight: 900;
      }
      .team-card__body {
        padding: 1rem 1.25rem 1.15rem;
      }
      h2 {
        margin: 0;
        font-size: 1.2rem;
        line-height: 1.25;
        letter-spacing: -0.02em;
      }
      p {
        margin: 0.55rem 0 0;
        color: var(--b0-text-muted);
        font-size: 0.9rem;
        line-height: 1.55;
      }
      .team-facts {
        display: grid;
        grid-template-columns: 1fr 1fr;
        margin: auto 1.25rem 0;
        border-block: 1px solid var(--b0-border);
      }
      .team-facts div {
        padding: 0.9rem 0;
      }
      .team-facts div + div {
        border-left: 1px solid var(--b0-border);
        padding-left: 1rem;
      }
      dt,
      .challenge span {
        color: var(--b0-text-muted);
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      dd {
        margin: 0.25rem 0 0;
        font-size: 1.25rem;
        font-weight: 900;
      }
      dd.has-alerts {
        color: var(--b0-warning);
      }
      .challenge {
        display: grid;
        gap: 0.3rem;
        padding: 1rem 1.25rem 0;
      }
      .challenge strong {
        overflow-wrap: anywhere;
        font-size: 0.85rem;
      }
      .team-link {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 3.5rem;
        margin-top: 1rem;
        padding: 0 1.25rem;
        background: color-mix(in srgb, var(--b0-primary) 7%, transparent);
        color: var(--b0-primary);
        font-size: 0.9rem;
        font-weight: 800;
        text-decoration: none;
      }
      .team-link:hover {
        background: color-mix(in srgb, var(--b0-primary) 13%, transparent);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorTeamCardComponent {
  team = input.required<MentorTeam>();
  initials() {
    return this.team()
      .name.split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }
  statusLabel() {
    return this.humanize(this.team().status || 'active');
  }
  statusTone(): StatusTone {
    return /active|open/i.test(this.team().status)
      ? 'success'
      : /paused|pending/i.test(this.team().status)
        ? 'warning'
        : 'neutral';
  }
  humanize(value: string) {
    return value.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}
