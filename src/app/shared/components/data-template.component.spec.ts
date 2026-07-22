import { describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DataTemplateComponent } from './data-template.component';

describe(DataTemplateComponent.name, () => {
  it('builds cards from nested dashboard collections', async () => {
    await TestBed.configureTestingModule({ imports: [DataTemplateComponent] }).compileComponents();
    const fixture = TestBed.createComponent(DataTemplateComponent);
    Object.defineProperty(fixture.componentInstance, 'data', {
      value: () => ({
        totalTeams: 2,
        teams: [
          { name: 'Alpha Team', status: 'Active', atRiskScholars: 1 },
          { name: 'Beta Team', status: 'Needs attention', atRiskScholars: 3 },
        ],
        supportRequests: [{ subject: 'Needs pacing help', status: 'Open', scholarName: 'Ada' }],
      }),
    });

    const display = fixture.componentInstance.displayModel();

    expect(display.hasData).toBe(true);
    expect(display.cards.map((card) => card.title)).toEqual(['Alpha Team', 'Beta Team', 'Needs pacing help']);
    expect(display.cards[2].fields).toContainEqual({ label: 'Section', value: 'Support Requests' });
  });
});
