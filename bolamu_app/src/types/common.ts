export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const STATUS_LABELS: Record<string, string> = {
  // Demandes
  SEARCHING: 'En recherche',
  FOUND: 'Produit trouvé',
  NOT_FOUND: 'Non trouvé',
  EXPIRED: 'Expiré',
  // Commandes
  CREATED: 'Créée',
  CONFIRMED: 'Confirmé',
  PAID: 'Payé',
  IN_PROGRESS: 'En cours',
  DELIVERED: 'Livrée',
  COMPLETED: 'Terminée',
  DISPUTED: 'Litige',
  CANCELLED: 'Annulé',
  REFUNDED: 'Remboursé',
  // Livraisons
  PENDING: 'En attente',
  ASSIGNED: 'Assignée',
  ACCEPTED: 'Acceptée',
  AT_WHOLESALER: 'Chez le grossiste',
  PICKED_UP: 'Colis récupéré',
  IN_TRANSIT: 'En route',
  AT_PHARMACY: 'À la pharmacie',
  FAILED: 'Échouée',
  RETURNED: 'Retournée',
  // Paiements
  // Divers
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
  TRIAL: 'Essai',
};
