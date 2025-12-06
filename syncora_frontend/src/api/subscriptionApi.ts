import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/subscriptions`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface PricingPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  formattedMonthlyPrice: string;
  formattedAnnualPrice: string;
  maxTeamMembers: number;
  maxTeamMembersDisplay: string;
  storageQuotaBytes: number;
  storageQuotaDisplay: string;
  videoCallDurationMinutes: number;
  videoCallDurationDisplay: string;
  features: string[];
  isPopular: boolean;
  displayOrder: number;
  unlimitedMessages: boolean;
  advancedTaskManagement: boolean;
  aiFeaturesEnabled: boolean;
  customIntegrations: boolean;
  analyticsReporting: boolean;
  prioritySupport: boolean;
  ssoSaml: boolean;
  dedicatedAccountManager: boolean;
  customSla: boolean;
  onPremiseDeployment: boolean;
  phoneSupport: boolean;
  whiteboardCollaboration: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: PricingPlan;
  status: string;
  billingCycle: string;
  startDate: string;
  endDate: string;
  trialEndDate?: string;
  autoRenew: boolean;
  isActive: boolean;
  isInTrial: boolean;
  daysRemaining: number;
  storageUsedMb?: number;
}

export interface CreateSubscriptionRequest {
  planId: string;
  billingCycle: 'MONTHLY' | 'ANNUAL';
  startTrial?: boolean;
  paymentMethodId?: string;
}

export interface UpgradeSubscriptionRequest {
  newPlanId: string;
  billingCycle: 'MONTHLY' | 'ANNUAL';
  immediate?: boolean;
}

export interface PaymentHistory {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  description: string;
  paidAt: string;
  createdAt: string;
}

// Get all pricing plans
export const getAllPlans = async (): Promise<PricingPlan[]> => {
  const response = await api.get('/plans');
  return response.data;
};

// Get plan by ID
export const getPlanById = async (planId: string): Promise<PricingPlan> => {
  const response = await api.get(`/plans/${planId}`);
  return response.data;
};

// Get plan by name
export const getPlanByName = async (name: string): Promise<PricingPlan> => {
  const response = await api.get(`/plans/name/${name}`);
  return response.data;
};

// Get current user's subscription
export const getCurrentSubscription = async (): Promise<Subscription | null> => {
  try {
    const response = await api.get('/current');
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 204) {
      return null; // No subscription
    }
    throw error;
  }
};

// Create new subscription
export const createSubscription = async (
  request: CreateSubscriptionRequest
): Promise<Subscription> => {
  const response = await api.post('/', request);
  return response.data;
};

// Upgrade subscription
export const upgradeSubscription = async (
  request: UpgradeSubscriptionRequest
): Promise<Subscription> => {
  const response = await api.put('/upgrade', request);
  return response.data;
};

// Cancel subscription
export const cancelSubscription = async (reason?: string): Promise<Subscription> => {
  const response = await api.post('/cancel', { reason });
  return response.data;
};

// Reactivate subscription
export const reactivateSubscription = async (): Promise<Subscription> => {
  const response = await api.post('/reactivate');
  return response.data;
};

// Get subscription history
export const getSubscriptionHistory = async (): Promise<Subscription[]> => {
  const response = await api.get('/history');
  return response.data;
};

// Get payment history
export const getPaymentHistory = async (): Promise<PaymentHistory[]> => {
  const response = await api.get('/payments');
  return response.data;
};

// Check feature access
export const checkFeatureAccess = async (featureName: string): Promise<boolean> => {
  const response = await api.get(`/features/${featureName}`);
  return response.data.hasAccess;
};

// Check if can add team member
export const canAddTeamMember = async (currentTeamSize: number): Promise<boolean> => {
  const response = await api.get('/can-add-member', {
    params: { currentTeamSize },
  });
  return response.data.canAdd;
};

// Check if can upload file
export const canUploadFile = async (
  fileSize: number,
  currentStorageUsed: number
): Promise<boolean> => {
  const response = await api.get('/can-upload', {
    params: { fileSize, currentStorageUsed },
  });
  return response.data.canUpload;
};

// Check if can start video call
export const canStartVideoCall = async (): Promise<boolean> => {
  const response = await api.get('/can-video-call');
  return response.data.canStart;
};

export default {
  getAllPlans,
  getPlanById,
  getPlanByName,
  getCurrentSubscription,
  createSubscription,
  upgradeSubscription,
  cancelSubscription,
  reactivateSubscription,
  getSubscriptionHistory,
  getPaymentHistory,
  checkFeatureAccess,
  canAddTeamMember,
  canUploadFile,
  canStartVideoCall,
};
