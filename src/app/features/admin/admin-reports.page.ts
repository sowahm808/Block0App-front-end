import { AsyncPipe, DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, combineLatest, debounceTime, distinctUntilChanged, map, merge, of, startWith, Subject, switchMap, shareReplay, take } from 'rxjs';
import { AdminReportApiService } from '../../core/api/remaining-feature-api.services';
import { AdminReportOverview, ReportQueryParams } from '../../core/api/api.types';
import { AuthStore } from '../../core/auth/auth.store';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';

type ReportSection = 'overview' | 'scholars' | 'cohorts' | 'challenges' | 'learning-packs' | 'questions';
type ReportRow = Record<string, unknown>;
interface ReportState { loading: boolean; overview?: AdminReportOverview; rows: ReportRow[]; error?: string; updatedAtUtc?: string; }
const sections: Array<{ key: ReportSection; label: string; permission?: string }> = [
  { key: 'overview', label: 'Overview' }, { key: 'scholars', label: 'Scholars', permission: 'reports.scholar.read' },
  { key: 'cohorts', label: 'Cohorts', permission: 'reports.cohort.read' }, { key: 'challenges', label: 'Challenges', permission: 'reports.challenge.read' },
  { key: 'learning-packs', label: 'Learning Packs', permission: 'reports.learning-pack.read' }, { key: 'questions', label: 'Questions', permission: 'reports.question.read' },
];

