import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AnalyticsService, DashboardAnalytics } from '../../../core/services/analytics.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  protected analytics = signal<DashboardAnalytics | null>(null);
  protected loading = signal(true);

  async ngOnInit(): Promise<void> {
    const data = await this.analyticsService.getDashboardAnalytics();
    this.analytics.set(data);
    this.loading.set(false);
  }
}
