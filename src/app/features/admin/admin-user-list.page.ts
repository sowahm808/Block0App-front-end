import { DatePipe } from '@angular/common';
import { SelectionModel } from '@angular/cdk/collections';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { AdminUser, AdminUserListResponse } from '../../core/api/api.types';
import { AdminUserApiService } from '../../core/api/remaining-feature-api.services';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LearningPackAssignmentDialogComponent } from './learning-pack-assignment-dialog.component';

@Component({
  selector: 'b0-admin-user-list',
  standalone: true,
  imports: [DatePipe, EmptyStateComponent, ErrorStateComponent, FormsModule, LoadingSkeletonComponent, MatButtonModule, MatCheckboxModule, MatChipsModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatSelectModule, MatTableModule, PageHeaderComponent],
  template: `
    <b0-page-header title="Users" description="Find scholars, review access, and assign learning packs without leaving the user list." />
    <section class="toolbar" aria-label="User filters">
      <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label>Search users</mat-label><mat-icon matPrefix>search</mat-icon><input matInput type="search" [ngModel]="query()" (ngModelChange)="setQuery($event)" placeholder="Name, email, or UID"></mat-form-field>
      <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label>Role</mat-label><mat-select [ngModel]="role()" (ngModelChange)="setRole($event)"><mat-option value="all">All roles</mat-option>@for (item of roles(); track item) { <mat-option [value]="item">{{ item }}</mat-option> }</mat-select></mat-form-field>
      <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label>Status</mat-label><mat-select [ngModel]="status()" (ngModelChange)="setStatus($event)"><mat-option value="all">All statuses</mat-option><mat-option value="active">Active</mat-option><mat-option value="disabled">Disabled</mat-option><mat-option value="unverified">Unverified</mat-option></mat-select></mat-form-field>
      <span class="result-count" aria-live="polite">{{ filteredUsers().length }} users</span>
      <button mat-flat-button [disabled]="selection.selected.length === 0" (click)="openAssignment()"><mat-icon>library_add</mat-icon>Assign packs ({{ selection.selected.length }})</button>
    </section>

    @if (loading()) { <b0-loading-skeleton [rows]="7" /> }
    @else if (error()) { <b0-error-state [message]="error()" (retry)="load()" /> }
    @else if (users().length === 0) { <b0-empty-state title="No users yet" message="Users will appear after their account is provisioned." /> }
    @else if (filteredUsers().length === 0) { <b0-empty-state title="No matching users" message="Clear or adjust the search and filters." /> }
    @else {
      <div class="table-shell">
        <table mat-table [dataSource]="pagedUsers()" aria-label="Admin users">
          <ng-container matColumnDef="select"><th mat-header-cell *matHeaderCellDef><mat-checkbox aria-label="Select all visible scholars" [checked]="allVisibleSelected()" [indeterminate]="someVisibleSelected()" (change)="toggleVisible()"></mat-checkbox></th><td mat-cell *matCellDef="let user"><mat-checkbox [disabled]="!isScholar(user)" [checked]="selection.isSelected(user)" (click)="$event.stopPropagation()" (change)="selection.toggle(user)" [attr.aria-label]="'Select ' + userName(user)"></mat-checkbox></td></ng-container>
          <ng-container matColumnDef="user"><th mat-header-cell *matHeaderCellDef>User</th><td mat-cell *matCellDef="let user"><button class="user-link" type="button" (click)="openUser(user)"><span class="avatar" aria-hidden="true">{{ initials(user) }}</span><span><strong>{{ userName(user) }}</strong><small>{{ user.email }}</small></span></button></td></ng-container>
          <ng-container matColumnDef="roles"><th mat-header-cell *matHeaderCellDef>Roles</th><td mat-cell *matCellDef="let user"><mat-chip-set>@for (item of userRoles(user); track item) { <mat-chip>{{ item }}</mat-chip> }</mat-chip-set></td></ng-container>
          <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let user"><span class="badge" [class.badge-warn]="user.disabled || user.status === 'disabled'">{{ statusLabel(user) }}</span></td></ng-container>
          <ng-container matColumnDef="security"><th mat-header-cell *matHeaderCellDef>Security</th><td mat-cell *matCellDef="let user"><span [title]="securityLabel(user)"><mat-icon class="inline-icon">{{ user.mfaEnabled ? 'verified_user' : 'shield' }}</mat-icon>{{ user.emailVerified ? 'Verified' : 'Email pending' }}</span></td></ng-container>
          <ng-container matColumnDef="cohort"><th mat-header-cell *matHeaderCellDef>Cohort</th><td mat-cell *matCellDef="let user">{{ user.activeCohortName || user.activeCohortId || '—' }}</td></ng-container>
          <ng-container matColumnDef="lastActive"><th mat-header-cell *matHeaderCellDef>Last active</th><td mat-cell *matCellDef="let user">{{ user.lastSignInAtUtc ? (user.lastSignInAtUtc | date:'mediumDate') : '—' }}</td></ng-container>
          <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef><span class="sr-only">Actions</span></th><td mat-cell *matCellDef="let user"><button mat-icon-button aria-label="Open user details" (click)="openUser(user)"><mat-icon>chevron_right</mat-icon></button></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr><tr mat-row *matRowDef="let row; columns: columns" [class.scholar-row]="isScholar(row)"></tr>
        </table>
        <mat-paginator [length]="filteredUsers().length" [pageIndex]="pageIndex()" [pageSize]="pageSize()" [pageSizeOptions]="[10, 25, 50]" (page)="changePage($event)" showFirstLastButtons />
      </div>
    }
  `,
  styles: [`
    :host{display:block}.toolbar{align-items:center;background:#fff;border:1px solid #dce4eb;border-radius:12px;display:grid;gap:1rem;grid-template-columns:minmax(16rem,2fr) minmax(10rem,1fr) minmax(10rem,1fr) auto auto;margin:1.5rem 0;padding:1rem}.result-count{color:#526170;white-space:nowrap}.table-shell{background:#fff;border:1px solid #dce4eb;border-radius:12px;overflow:auto}table{min-width:960px;width:100%}.user-link{align-items:center;background:none;border:0;color:inherit;cursor:pointer;display:flex;gap:.75rem;padding:.4rem 0;text-align:left}.user-link strong,.user-link small{display:block}.user-link strong{color:#075f8f}.user-link small{color:#647281;margin-top:.2rem}.avatar{align-items:center;background:#e4f2fa;border-radius:50%;color:#075f8f;display:flex;font-size:.75rem;font-weight:800;height:2.25rem;justify-content:center;width:2.25rem}.badge{background:#ddf6e7;border-radius:999px;color:#17643a;font-size:.75rem;font-weight:700;padding:.3rem .55rem}.badge-warn{background:#fde7e7;color:#9b1c1c}.inline-icon{font-size:1rem;height:1rem;margin-right:.3rem;vertical-align:-.15rem;width:1rem}.scholar-row{box-shadow:inset 3px 0 #1780b5}.sr-only{clip:rect(0,0,0,0);position:absolute}.mat-column-select{width:3rem}.mat-column-actions{width:3rem}@media(max-width:850px){.toolbar{grid-template-columns:1fr 1fr}.toolbar mat-form-field:first-child{grid-column:1/-1}}@media(max-width:540px){.toolbar{grid-template-columns:1fr}.toolbar mat-form-field:first-child{grid-column:auto}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUserListPage {
  readonly #api = inject(AdminUserApiService); readonly #dialog = inject(MatDialog); readonly #router = inject(Router);
  readonly users = signal<AdminUser[]>([]); readonly loading = signal(true); readonly error = signal(''); readonly query = signal(''); readonly role = signal('all'); readonly status = signal('all'); readonly pageIndex = signal(0); readonly pageSize = signal(25);
  readonly selection = new SelectionModel<AdminUser>(true); readonly columns = ['select','user','roles','status','security','cohort','lastActive','actions'];
  readonly roles = computed(() => [...new Set(this.users().flatMap((u) => this.userRoles(u)))].sort());
  readonly filteredUsers = computed(() => { const q=this.query().trim().toLowerCase(); return this.users().filter(u => (!q || [u.displayName,u.email,u.uid].some(v => v?.toLowerCase().includes(q))) && (this.role()==='all'||this.userRoles(u).includes(this.role())) && (this.status()==='all'||this.statusKey(u)===this.status())); });
  readonly pagedUsers = computed(() => this.filteredUsers().slice(this.pageIndex()*this.pageSize(),(this.pageIndex()+1)*this.pageSize()));
  constructor(){ this.restoreState(); this.load(); }
  load(){ this.loading.set(true); this.error.set(''); this.#api.users().pipe(catchError((e:unknown)=>{this.error.set(e instanceof Error?e.message:'Users could not be loaded.');return of([] as AdminUser[]);}),finalize(()=>this.loading.set(false))).subscribe(r=>this.users.set(this.unwrap(r))); }
  unwrap(r:AdminUserListResponse|AdminUser[]){return Array.isArray(r)?r:r.items??r.data??[]}
  userRoles(u:AdminUser){return u.roles?.length?u.roles:u.role?[u.role]:[]} isScholar(u:AdminUser){return this.userRoles(u).some(r=>r.toLowerCase()==='scholar')}
  userName(u:AdminUser){return u.displayName||u.email||u.uid} initials(u:AdminUser){return this.userName(u).split(/\s|@/).filter(Boolean).slice(0,2).map(x=>x[0].toUpperCase()).join('')}
  statusKey(u:AdminUser){return u.disabled||u.status==='disabled'?'disabled':!u.emailVerified?'unverified':'active'} statusLabel(u:AdminUser){return this.statusKey(u)==='unverified'?'Email pending':this.statusKey(u)==='disabled'?'Disabled':'Active'}
  securityLabel(u:AdminUser){return [u.emailVerified?'Email verified':'Email not verified',u.mfaEnabled?'MFA enabled':'MFA not enabled',u.adminMfaRequired?'Administrative MFA required':''].filter(Boolean).join('; ')}
  setQuery(v:string){this.query.set(v);this.pageIndex.set(0);this.saveState()} setRole(v:string){this.role.set(v);this.pageIndex.set(0);this.selection.clear();this.saveState()} setStatus(v:string){this.status.set(v);this.pageIndex.set(0);this.selection.clear();this.saveState()}
  changePage(e:PageEvent){this.pageIndex.set(e.pageIndex);this.pageSize.set(e.pageSize);this.saveState()} allVisibleSelected(){const s=this.pagedUsers().filter(u=>this.isScholar(u));return s.length>0&&s.every(u=>this.selection.isSelected(u))} someVisibleSelected(){const n=this.pagedUsers().filter(u=>this.isScholar(u)&&this.selection.isSelected(u)).length;return n>0&&!this.allVisibleSelected()} toggleVisible(){const s=this.pagedUsers().filter(u=>this.isScholar(u));if(this.allVisibleSelected())s.forEach(u=>this.selection.deselect(u));else s.forEach(u=>this.selection.select(u))}
  openAssignment(){this.#dialog.open(LearningPackAssignmentDialogComponent,{width:'720px',maxWidth:'95vw',data:{scholars:this.selection.selected}}).afterClosed().subscribe(result=>{if(result?.completed)this.selection.clear()})}
  openUser(u:AdminUser){this.saveState();void this.#router.navigate(['/admin/users',u.uid])}
  saveState(){sessionStorage.setItem('admin-user-list-state',JSON.stringify({query:this.query(),role:this.role(),status:this.status(),pageIndex:this.pageIndex(),pageSize:this.pageSize()}))}
  restoreState(){try{const s=JSON.parse(sessionStorage.getItem('admin-user-list-state')||'{}');this.query.set(s.query||'');this.role.set(s.role||'all');this.status.set(s.status||'all');this.pageIndex.set(s.pageIndex||0);this.pageSize.set(s.pageSize||25)}catch{sessionStorage.removeItem('admin-user-list-state')}}
}