@Component({
  selector: 'b0-admin-reports', standalone: true,
  imports: [AsyncPipe, DatePipe, DecimalPipe, PercentPipe, ReactiveFormsModule, RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatTabsModule, PageHeaderComponent, LoadingSkeletonComponent, EmptyStateComponent, ErrorStateComponent],
  template: `
  <section class="reports" aria-labelledby="reports-title">
    <b0-page-header titleId="reports-title" title="Reports & Analytics" description="Monitor scholar progress, challenge performance, cohort health, and learning outcomes." eyebrow="Admin workspace">
      <button mat-stroked-button type="button" (click)="print()"><mat-icon>print</mat-icon> Print</button>
      @if (canExport()) { <button mat-flat-button type="button" (click)="exportCsv()"><mat-icon>download</mat-icon> Export CSV</button> }
    </b0-page-header>

    <mat-card class="filters" aria-label="Report filters">
      <form [formGroup]="filters" class="filter-grid">
        <mat-form-field appearance="outline"><mat-label>Date preset</mat-label><mat-select formControlName="preset" (selectionChange)="applyPreset($event.value)"><mat-option value="today">Today</mat-option><mat-option value="7">Last 7 days</mat-option><mat-option value="30">Last 30 days</mat-option><mat-option value="month">This month</mat-option><mat-option value="last-month">Last month</mat-option><mat-option value="custom">Custom</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Start date</mat-label><input matInput type="date" formControlName="start" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>End date</mat-label><input matInput type="date" formControlName="end" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Challenge</mat-label><mat-select formControlName="challengeId"><mat-option value="">All challenges</mat-option>@for (option of (state$ | async)?.overview?.challenges ?? []; track option.id) { <mat-option [value]="option.id">{{ option.label }}</mat-option> }</mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Cohort</mat-label><mat-select formControlName="cohortId"><mat-option value="">All cohorts</mat-option>@for (option of (state$ | async)?.overview?.cohorts ?? []; track option.id) { <mat-option [value]="option.id">{{ option.label }}</mat-option> }</mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Status</mat-label><mat-select formControlName="status"><mat-option value="">Any status</mat-option><mat-option value="active">Active</mat-option><mat-option value="completed">Completed</mat-option><mat-option value="overdue">Overdue</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline" class="search"><mat-label>Scholar search</mat-label><input matInput formControlName="scholarSearch" placeholder="Name or email" /></mat-form-field>
      </form>
      @if (filters.hasError('dateOrder')) { <p class="filter-error" role="alert">End date cannot be before start date.</p> }
      <div class="filter-actions"><span>{{ rangeLabel() }}</span><button mat-button type="button" (click)="clearFilters()">Clear filters</button><button mat-stroked-button type="button" (click)="refresh()"><mat-icon>refresh</mat-icon> Refresh</button></div>
    </mat-card>

    <nav aria-label="Report categories"><mat-tab-group [selectedIndex]="selectedIndex()" (selectedIndexChange)="selectSection($event)">@for (section of availableSections; track section.key) { <mat-tab [label]="section.label" /> }</mat-tab-group></nav>

    @if (state$ | async; as state) {
      @if (state.loading) { <b0-loading-skeleton [rows]="7" label="Loading report" /> }
      @else if (state.error) { <b0-error-state title="Report unavailable" [message]="state.error" (retry)="refresh()" /> }
      @else {
        <div class="freshness">Updated {{ state.updatedAtUtc ? (state.updatedAtUtc | date:'medium') : 'just now' }}</div>
        @if (activeSection() === 'overview' && state.overview; as overview) {
          <div class="metrics" aria-label="Executive summary">
            @for (metric of metricCards(overview); track metric.label) { <button type="button" class="metric" (click)="openMetric(metric.section)"><span>{{ metric.label }}</span><strong>{{ metric.percent ? (metric.value | percent:'1.0-1') : (metric.value | number) }}</strong></button> }
          </div>
          <div class="charts">
            <mat-card><h2>Completion trend</h2><p class="sr-only">Completion rate over the selected reporting period.</p>@if (overview.completionTrend?.length) { <div class="bars" role="img" aria-label="Completion rate by date">@for (point of overview.completionTrend; track point.date) { <div class="bar-row"><span>{{ point.label || (point.date | date:'MMM d') }}</span><div class="track"><i [style.width.%]="point.value * 100"></i></div><strong>{{ point.value | percent:'1.0-0' }}</strong></div> }</div> } @else { <b0-empty-state title="No completion trend" message="No completion activity was recorded for this period." /> }</mat-card>
            <mat-card><h2>Assignment status</h2><p class="sr-only">Assignment counts grouped by status.</p>@if (overview.assignmentStatus?.length) { <div class="bars">@for (point of overview.assignmentStatus; track point.key) { <div class="bar-row"><span>{{ point.label }}</span><div class="track"><i [style.width.%]="distributionWidth(point.value, overview.assignmentStatus!)"></i></div><strong>{{ point.value }}</strong></div> }</div> } @else { <b0-empty-state title="No assignment data" message="No assignments match the selected filters." /> }</mat-card>
          </div>
        } @else if (!state.rows.length) { <b0-empty-state [title]="emptyTitle()" [message]="emptyMessage()" /> }
        @else { <div class="table-wrap"><table><thead><tr>@for (column of columns(); track column.key) { <th scope="col">{{ column.label }}</th> }<th scope="col">Actions</th></tr></thead><tbody>@for (row of state.rows; track rowId(row)) { <tr>@for (column of columns(); track column.key) { <td>{{ formatCell(row, column.key) }}</td> }<td><a mat-button [routerLink]="detailLink(row)">View details</a></td></tr> }</tbody></table></div> }
      }
    }
  </section>`,
  styles: [`
    :host{display:block}.reports{display:grid;gap:1.25rem}.filters{padding:1rem}.filter-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));gap:.75rem}.search{grid-column:span 2}.filter-actions{display:flex;align-items:center;justify-content:flex-end;gap:.75rem;color:var(--b0-text-muted,#667085)}.filter-actions span{margin-right:auto}.filter-error{color:#b42318;margin:0}.freshness{text-align:right;color:var(--b0-text-muted,#667085);font-size:.8rem}.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));gap:1rem}.metric{padding:1.1rem;text-align:left;border:1px solid #d8d2e6;border-radius:1rem;background:var(--b0-surface,#fff);cursor:pointer}.metric span{display:block;color:var(--b0-text-muted,#667085);font-weight:700}.metric strong{display:block;font-size:1.7rem;margin-top:.4rem}.metric:focus-visible{outline:3px solid var(--b0-primary,#6750a4)}.charts{display:grid;grid-template-columns:repeat(auto-fit,minmax(20rem,1fr));gap:1rem}.charts mat-card{padding:1.25rem}.charts h2{margin:0 0 1rem}.bars{display:grid;gap:.8rem}.bar-row{display:grid;grid-template-columns:minmax(6rem,1fr) 3fr 3rem;gap:.5rem;align-items:center}.track{height:.75rem;background:#e9e5ef;border-radius:1rem;overflow:hidden}.track i{display:block;height:100%;background:var(--b0-primary,#6750a4)}.table-wrap{overflow:auto;border:1px solid #ddd;border-radius:1rem;background:var(--b0-surface,#fff)}table{border-collapse:collapse;width:100%;min-width:900px}th,td{text-align:left;padding:.8rem;border-bottom:1px solid #e5e7eb}th{font-size:.78rem;text-transform:uppercase;letter-spacing:.03em}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}@media print{.filters,nav,.page-actions,button{display:none!important}.reports{display:block}.charts,.metrics{break-inside:avoid}.table-wrap{overflow:visible}table{min-width:0;font-size:10px}}@media(max-width:600px){.search{grid-column:auto}.filter-actions{flex-wrap:wrap}}
  `], changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminReportsPage {
  readonly #api = inject(AdminReportApiService); readonly #auth = inject(AuthStore); readonly #route = inject(ActivatedRoute); readonly #router = inject(Router); readonly #destroyRef = inject(DestroyRef);
  readonly #refresh = new Subject<void>(); readonly #section = new BehaviorSubject<ReportSection>('overview');
  readonly availableSections = sections.filter((item) => !item.permission || this.#auth.hasPermission([item.permission]));
  readonly filters = new FormGroup({ preset: new FormControl('30', { nonNullable: true }), start: new FormControl('', { nonNullable: true, validators: Validators.required }), end: new FormControl('', { nonNullable: true, validators: Validators.required }), challengeId: new FormControl('', { nonNullable: true }), cohortId: new FormControl('', { nonNullable: true }), status: new FormControl('', { nonNullable: true }), scholarSearch: new FormControl('', { nonNullable: true }) }, { validators: (control) => { const value = control.value as { start?: string; end?: string }; return value.start && value.end && value.start > value.end ? { dateOrder: true } : null; } });
  readonly state$ = combineLatest([this.#section, merge(this.filters.valueChanges.pipe(debounceTime(300), distinctUntilChanged((a,b)=>JSON.stringify(a)===JSON.stringify(b))), this.#refresh.pipe(map(() => this.filters.getRawValue()))).pipe(startWith(this.filters.getRawValue()))]).pipe(switchMap(([section, value]) => { if (this.filters.invalid) return of({ loading:false, rows:[], error:'Correct the invalid date range to run this report.' } as ReportState); const params=this.params(value); this.syncUrl(section, value); return combineLatest([this.#api.overview(params), section === 'overview' ? of({items:[], updatedAtUtc: undefined}): this.loadRows(section, params)]).pipe(map(([overview,list])=>({loading:false,overview,rows:list.items as ReportRow[],updatedAtUtc:list.updatedAtUtc ?? overview.updatedAtUtc} as ReportState)), startWith({loading:true,rows:[]} as ReportState), catchError((e)=>of({loading:false,rows:[],error:this.errorMessage(e)} as ReportState))); }), shareReplay({ bufferSize: 1, refCount: true }));
  constructor(){ const q=this.#route.snapshot.queryParamMap; const section=q.get('section') as ReportSection; if(sections.some(s=>s.key===section)) this.#section.next(section); const end=q.get('end') ?? this.isoDate(new Date()); const start=q.get('start') ?? this.isoDate(new Date(Date.now()-29*86400000)); this.filters.patchValue({start,end,preset:q.get('preset')??'30',challengeId:q.get('challengeId')??'',cohortId:q.get('cohortId')??'',status:q.get('status')??'',scholarSearch:q.get('scholarSearch')??''},{emitEvent:false}); this.filters.valueChanges.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(); }
  activeSection(){return this.#section.value} selectedIndex(){return Math.max(0,this.availableSections.findIndex(s=>s.key===this.activeSection()))} selectSection(index:number){this.#section.next(this.availableSections[index]?.key??'overview')} refresh(){this.#refresh.next()} print(){window.print()} canExport(){return this.#auth.hasPermission(['reports.export'])}
  clearFilters(){this.applyPreset('30');this.filters.patchValue({challengeId:'',cohortId:'',status:'',scholarSearch:''})}
  applyPreset(preset:string){const now=new Date();let start=new Date(now),end=new Date(now);if(preset==='7')start=new Date(now.getTime()-6*86400000);else if(preset==='30')start=new Date(now.getTime()-29*86400000);else if(preset==='month')start=new Date(now.getFullYear(),now.getMonth(),1);else if(preset==='last-month'){start=new Date(now.getFullYear(),now.getMonth()-1,1);end=new Date(now.getFullYear(),now.getMonth(),0)}else if(preset==='custom')return;this.filters.patchValue({preset,start:this.isoDate(start),end:this.isoDate(end)})}
  rangeLabel(){const v=this.filters.getRawValue();return `${v.start || 'Start'} – ${v.end || 'End'}`}
  metricCards(o:AdminReportOverview){return [{label:'Active scholars',value:o.activeScholarCount,section:'scholars' as ReportSection},{label:'Active cohorts',value:o.activeCohortCount,section:'cohorts' as ReportSection},{label:'Active challenges',value:o.activeChallengeCount,section:'challenges' as ReportSection},{label:'Assigned packs',value:o.assignedLearningPackCount,section:'learning-packs' as ReportSection},{label:'Completion rate',value:o.completionRate??0,percent:true,section:'learning-packs' as ReportSection},{label:'Average accuracy',value:o.averageAccuracy??0,percent:true,section:'questions' as ReportSection},{label:'Overdue assignments',value:o.overdueAssignmentCount,section:'scholars' as ReportSection},{label:'Readiness rate',value:o.readinessRate??0,percent:true,section:'scholars' as ReportSection}]}
  openMetric(section:ReportSection){const index=this.availableSections.findIndex(s=>s.key===section);if(index>=0)this.selectSection(index)} distributionWidth(value:number,points:{value:number}[]){return value/Math.max(...points.map(p=>p.value),1)*100}
  columns(){const map:Record<ReportSection,[string,string][]>={overview:[],scholars:[['displayName','Scholar'],['cohortName','Cohort'],['assignedPackCount','Assigned'],['completedPackCount','Completed'],['completionRate','Completion'],['averageAccuracy','Accuracy'],['readinessBand','Readiness'],['overdueCount','Overdue'],['lastActivityAtUtc','Last activity'],['riskLevel','Risk']],cohorts:[['cohortName','Cohort'],['challengeTitle','Challenge'],['scholarCount','Scholars'],['completionRate','Completion'],['averageAccuracy','Accuracy'],['readinessRate','Readiness'],['overdueCount','Overdue'],['mentorNames','Mentors'],['healthStatus','Health']],challenges:[['title','Challenge'],['status','Status'],['cohortCount','Cohorts'],['scholarCount','Scholars'],['learningPackCount','Packs'],['completionRate','Completion'],['averageAccuracy','Accuracy'],['readinessRate','Readiness'],['startAtUtc','Start'],['endAtUtc','End']], 'learning-packs':[['title','Learning pack'],['topic','Topic'],['status','Status'],['assignedCount','Assigned'],['startedCount','Started'],['completedCount','Completed'],['completionRate','Completion'],['averageAccuracy','Accuracy'],['overdueCount','Overdue']],questions:[['title','Question'],['learningPackTitle','Learning pack'],['capsuleId','Capsule'],['attemptCount','Attempts'],['correctRate','Correct rate'],['mostSelectedWrongChoice','Common wrong answer'],['difficulty','Difficulty'],['status','Status'],['reviewFlags','Review signals']]};return map[this.activeSection()].map(([key,label])=>({key,label}))}
  formatCell(row:ReportRow,key:string){const value=row[key];if(value==null||value==='')return '—';if(Array.isArray(value))return value.join(', ');if(/Rate$|accuracy|completion/i.test(key)&&typeof value==='number')return `${Math.round(value*100)}%`;if(/AtUtc$|^startAt|^endAt/.test(key)&&(typeof value==='string'||typeof value==='number'))return new Date(value).toLocaleDateString();return String(value)}
  rowId(row:ReportRow){return row['scholarId']??row['cohortId']??row['challengeId']??row['learningPackId']??row['questionId']} detailLink(row:ReportRow){const s=this.activeSection();if(s==='scholars')return ['/admin/users',row['scholarId']];if(s==='cohorts')return ['/admin/cohorts',row['cohortId']];if(s==='challenges')return ['/admin/challenges',row['challengeId']];if(s==='learning-packs')return ['/admin/learning-packs',row['learningPackId']];return ['/admin/questions',row['questionId']]}
  emptyTitle(){return `No ${this.activeSection().replace('-',' ')} found`} emptyMessage(){return this.activeSection()==='scholars'?'No scholar activity was recorded for this period.':`No ${this.activeSection().replace('-',' ')} match the selected filters.`}
  exportCsv(){let rows:ReportRow[]=[];this.state$.pipe(take(1)).subscribe(state=>{rows=state.rows;const cols=this.columns();const csv='\uFEFF'+[cols.map(c=>c.label),...rows.map(r=>cols.map(c=>this.formatCell(r,c.key)))].map(line=>line.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=`${this.activeSection()}-report-${this.isoDate(new Date())}.csv`;a.click();URL.revokeObjectURL(a.href)})}
  private loadRows(section:ReportSection,p:ReportQueryParams){if(section==='scholars')return this.#api.scholars(p);if(section==='cohorts')return this.#api.cohorts(p);if(section==='challenges')return this.#api.challenges(p);if(section==='learning-packs')return this.#api.learningPacks(p);return this.#api.questions(p)}
  private params(v:Partial<typeof this.filters.value>):ReportQueryParams{return Object.fromEntries(Object.entries({startAtUtc:v.start?`${v.start}T00:00:00.000Z`:'',endAtUtc:v.end?`${v.end}T23:59:59.999Z`:'',challengeId:v.challengeId,cohortId:v.cohortId,status:v.status,scholarSearch:v.scholarSearch,pageSize:100}).filter(([,x])=>x!==''&&x!=null)) as ReportQueryParams}
  private syncUrl(section:ReportSection,v:Record<string, unknown>){void this.#router.navigate([],{relativeTo:this.#route,queryParams:{section,...v},replaceUrl:true})} private isoDate(d:Date){return d.toISOString().slice(0,10)}
  private errorMessage(e:unknown){if(e instanceof HttpErrorResponse){return ({401:'Your session expired. Sign in again.',403:'You do not have access to this report.',404:'This report endpoint is not available yet.',422:'The selected filters are invalid.',500:'Report generation failed. Try again.'} as Record<number,string>)[e.status]??'Unable to load reporting data.'}return e instanceof Error?e.message:'Unable to load reporting data.'}
}
