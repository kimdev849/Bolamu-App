import { Component, inject, OnInit } from '@angular/core';
import { Api } from '../../../core/services/api';
import { STATUS_LABELS, STATUS_COLORS } from '../../../core/config/app.constants';

@Component({
  selector: 'psr-admin-reports',
  imports: [],
  templateUrl: './admin-reports.html',
  styleUrl: './admin-reports.scss',
})
export class AdminReports implements OnInit {
  private readonly api = inject(Api);
  totalRevenue = 0;

  kpis: any[] = [
    { label: 'Revenu total', value: '0 FCFA', color: 'text-slate-900', change: '-', up: true },
    { label: 'Commandes', value: '0', color: 'text-indigo-600', change: '-', up: true },
    { label: 'Demandes', value: '0', color: 'text-amber-600', change: '-', up: true },
    { label: 'Taux de complétion', value: '—', color: 'text-emerald-600', change: '-', up: true },
  ];

  readonly maxRevenue = 3500000;
  readonly monthlyData = [
    { month: 'Jan', value: 0, highlight: false }, { month: 'Fév', value: 0, highlight: false },
    { month: 'Mar', value: 0, highlight: false }, { month: 'Avr', value: 0, highlight: false },
    { month: 'Mai', value: 0, highlight: false }, { month: 'Juin', value: 0, highlight: false },
    { month: 'Juil', value: 0, highlight: false }, { month: 'Aoû', value: 0, highlight: false },
    { month: 'Sep', value: 0, highlight: false }, { month: 'Oct', value: 0, highlight: false },
    { month: 'Nov', value: 0, highlight: false }, { month: 'Déc', value: 0, highlight: true },
  ];
  readonly activityDistribution: any[] = [
    { label: 'Commandes complétées', value: '0', percentage: 0, color: 'bg-emerald-500' },
    { label: 'En cours de traitement', value: '0', percentage: 0, color: 'bg-indigo-500' },
    { label: 'Demandes en attente', value: '0', percentage: 0, color: 'bg-amber-500' },
    { label: 'Annulées / Expirées', value: '0', percentage: 0, color: 'bg-red-500' },
  ];
  readonly recentActivity: any[] = [
    { date: '—', type: '—', badgeColor: 'bg-slate-100 text-slate-500', description: 'Données en attente de synchronisation' },
  ];

  ngOnInit(): void {
    this.api.getAdminStats().subscribe({
      next: (res) => {
        const s = res.data;
        this.kpis[1] = { ...this.kpis[1], value: s.totalOrders.toString() };
        this.kpis[2] = { ...this.kpis[2], value: s.totalRequests.toString() };
      },
    });
  }

  exportReport(): void {
    alert('Export PDF — fonctionnalité à implémenter.');
  }
}
