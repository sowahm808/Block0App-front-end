import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { DataTemplateComponent } from './data-template.component';

@Component({
  standalone: true,
  imports: [DataTemplateComponent],
  template: '<b0-data-template [data]="payload" [ariaLabel]="label" />',
})
class HostComponent {
  payload: unknown;
  label = 'Feature content';
}

describe('DataTemplateComponent domain templates', () => {
  async function render(data: unknown, ariaLabel: string): Promise<ComponentFixture<HostComponent>> {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.payload = data;
    fixture.componentInstance.label = ariaLabel;
    fixture.detectChanges();
    return fixture;
  }

  it('renders notification payloads as a notification inbox template', async () => {
    const fixture = await render({ notifications: [{ title: 'Mentor Reply', message: 'You have feedback', read: false, channel: 'Push' }] }, 'Notification Center content');
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Notification inbox');
    expect(text).toContain('Mentor Reply');
    expect(text).toContain('Unread');
    expect(text).not.toContain('"notifications"');
  });

  it('renders certificate payloads as credential cards', async () => {
    const fixture = await render({ certificateNumber: 'B0-123', challengeName: 'Block Zero', issueDate: '2026-07-22', revoked: false }, 'Certificate Verification content');
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Certificate credentials');
    expect(text).toContain('B0-123');
    expect(text).toContain('Active');
  });

  it('renders review payloads with review queue language', async () => {
    const fixture = await render({ items: [{ title: 'Question 1', status: 'Pending', reviewer: 'Ada' }] }, 'Review Queue content');
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Review workspace');
    expect(text).toContain('Pending');
  });
});
