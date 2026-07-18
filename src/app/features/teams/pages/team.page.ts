import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
@Component({
  standalone: true,
  imports: [MatButtonModule, MatCardModule],
  template: `<section aria-labelledby="team-title">
    <h1 id="team-title">Team accountability</h1>
    <p>
      Team view intentionally shows participation, streaks, encouragement, and help indicators only. It never displays
      answers, private confidence, support notes, or weaknesses.
    </p>
    <mat-card
      ><h2>Accountability actions</h2>
      <button mat-button>Encourage teammate</button><button mat-button>Request help</button
      ><button mat-button>Complete daily commitment</button></mat-card
    >
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamPage {}
