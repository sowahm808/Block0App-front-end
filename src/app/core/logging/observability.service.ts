import { Injectable, inject } from '@angular/core';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
@Injectable({ providedIn: 'root' })
export class ObservabilityService {
  #logger = inject(LoggerService);
  #ai?: ApplicationInsights;
  init() {
    if (!environment.appInsightsConnectionString) return;
    this.#ai = new ApplicationInsights({
      config: { connectionString: environment.appInsightsConnectionString, enableAutoRouteTracking: true },
    });
    this.#ai.loadAppInsights();
  }
  trackEvent(name: string, properties?: Record<string, string | number | boolean>) {
    this.#ai?.trackEvent({ name }, properties);
    this.#logger.info(name, properties);
  }
}
