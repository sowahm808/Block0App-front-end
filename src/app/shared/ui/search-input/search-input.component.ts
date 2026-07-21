import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
@Component({
  selector: 'b0-search-input',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `<mat-form-field class="w-full"
    ><mat-label>{{ label() }}</mat-label
    ><mat-icon matPrefix aria-hidden="true">search</mat-icon
    ><input
      matInput
      type="search"
      [ngModel]="value()"
      (ngModelChange)="valueChange.emit($event)"
      [placeholder]="placeholder()"
      autocomplete="off"
  /></mat-form-field>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent {
  label = input('Search');
  placeholder = input('Search by keyword');
  value = input('');
  valueChange = output<string>();
}
