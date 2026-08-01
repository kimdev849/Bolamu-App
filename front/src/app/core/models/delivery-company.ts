export interface DeliveryCompany {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  isActive: boolean;
  fleetSize: number;
  coverageZones: string[];
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryAgent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Email de connexion réel du compte (peut différer si généré automatiquement) */
  loginEmail?: string;
  phone: string;
  isActive: boolean;
  vehicleType: VehicleType;
  vehiclePlate: string;
  currentLocation?: GeoLocation;
  companyId: string;
  createdAt: string;
}

export type VehicleType = 'motorcycle' | 'car' | 'van' | 'truck';

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface DeliveryCompanyStats {
  totalMissions: number;
  activeMissions: number;
  completedMissions: number;
  totalAgents: number;
  activeAgents: number;
  averageDeliveryTime: number;
}
