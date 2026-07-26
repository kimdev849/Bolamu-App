export interface OnboardingRequest {
  id: string;
  entityType: 'pharmacy' | 'wholesaler' | 'delivery_company';
  entityName: string;
  email: string;
  phone: string;
  city: string;
  licenseNumber: string;
  documentUrl?: string;
  notes?: string;
  status: OnboardingStatus;
  createdAt: string;
  updatedAt: string;
  processedBy?: string;
  processedAt?: string;
  rejectionReason?: string;
}

export type OnboardingStatus = 'pending' | 'approved' | 'rejected';
