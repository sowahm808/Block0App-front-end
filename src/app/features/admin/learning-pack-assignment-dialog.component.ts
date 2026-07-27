import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminLearningPack, AdminUser, LearningPackAssignmentResponse } from '../../core/api/api.types';
import { AdminEnrollmentApiService, AdminLearningPackApiService } from '../../core/api/remaining-feature-api.services';

@Component({
  selector: 'b0-learning-pack-assignment-dialog', standalone: true,
  imports: [DatePipe, FormsModule, MatButtonModule, MatCheckboxModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>Assign learning packs</h2>
    <mat-dialog-content>
      <div class="steps" aria-label="Assignment progress"><span [class.active]="step()===1">1 Select packs</span><span [class.active]="step()===2">2 Review</span><span [class.active]="step()===3">3 Results</span></div>
      @if (step() === 1) {
        <p><strong>{{ data.scholars.length }}</strong> selected scholar{{ data.scholars.length === 1 ? '' : 's' }}</p>
        @if (loading()) { <div class="busy"><mat-spinner diameter="32" />Loading learning packs…</div> }
        @else if (loadError()) { <p class="error" role="alert">{{ loadError() }}</p><button mat-button (click)="loadPacks()">Try again</button> }
        @else {
          <mat-form-field appearance="outline"><mat-label>Find a learning pack</mat-label><mat-icon matPrefix>search</mat-icon><input matInput [(ngModel)]="packQuery"></mat-form-field>
          <div class="pack-list" role="group" aria-label="Available learning packs">@for (pack of filteredPacks(); track pack.id) { <mat-checkbox [checked]="selectedPackIds().includes(pack.id)" (change)="togglePack(pack.id)"><strong>{{ pack.title }}</strong><small>{{ pack.code || pack.topic || pack.id }}</small></mat-checkbox> } @empty { <p>No published learning packs match your search.</p> }</div>
          <div class="timing"><mat-form-field appearance="outline"><mat-label>Available from (optional)</mat-label><input matInput type="datetime-local" [(ngModel)]="availableFrom"></mat-form-field><mat-form-field appearance="outline"><mat-label>Due date (optional)</mat-label><input matInput type="datetime-local" [(ngModel)]="dueAt"></mat-form-field></div>
          <mat-form-field appearance="outline"><mat-label>Administrator notes (optional)</mat-label><textarea matInput rows="3" maxlength="500" [(ngModel)]="notes"></textarea><mat-hint align="end">{{ notes.length }}/500</mat-hint></mat-form-field>
        }
      } @else if (step() === 2) {
        <p>Review this bulk operation before submitting. Existing active assignments will be skipped.</p>
        <dl><div><dt>Scholars</dt><dd>{{ data.scholars.length }}</dd></div><div><dt>Learning packs</dt><dd>{{ selectedPackIds().length }}</dd></div><div><dt>Potential assignments</dt><dd>{{ data.scholars.length * selectedPackIds().length }}</dd></div></dl>
        <h3>Learning packs</h3><ul>@for (pack of selectedPacks(); track pack.id) { <li>{{ pack.title }}</li> }</ul>
        @if (availableFrom) { <p><strong>Available:</strong> {{ availableFrom | date:'medium' }}</p> } @if (dueAt) { <p><strong>Due:</strong> {{ dueAt | date:'medium' }}</p> } @if (notes) { <p><strong>Notes:</strong> {{ notes }}</p> }
        @if (submitError()) { <p class="error" role="alert">{{ submitError() }}</p> }
      } @else {
        <div class="result-heading"><mat-icon>task_alt</mat-icon><div><h3>Assignment processing complete</h3><p>The table remains ready for your next task.</p></div></div>
        <dl><div class="created"><dt>Created</dt><dd>{{ result()?.createdCount ?? result()?.assignedCount ?? 0 }}</dd></div><div><dt>Skipped</dt><dd>{{ result()?.skippedCount ?? 0 }}</dd></div><div class="failed"><dt>Failed</dt><dd>{{ result()?.failedCount ?? 0 }}</dd></div></dl>
        @if (result()?.failures?.length) { <h3>Failures</h3><ul>@for (failure of result()!.failures!; track failure.scholarId + failure.learningPackId) { <li>{{ failure.scholarId }} / {{ failure.learningPackId }}: {{ failure.message }}</li> }</ul> }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      @if (step() === 1) { <button mat-button mat-dialog-close>Cancel</button><button mat-flat-button [disabled]="selectedPackIds().length===0 || loading()" (click)="step.set(2)">Review assignment</button> }
      @else if (step() === 2) { <button mat-button [disabled]="submitting()" (click)="step.set(1)">Back</button><button mat-flat-button [disabled]="submitting()" (click)="submit()">{{ submitting() ? 'Assigning…' : 'Confirm assignment' }}</button> }
      @else { <button mat-flat-button (click)="close()">Done</button> }
    </mat-dialog-actions>
  `,
  styles: [`:host{display:block}.steps{display:flex;gap:.5rem;margin-bottom:1.25rem}.steps span{background:#eef2f5;border-radius:999px;color:#657383;font-size:.78rem;font-weight:700;padding:.4rem .7rem}.steps .active{background:#d9effa;color:#075f8f}.pack-list{border:1px solid #dce4eb;border-radius:8px;display:grid;max-height:15rem;overflow:auto;padding:.35rem}.pack-list mat-checkbox{border-bottom:1px solid #edf1f4;padding:.55rem}.pack-list small{color:#657383;display:block}.timing{display:grid;gap:1rem;grid-template-columns:1fr 1fr;margin-top:1rem}mat-form-field{width:100%}.busy{align-items:center;display:flex;gap:1rem;padding:2rem}.error,.failed{color:#a51d2d}dl{display:grid;gap:.75rem;grid-template-columns:repeat(3,1fr)}dl div{background:#f5f8fa;border-radius:8px;padding:1rem}dt{color:#657383;font-size:.8rem}dd{font-size:1.5rem;font-weight:800;margin:.25rem 0}.created{color:#17643a}.result-heading{align-items:center;display:flex;gap:1rem}.result-heading>mat-icon{color:#178047;font-size:2.5rem;height:2.5rem;width:2.5rem}.result-heading h3,.result-heading p{margin:.2rem 0}@media(max-width:560px){.timing,dl{grid-template-columns:1fr}}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearningPackAssignmentDialogComponent {
  readonly #packsApi=inject(AdminLearningPackApiService); readonly #enrollments=inject(AdminEnrollmentApiService); readonly #ref=inject(MatDialogRef<LearningPackAssignmentDialogComponent>);
  readonly packs=signal<AdminLearningPack[]>([]); readonly selectedPackIds=signal<string[]>([]); readonly step=signal(1); readonly loading=signal(true); readonly loadError=signal(''); readonly submitting=signal(false); readonly submitError=signal(''); readonly result=signal<LearningPackAssignmentResponse|null>(null);
  packQuery=''; availableFrom=''; dueAt=''; notes='';
  constructor(@Inject(MAT_DIALOG_DATA) readonly data:{scholars:AdminUser[]}){this.loadPacks()}
  loadPacks(){this.loading.set(true);this.loadError.set('');this.#packsApi.catalog({status:'published'}).subscribe({next:r=>{this.packs.set(Array.isArray(r)?r:r.items??r.data??[]);this.loading.set(false)},error:()=>{this.loadError.set('Learning packs could not be loaded.');this.loading.set(false)}})}
  filteredPacks(){const q=this.packQuery.trim().toLowerCase();return this.packs().filter(p=>(p.publicationStatus||p.status||'').toLowerCase()==='published'&&(!q||[p.title,p.code,p.topic].some(v=>v?.toLowerCase().includes(q))))}
  selectedPacks(){return this.packs().filter(p=>this.selectedPackIds().includes(p.id))} togglePack(id:string){this.selectedPackIds.update(ids=>ids.includes(id)?ids.filter(x=>x!==id):[...ids,id])}
  submit(){if(this.availableFrom&&this.dueAt&&new Date(this.dueAt)<=new Date(this.availableFrom)){this.submitError.set('Due date must be after the availability date.');return}this.submitting.set(true);this.submitError.set('');this.#enrollments.assignLearningPacks({scholarIds:this.data.scholars.map(s=>s.uid),learningPackIds:this.selectedPackIds(),availableFromUtc:this.availableFrom?new Date(this.availableFrom).toISOString():undefined,dueAtUtc:this.dueAt?new Date(this.dueAt).toISOString():undefined,notes:this.notes.trim()||undefined}).subscribe({next:r=>{this.result.set(r);this.submitting.set(false);this.step.set(3)},error:()=>{this.submitError.set('Assignments could not be completed. No assumptions were made about partial success; try again or check the audit log.');this.submitting.set(false)}})}
  close(){this.#ref.close({completed:true,result:this.result()})}
}
