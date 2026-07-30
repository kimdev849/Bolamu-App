import { Router } from 'express';
import authRoutes from './auth';
import adminRoutes from './admin';
import pharmacyRoutes from './pharmacies';
import wholesalerRoutes from './wholesalers';
import deliveryCompanyRoutes from './delivery-companies';
import requestRoutes from './requests';
import orderRoutes from './orders';
import onboardingRoutes from './onboarding';
import notificationRoutes from './notifications';
import subscriptionRoutes from './subscriptions';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/pharmacies', pharmacyRoutes);
router.use('/wholesalers', wholesalerRoutes);
router.use('/delivery-companies', deliveryCompanyRoutes);
router.use('/requests', requestRoutes);
router.use('/orders', orderRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/subscriptions', subscriptionRoutes);

export default router;
