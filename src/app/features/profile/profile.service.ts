import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';

export type PreferredStudyTime = 'EarlyMorning' | 'Morning' | 'Afternoon' | 'Evening' | 'LateNight';
export type PrimaryDevice = 'LaptopDesktop' | 'Tablet' | 'Phone';

export interface ProfileDto {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  firebaseProvider: string;
  scholarRole: string;
  activeCohort?: string | null;
  enrollmentDate?: string | null;
  timeZone: string;
  preferredStudyTime?: PreferredStudyTime | null;
  primaryDevice?: PrimaryDevice | null;
}

export interface UpdateProfileRequest {
  displayName: string;
  timeZone: string;
  preferredStudyTime: PreferredStudyTime | null;
  primaryDevice: PrimaryDevice | null;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  #api = inject(ApiService);

  getProfile(): Observable<ProfileDto> {
    return this.#api.get<ProfileDto>('/profile');
  }

  updateProfile(payload: UpdateProfileRequest): Observable<ProfileDto> {
    return this.#api.put<ProfileDto>('/profile', payload);
  }

  uploadProfileImage(file: File): Observable<ProfileDto> {
    const formData = new FormData();
    formData.append('image', file);
    return this.#api.post<ProfileDto>('/profile/image', formData);
  }
}
