import { DatePipe, JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { AdminAuditEvent } from '../../core/api/api.types';
import { actionLabel, displayValue, redactAuditValue } from './audit-event.utils';

@Component({
  selector: 'b0-audit-event-detail',
  standalone: true,
  imports: [DatePipe, JsonPipe, MatButtonModule, MatDialogModule, MatExpansionModule],
  template: `
    <h2 mat-dialog-title>Audit event details</h2>
    <mat-dialog-content>
      <dl class="facts">
        <div><dt>Event ID</dt><dd>{{ event.id }}</dd></div>
        <div><dt>Time</dt><dd>{{ event.createdAtUtc | date:'medium' }}</dd></div>
        <div><dt>Actor</dt><dd>{{ event.actorDisplayName || (event.actorType === 'system' ? 'System' : 'Unknown user') }}<small>{{ event.actorEmail }}</small></dd></div>
        <div><dt>Action</dt><dd>{{ label(event.action) }}</dd></div>
        <div><dt>Category / outcome</dt><dd>{{ event.category || 'Uncategorized' }} · {{ event.outcome || 'Unknown' }}</dd></div>
        <div><dt>Entity</dt><dd>{{ event.entityTitle || 'Unknown entity' }}<small>{{ event.entityType }} @if (event.entityId) { · {{ event.entityId }} }</small></dd></div>
        <div><dt>Source</dt><dd>{{ event.source || 'Unknown' }}</dd></div>
        @if (event.notes) { <div class="wide"><dt>Summary</dt><dd>{{ event.notes }}</dd></div> }
        @if (event.requestId) { <div><dt>Request ID</dt><dd>{{ event.requestId }}</dd></div> }
        @if (event.traceId) { <div><dt>Trace ID</dt><dd>{{ event.traceId }}</dd></div> }
        @if (event.correlationId) { <div><dt>Correlation ID</dt><dd>{{ event.correlationId }}</dd></div> }
      </dl>
      @if (changedFields.length) {
        <h3>Changes</h3>
        <div class="changes" role="table" aria-label="Changed fields">
          <div class="change head" role="row"><strong>Field</strong><strong>Previous value</strong><strong>New value</strong></div>
          @for (field of changedFields; track field) {
            <div class="change" role="row"><span>{{ field }}</span><code>{{ value(event.before?.[field], field) }}</code><code>{{ value(event.after?.[field], field) }}</code></div>
          }
        </div>
      }
      <mat-expansion-panel>
        <mat-expansion-panel-header><mat-panel-title>Sanitized raw event</mat-panel-title></mat-expansion-panel-header>
        <pre>{{ sanitized | json }}</pre>
      </mat-expansion-panel>
      <p class="immutable">Audit records are immutable and cannot be edited or deleted.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end"><button mat-button mat-dialog-close>Close</button></mat-dialog-actions>
  `,
  styles: [`
    .facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;margin:0 0 1.25rem}.facts div{min-width:0}.facts .wide{grid-column:1/-1}dt{color:var(--b0-text-muted);font-size:.75rem;text-transform:uppercase}dd{margin:.25rem 0;overflow-wrap:anywhere}small{display:block;color:var(--b0-text-muted)}.changes{border:1px solid var(--b0-border);border-radius:.75rem;overflow:hidden;margin-bottom:1rem}.change{display:grid;grid-template-columns:1fr 1.5fr 1.5fr;gap:.75rem;padding:.65rem;border-bottom:1px solid var(--b0-border)}.change:last-child{border:0}.head{background:var(--b0-bg)}code,pre{white-space:pre-wrap;overflow-wrap:anywhere}.immutable{color:var(--b0-text-muted);font-size:.85rem;margin-top:1rem}@media(max-width:600px){.facts{grid-template-columns:1fr}.change{grid-template-columns:1fr}.head{display:none}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditEventDetailDialog {
  readonly event = inject<AdminAuditEvent>(MAT_DIALOG_DATA);
  readonly changedFields = this.event.changedFields?.length ? this.event.changedFields : [...new Set([...Object.keys(this.event.before ?? {}), ...Object.keys(this.event.after ?? {})])];
  readonly sanitized = redactAuditValue(this.event);
  readonly label = actionLabel;
  value(value: unknown, key: string) { return displayValue(redactAuditValue(value, key)); }
}
