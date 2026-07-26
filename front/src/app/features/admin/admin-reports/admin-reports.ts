import { Component } from '@angular/core';
import { mockOrders, mockPharmacies, mockWholesalers, mockRequests } from '../../../core/mock/db';

@Component({
  selector: 'psr-admin-reports',
  templateUrl: './admin-reports.html',
  styleUrl: './admin-reports.scss',
})
export class AdminReports {
  readonly totalRevenue = mockOrders.reduce((s, o) => s + o.totalPrice, 0);

  readonly kpis = [
    { label: 'Revenu total', value: this.totalRevenue.toLocaleString() + ' FCFA', color: 'text-slate-900', change: '+15%', up: true },
    { label: 'Commandes', value: mockOrders.length.toString(), color: 'text-indigo-600', change: '+8%', up: true },
    { label: 'Demandes', value: mockRequests.length.toString(), color: 'text-amber-600', change: '+23%', up: true },
    { label: 'Taux de complétion', value: '78%', color: 'text-emerald-600', change: '+5%', up: true },
  ];

  readonly maxRevenue = 3500000;
  readonly monthlyData = [
    { month: 'Jan', value: 1800000, highlight: false },
    { month: 'Fév', value: 2100000, highlight: false },
    { month: 'Mar', value: 2500000, highlight: false },
    { month: 'Avr', value: 2200000, highlight: false },
    { month: 'Mai', value: 2800000, highlight: false },
    { month: 'Juin', value: 3200000, highlight: false },
    { month: 'Juil', value: 3000000, highlight: false },
    { month: 'Aoû', value: 2700000, highlight: false },
    { month: 'Sep', value: 3100000, highlight: false },
    { month: 'Oct', value: 3400000, highlight: false },
    { month: 'Nov', value: 2900000, highlight: false },
    { month: 'Déc', value: this.totalRevenue, highlight: true },
  ];

  readonly activityDistribution = [
    { label: 'Commandes complétées', value: mockOrders.filter(o => o.status === 'delivered').length.toString(), percentage: 40, color: 'bg-emerald-500' },
    { label: 'En cours de traitement', value: mockOrders.filter(o => o.status === 'processing' || o.status === 'confirmed').length.toString(), percentage: 25, color: 'bg-indigo-500' },
    { label: 'Demandes en attente', value: mockRequests.filter(r => r.status === 'pending').length.toString(), percentage: 20, color: 'bg-amber-500' },
    { label: 'Annulées / Expirées', value: (mockOrders.filter(o => o.status === 'cancelled').length + mockRequests.filter(r => r.status === 'cancelled').length).toString(), percentage: 15, color: 'bg-red-500' },
  ];

  readonly recentActivity = [
    { date: '25/07/2026', type: 'Commande', badgeColor: 'bg-indigo-100 text-indigo-700', description: 'Nouvelle commande ORD-004 créée par Pharmacie du Jour' },
    { date: '24/07/2026', type: 'Pharmacie', badgeColor: 'bg-emerald-100 text-emerald-700', description: 'Pharmacie Saint Michel a renouvelé son abonnement' },
    { date: '23/07/2026', type: 'Paiement', badgeColor: 'bg-amber-100 text-amber-700', description: 'Paiement de 66 000 FCFA reçu pour ORD-001' },
    { date: '22/07/2026', type: 'Utilisateur', badgeColor: 'bg-cyan-100 text-cyan-700', description: 'Nouvelle demande d\'accès de Pharmacie Saint Joseph' },
    { date: '21/07/2026', type: 'Livraison', badgeColor: 'bg-sky-100 text-sky-700', description: 'Livraison ORD-002 assignée à Express Médical' },
  ];

  exportReport(): void {
    alert('Export PDF simulé — fonctionnalité à implémenter avec un service d\'export.');
  }
}
