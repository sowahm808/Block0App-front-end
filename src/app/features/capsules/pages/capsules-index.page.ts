import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'b0-capsules-index-page',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatCardModule, PageHeaderComponent],
  template: `<section class="grid gap-5" aria-labelledby="capsules-title">
    <b0-page-header
      title="Capsules"
      description="Pick up an active capsule from today's challenge or start the next available capsule from your learning packs."
    />

    <div class="grid gap-4 md:grid-cols-2">
      <mat-card class="grid gap-3 p-5">
        <div>
          <p class="eyebrow m-0">Resume study</p>
          <h2 id="capsules-title" class="m-0 mt-1 text-2xl font-black">Continue today's capsule</h2>
        </div>
        <p class="m-0 text-[var(--b0-text-muted)]">
          The current capsule attempt is selected from your daily challenge progress so you can keep moving without
          searching for an attempt ID.
        </p>
        <a mat-flat-button color="primary" routerLink="/challenge/today">Open Today's Challenge</a>
      </mat-card>

      <mat-card class="grid gap-3 p-5">
        <div>
          <p class="eyebrow m-0">Start study</p>
          <h2 class="m-0 mt-1 text-2xl font-black">Browse learning packs</h2>
        </div>
        <p class="m-0 text-[var(--b0-text-muted)]">
          Learning packs show every assigned capsule, status, and start action returned by the backend.
        </p>
        <a mat-stroked-button routerLink="/learning-packs">View Learning Packs</a>
      </mat-card>
    </div>
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CapsulesIndexPage {}
