import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { DashboardPage } from '../dashboard/pages/dashboard.page';
import { DashboardService } from '../dashboard/data-access/dashboard.service';
import { LearningPacksPage } from './pages/learning-packs.page';
import { LearningPacksService } from './data-access/learning-packs.service';
import { sanitizeCapsuleResume } from '../capsules/pages/capsule.page';
import { showCorrectAnswer } from '../questions/state/question-state-machine';
import { ImportLearningPackPage } from '../admin/pages/import-learning-pack.page';
import { ContentImportService } from '../admin/data-access/content-import.service';
import { APP_NAVIGATION } from '../../core/layout/navigation';
import { AuthStore } from '../../core/auth/auth.store';

const dashboard = { scholarName:'Ada', currentChallenge:'Block Zero', currentDay:1, dailyTarget:2, questionsCompletedToday:1, capsulesCompletedToday:0, overallCompletion:10, knowledgeAccuracy:80, scenarioPerformance:70, currentStreak:3, morningCheckInDone:true, eveningCheckInDone:false, teamActivity:'Active', readinessLevel:'Green', raffleEntries:1, announcements:[], assignedLearningPacks:[{ title:'Day 1 Foundations', dayNumber:1 }], continueUrl:'/capsules/attempt-day-01' };

describe('learning content UI', () => {
  it('dashboard renders assigned learning pack and continue CTA', async () => {
    await TestBed.configureTestingModule({ imports:[DashboardPage], providers:[provideNoopAnimations(), provideRouter([]), { provide: DashboardService, useValue: { getDashboard: () => of(dashboard) } }] }).compileComponents();
    const fixture = TestBed.createComponent(DashboardPage); fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Day 1 Foundations');
    expect(fixture.nativeElement.textContent).toContain('Continue Studying');
  });

  it('learning-packs page renders backend records', async () => {
    await TestBed.configureTestingModule({ imports:[LearningPacksPage], providers:[provideNoopAnimations(), provideRouter([]), { provide: DashboardService, useValue: { getDashboard: () => of(dashboard) } }, { provide: LearningPacksService, useValue: { list: () => of([{ title:'Published Pack', description:'Ready', dayNumber:2, capsuleCount:1, questionCount:4 }]) } }] }).compileComponents();
    const fixture = TestBed.createComponent(LearningPacksPage); fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Published Pack');
    expect(fixture.nativeElement.textContent).toContain('Ready');
  });

  it('capsule resume page does not render explanations before submission', () => {
    const sanitized = sanitizeCapsuleResume({ capsuleAttemptId:'attempt-day-01', title:'Capsule', questionCount:1, completedQuestions:0, complete:false, nextQuestion:{ attemptId:'q1', stem:'Stem', choices:[{id:'A',label:'A',text:'Choice A'}], questionNumber:1, capsuleProgress:'1/1', markedForReview:false, correctRationale:'SECRET' } as any });
    expect(JSON.stringify(sanitized)).not.toContain('SECRET');
  });

  it('submit action renders rationales/memory prompts after successful submission', () => {
    const state = { state: 'Submitting' as const, question: { attemptId:'q1', stem:'Stem', choices:[{id:'A',label:'A',text:'Choice A'}], questionNumber:1, capsuleProgress:'1/1', markedForReview:false }, startedAt: Date.now(), selectedChoiceId: 'B', markedForReview: false, submittedAtUtc: '2026-07-21T00:00:00Z' };
    expect(JSON.stringify(state)).not.toContain('Why A is correct');
    const next = showCorrectAnswer(state, { selectedChoiceId:'B', correctChoiceId:'A', correct:true, correctRationale:'Why A is correct', incorrectRationales:{ B:'Why B is incorrect' }, reference:'Ref', memory:{ highYieldFact:'Fact', pearl:'Pearl', clinicalRelevance:'Relevance', examTrap:'Trap', mnemonic:'M' } });
    expect(JSON.stringify(next)).toContain('Why A is correct');
    expect(JSON.stringify(next)).toContain('Pearl');
  });

  it('import page blocks invalid JSON before calling the API', async () => {
    const service = { importLearningPack: vi.fn() };
    await TestBed.configureTestingModule({ imports:[ImportLearningPackPage], providers:[provideNoopAnimations(), { provide: ContentImportService, useValue: service }] }).compileComponents();
    const fixture = TestBed.createComponent(ImportLearningPackPage); const c = fixture.componentInstance; c.jsonText = '{'; c.submit();
    expect(service.importLearningPack).not.toHaveBeenCalled(); expect(c.parseError()).toContain('Invalid JSON');
  });

  it('import page renders created/updated/failed counts and validation errors', async () => {
    await TestBed.configureTestingModule({ imports:[ImportLearningPackPage], providers:[provideNoopAnimations(), { provide: ContentImportService, useValue: { importLearningPack: () => of({ created:1, updated:2, skipped:0, failed:1, validationErrors:['Bad row'] }) } }] }).compileComponents();
    const fixture = TestBed.createComponent(ImportLearningPackPage); fixture.componentInstance.submit(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Created 1'); expect(fixture.nativeElement.textContent).toContain('Bad row');
  });

  it('role guards prevent scholars from seeing admin/content import navigation', () => {
    const store = new AuthStore(); store.setUser({ userId:'1', email:'s@example.com', displayName:'Scholar', permissions:['scholar:access'], emailVerified:true, mfaEnabled:false, roles:['Scholar'] });
    const importNav = APP_NAVIGATION.find((n) => n.href.includes('import-learning-pack'))!;
    expect(store.hasRole(importNav.roles ?? [])).toBe(false);
  });
});
