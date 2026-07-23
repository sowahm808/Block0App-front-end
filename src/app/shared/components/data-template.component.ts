import { TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

interface DisplayField {
  label: string;
  value: string;
}

interface DisplayCard {
  title: string;
  subtitle?: string;
  fields: DisplayField[];
}

interface DisplayModel {
  cards: DisplayCard[];
  metrics: DisplayField[];
  hasData: boolean;
  heading: string;
  intro: string;
}

type DomainTemplate = 'notifications' | 'certificates' | 'review' | 'challenge' | 'default';

@Component({
  selector: 'b0-data-template',
  standalone: true,
  imports: [TitleCasePipe],
  template: `<section class="feature-grid" tabindex="0" [attr.aria-label]="ariaLabel">
    @let display = displayModel();
    <header class="feature-header">
      <p>{{ display.heading }}</p>
      <span>{{ display.intro }}</span>
    </header>
    @if (display.metrics.length) {
      <div class="feature-metrics" aria-label="Key metrics">
        @for (metric of display.metrics; track metric.label) {
          <div class="feature-metric">
            <span>{{ metric.label }}</span>
            <strong>{{ metric.value }}</strong>
          </div>
        }
      </div>
    }

    @if (display.cards.length) {
      <div class="feature-card-grid">
        @for (card of display.cards; track card.title) {
          <article class="feature-data-card">
            <h3>{{ card.title | titlecase }}</h3>
            @if (card.subtitle) {
              <p>{{ card.subtitle }}</p>
            }
            @if (card.fields.length) {
              <dl>
                @for (field of card.fields; track field.label) {
                  <div>
                    <dt>{{ field.label }}</dt>
                    <dd>{{ field.value }}</dd>
                  </div>
                }
              </dl>
            }
          </article>
        }
      </div>
    }
  </section>`,
  styles: [`
    :host { display: block; }
    .feature-grid { display: grid; gap: 1.25rem; }
    .feature-header { display: grid; gap: .25rem; }
    .feature-header p { margin: 0; color: var(--b0-primary, #6750a4); font-size: .8rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
    .feature-header span { color: var(--b0-text-muted, #667085); }
    .feature-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: .875rem; }
    .feature-metric, .feature-data-card { border: 1px solid color-mix(in srgb, var(--b0-primary, #6750a4) 16%, transparent); border-radius: 1.25rem; background: color-mix(in srgb, var(--b0-surface, #fff) 94%, var(--b0-primary, #6750a4)); padding: 1rem; }
    .feature-metric span, dt { color: var(--b0-text-muted, #667085); font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
    .feature-metric strong { display: block; margin-top: .35rem; font-size: 1.35rem; }
    .feature-card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 1rem; }
    .feature-data-card h3 { margin: 0; font-size: 1.1rem; font-weight: 900; }
    .feature-data-card p { margin: .4rem 0 0; color: var(--b0-text-muted, #667085); }
    dl { display: grid; gap: .75rem; margin: 1rem 0 0; }
    dl div { display: grid; gap: .25rem; }
    dd { margin: 0; overflow-wrap: anywhere; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTemplateComponent {
  @Input() data: unknown;
  @Input() ariaLabel = 'Feature content';

  displayModel(): DisplayModel {
    return this.#toDisplayModel(this.data);
  }

  #toDisplayModel(data: unknown): DisplayModel {
    const domain = this.#domainTemplate();
    const copy = this.#templateCopy(domain);
    if (data == null) return { cards: [], metrics: [], hasData: false, ...copy };
    const records = this.#extractRecords(data);
    const metrics = this.#isRecord(data)
      ? Object.entries(data)
          .filter(([, value]) => this.#isPrimitive(value))
          .slice(0, 6)
          .map(([key, value]) => ({ label: this.#humanize(key), value: this.#formatFieldValue(key, value, domain) }))
      : [];
    const cards = records.slice(0, 12).map((record, index) => this.#toCard(record, index, domain));
    if (!cards.length && metrics.length && this.#isRecord(data)) cards.push(this.#toCard(data, 0, domain));
    if (!cards.length && this.#isPrimitive(data)) cards.push({ title: this.#formatValue(data), fields: [] });
    return { cards, metrics, hasData: cards.length > 0 || metrics.length > 0, ...copy };
  }

  #extractRecords(data: unknown): unknown[] {
    if (Array.isArray(data)) return data;
    if (!this.#isRecord(data)) return [];

    const preferredKeys = ['items', 'data', 'results', 'records', 'content', 'notifications'];
    for (const key of preferredKeys) {
      const value = data[key];
      if (Array.isArray(value)) return value;
    }

    const nestedRecords = Object.entries(data).flatMap(([key, value]) =>
      Array.isArray(value) ? value.map((item) => this.#withSection(item, key)) : [],
    );

    return nestedRecords.length ? nestedRecords : [data];
  }

  #withSection(record: unknown, section: string): unknown {
    if (!this.#isRecord(record)) return record;
    return { section: this.#humanize(section), ...record };
  }

  #toCard(record: unknown, index: number, domain: DomainTemplate): DisplayCard {
    if (!this.#isRecord(record)) return { title: this.#formatValue(record), fields: [] };
    const entries = Object.entries(record).filter(([, value]) => this.#isPrimitive(value));
    const titleEntry = entries.find(([key]) => this.#titleKeys(domain).test(key));
    const subtitleEntry = entries.find(([key]) => this.#subtitleKeys(domain).test(key) && key !== titleEntry?.[0]);
    const fields = entries
      .filter(([key]) => key !== titleEntry?.[0] && key !== subtitleEntry?.[0])
      .slice(0, 8)
      .map(([key, value]) => ({ label: this.#humanize(key), value: this.#formatFieldValue(key, value, domain) }));
    return { title: titleEntry ? this.#formatValue(titleEntry[1]) : this.#fallbackTitle(domain, index), subtitle: subtitleEntry ? this.#formatFieldValue(subtitleEntry[0], subtitleEntry[1], domain) : undefined, fields };
  }

  #domainTemplate(): DomainTemplate {
    const label = this.ariaLabel.toLowerCase();
    if (label.includes('notification')) return 'notifications';
    if (label.includes('certificate')) return 'certificates';
    if (label.includes('review')) return 'review';
    if (label.includes('challenge') || label.includes('goal') || label.includes('study') || label.includes('activity')) return 'challenge';
    return 'default';
  }

  #templateCopy(domain: DomainTemplate): Pick<DisplayModel, 'heading' | 'intro'> {
    const copy: Record<DomainTemplate, Pick<DisplayModel, 'heading' | 'intro'>> = {
      notifications: { heading: 'Notification inbox', intro: 'Actionable updates grouped from the notification service.' },
      certificates: { heading: 'Certificate credentials', intro: 'Verification details formatted for learners and reviewers.' },
      review: { heading: 'Review workspace', intro: 'Content-review records prioritized for reviewer action.' },
      challenge: { heading: 'Challenge plan', intro: 'Daily study guidance and progress from the challenge service.' },
      default: { heading: 'Feature workspace', intro: 'Backend records displayed as stable product cards.' },
    };
    return copy[domain];
  }

  #titleKeys(domain: DomainTemplate): RegExp {
    if (domain === 'certificates') return /^(certificateNumber|challengeName|title|name|displayName|email|subject|label)$/i;
    return /^(title|name|displayName|email|subject|label|message)$/i;
  }

  #subtitleKeys(domain: DomainTemplate): RegExp {
    if (domain === 'notifications') return /^(read|status|channel|type|description|summary)$/i;
    if (domain === 'certificates') return /^(revoked|status|issueDate|type|description|summary)$/i;
    return /^(description|summary|status|role|type)$/i;
  }

  #fallbackTitle(domain: DomainTemplate, index: number): string {
    const labels: Record<DomainTemplate, string> = { notifications: 'Notification', certificates: 'Credential', review: 'Review item', challenge: 'Plan item', default: 'Record' };
    return `${labels[domain]} ${index + 1}`;
  }

  #isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
  #isPrimitive(value: unknown): value is string | number | boolean | null | undefined { return value == null || ['string', 'number', 'boolean'].includes(typeof value); }
  #formatValue(value: unknown): string { if (value == null || value === '') return 'Not set'; if (typeof value === 'boolean') return value ? 'Yes' : 'No'; return String(value); }
  #formatFieldValue(key: string, value: unknown, domain: DomainTemplate): string {
    if (typeof value !== 'boolean') return this.#formatValue(value);
    if (domain === 'notifications' && key.toLowerCase() === 'read') return value ? 'Read' : 'Unread';
    if (domain === 'certificates' && key.toLowerCase() === 'revoked') return value ? 'Revoked' : 'Active';
    return this.#formatValue(value);
  }
  #humanize(key: string): string { return key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, (char) => char.toUpperCase()); }
}
