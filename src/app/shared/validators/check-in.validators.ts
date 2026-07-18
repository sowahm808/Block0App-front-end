import { Validators } from '@angular/forms';export const confidenceValidators=[Validators.required,Validators.min(1),Validators.max(10)];export const noteValidators=[Validators.maxLength(500)];
