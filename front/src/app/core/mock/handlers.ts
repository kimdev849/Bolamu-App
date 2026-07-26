import { HttpRequest } from '@angular/common/http';
import { mockPharmacies, mockWholesalers, mockDeliveryCompanies, mockAgents, mockRequests, mockOrders, mockCommissions, mockUsers, mockOnboardingRequests } from './db';

interface MockResponse {
  status: number;
  body: unknown;
}

function jsonResponse(status: number, body: unknown): MockResponse {
  return { status, body };
}

function ok<T>(data: T): MockResponse {
  return jsonResponse(200, { success: true, data });
}

function created<T>(data: T): MockResponse {
  return jsonResponse(201, { success: true, data });
}

function notFound(message = 'Ressource non trouvée'): MockResponse {
  return jsonResponse(404, { success: false, message });
}

function badRequest(message: string): MockResponse {
  return jsonResponse(400, { success: false, message });
}

export function handleRequest(req: HttpRequest<unknown>): MockResponse | null {
  const { method, urlWithParams } = req;
  const url = new URL(urlWithParams, window.location.origin);
  const path = url.pathname.replace(/^\/api/, '') || '/';
  const params = Object.fromEntries(url.searchParams.entries());
  const body = req.body as Record<string, unknown> | null;

  // Onboarding
  if (path === '/onboarding/request' && method === 'POST') {
    return created({
      id: 'ONB-' + Date.now().toString(36).toUpperCase(),
      ...(body ?? {}),
      status: 'pending',
      createdAt: new Date().toISOString(),
      message: 'Votre demande a été soumise. L\'équipe de Bolamu vous contactera sous 48h ouvrés.',
    });
  }

  if (path === '/onboarding/requests' && method === 'GET') {
    return ok(mockOnboardingRequests);
  }

  const onboardingMatch = path.match(/^\/onboarding\/requests\/(.+)\/approve$/);
  if (onboardingMatch && method === 'POST') {
    return ok({ id: onboardingMatch[1], status: 'approved', processedAt: new Date().toISOString() });
  }

  const onboardingRejectMatch = path.match(/^\/onboarding\/requests\/(.+)\/reject$/);
  if (onboardingRejectMatch && method === 'POST') {
    return ok({ id: onboardingRejectMatch[1], status: 'rejected', processedAt: new Date().toISOString() });
  }

  // Auth routes
  if (path === '/auth/login' && method === 'POST') {
    if (!body || !body['email']) return badRequest('Email requis');
    const user = mockUsers.find(u => u.email === String(body['email']));
    if (!user) return badRequest('Email ou mot de passe incorrect');
    return ok({
      user,
      tokens: { accessToken: 'mock-token-' + user.id, refreshToken: 'mock-refresh-' + user.id },
    });
  }

  if (path === '/auth/register' && method === 'POST') {
    return created({ message: 'Inscription réussie' });
  }

  // Admin - Dashboard stats
  if (path === '/admin/stats' && method === 'GET') {
    return ok({
      totalPharmacies: mockPharmacies.length,
      activePharmacies: mockPharmacies.filter(p => p.isActive).length,
      totalWholesalers: mockWholesalers.length,
      totalDeliveryCompanies: mockDeliveryCompanies.length,
      totalOrders: mockOrders.length,
      pendingOrders: mockOrders.filter(o => o.status === 'pending').length,
      totalCommissions: mockCommissions.reduce((sum, c) => sum + c.amount, 0),
      pendingCommissions: mockCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0),
      totalRequests: mockRequests.length,
      pendingRequests: mockRequests.filter(r => r.status === 'pending').length,
      monthlyRevenue: 2500000,
    });
  }

  // Pharmacies
  if (path === '/pharmacies' && method === 'GET') {
    return ok(mockPharmacies);
  }

  const pharmacyMatch = path.match(/^\/pharmacies\/(.+)$/);
  if (pharmacyMatch && method === 'GET') {
    const pharmacy = mockPharmacies.find(p => p.id === pharmacyMatch[1]);
    return pharmacy ? ok(pharmacy) : notFound();
  }

  if (pharmacyMatch && method === 'PUT') {
    return ok({ ...mockPharmacies[0], ...(body ?? {}) });
  }

  // Wholesalers
  if (path === '/wholesalers' && method === 'GET') {
    return ok(mockWholesalers);
  }

  const wholesalerMatch = path.match(/^\/wholesalers\/(.+)$/);
  if (wholesalerMatch && method === 'GET') {
    const wholesaler = mockWholesalers.find(w => w.id === wholesalerMatch[1]);
    return wholesaler ? ok(wholesaler) : notFound();
  }

  // Delivery Companies
  if (path === '/delivery-companies' && method === 'GET') {
    return ok(mockDeliveryCompanies);
  }

  const deliveryMatch = path.match(/^\/delivery-companies\/(.+)$/);
  if (deliveryMatch && method === 'GET') {
    const company = mockDeliveryCompanies.find(d => d.id === deliveryMatch[1]);
    return company ? ok(company) : notFound();
  }

  // Agents
  if (path === '/agents' && method === 'GET') {
    const companyId = params['companyId'];
    const agents = companyId ? mockAgents.filter(a => a.companyId === companyId) : mockAgents;
    return ok(agents);
  }

  // Requests
  if (path === '/requests' && method === 'GET') {
    const pharmacyId = params['pharmacyId'];
    let requests = [...mockRequests];
    if (pharmacyId) requests = requests.filter(r => r.pharmacyId === pharmacyId);
    return ok(requests);
  }

  if (path === '/requests' && method === 'POST') {
    return created({ id: 'RQ-NEW', ...(body ?? {}), status: 'pending', createdAt: new Date().toISOString() });
  }

  const requestMatch = path.match(/^\/requests\/(.+)$/);
  if (requestMatch && method === 'GET') {
    const request = mockRequests.find(r => r.id === requestMatch[1]);
    return request ? ok(request) : notFound();
  }

  // Orders
  if (path === '/orders' && method === 'GET') {
    const pharmacyId = params['pharmacyId'];
    const wholesalerId = params['wholesalerId'];
    let orders = [...mockOrders];
    if (pharmacyId) orders = orders.filter(o => o.pharmacyId === pharmacyId);
    if (wholesalerId) orders = orders.filter(o => o.wholesalerId === wholesalerId);
    return ok(orders);
  }

  if (path === '/orders' && method === 'POST') {
    return created({ id: 'ORD-NEW', ...(body ?? {}), status: 'pending', createdAt: new Date().toISOString() });
  }

  // Commissions
  if (path === '/commissions' && method === 'GET') {
    return ok(mockCommissions);
  }

  if (path === '/commissions' && method === 'POST') {
    return created({ id: 'COM-NEW', ...(body ?? {}), status: 'pending', createdAt: new Date().toISOString() });
  }

  // Dashboard stats per role
  if (path === '/pharmacy/stats' && method === 'GET') {
    return ok({
      totalRequests: mockRequests.filter(r => r.pharmacyId === 'PH-001').length,
      pendingRequests: mockRequests.filter(r => r.pharmacyId === 'PH-001' && r.status === 'pending').length,
      totalOrders: mockOrders.filter(o => o.pharmacyId === 'PH-001').length,
      activeOrders: mockOrders.filter(o => o.pharmacyId === 'PH-001' && o.status !== 'delivered' && o.status !== 'cancelled').length,
      totalSpent: mockOrders.filter(o => o.pharmacyId === 'PH-001').reduce((sum, o) => sum + o.totalPrice, 0),
      monthlySpent: 125000,
      subscriptionStatus: 'active',
      subscriptionEndDate: '2025-01-15T00:00:00.000Z',
    });
  }

  if (path === '/wholesaler/stats' && method === 'GET') {
    return ok({
      totalOrders: mockOrders.filter(o => o.wholesalerId === 'WH-001').length,
      pendingOrders: mockOrders.filter(o => o.wholesalerId === 'WH-001' && o.status === 'pending').length,
      totalRevenue: mockOrders.filter(o => o.wholesalerId === 'WH-001').reduce((sum, o) => sum + o.totalPrice, 0),
      monthlyRevenue: 125000,
      matchedRequests: mockRequests.filter(r => r.responses?.some(rs => rs.wholesalerId === 'WH-001')).length,
      totalCommissions: mockCommissions.filter(c => c.wholesalerId === 'WH-001').reduce((sum, c) => sum + c.amount, 0),
    });
  }

  if (path === '/delivery/stats' && method === 'GET') {
    return ok({
      totalMissions: 25,
      activeMissions: 3,
      completedMissions: 20,
      totalAgents: mockAgents.filter(a => a.companyId === 'DC-001').length,
      activeAgents: mockAgents.filter(a => a.companyId === 'DC-001' && a.isActive).length,
      averageDeliveryTime: 45,
      onTimeRate: 92,
    });
  }

  // User profile
  if (path === '/auth/me' && method === 'GET') {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return badRequest('Non authentifié');
    const userId = token.replace('mock-token-', '');
    const user = mockUsers.find(u => u.id === userId);
    return user ? ok(user) : badRequest('Utilisateur non trouvé');
  }

  // Not found in mock API
  return null;
}
