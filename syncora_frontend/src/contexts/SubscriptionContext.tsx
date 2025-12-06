import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentSubscription, type Subscription } from '@/api/subscriptionApi';
import { useToast } from '@/hooks/use-toast';
import { useSubscriptionWebSocket } from '@/hooks/useSubscriptionWebSocket';
import { setupSubscriptionInterceptor } from '@/utils/subscriptionInterceptor';

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  hasFeature: (featureName: string) => boolean;
  canAddTeamMember: (currentSize: number) => boolean;
  canUploadFile: (fileSize: number, currentUsed: number) => boolean;
  canStartVideoCall: () => boolean;
  getStorageUsage: () => { used: number; total: number; percentage: number };
  daysUntilExpiry: number;
  isNearExpiry: boolean;
  isInTrial: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const refreshSubscription = useCallback(async () => {
    try {
      const data = await getCurrentSubscription();
      setSubscription(data);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // WebSocket for real-time subscription updates
  const handleSubscriptionUpdate = useCallback((updatedSubscription: any) => {
    setSubscription(updatedSubscription);
  }, []);

  useSubscriptionWebSocket(handleSubscriptionUpdate);

  useEffect(() => {
    refreshSubscription();

    // Poll for subscription updates every 5 minutes as fallback
    const interval = setInterval(refreshSubscription, 5 * 60 * 1000);
    
    // Listen for manual subscription updates
    const handleManualUpdate = () => {
      refreshSubscription();
    };
    
    window.addEventListener('subscription-updated', handleManualUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('subscription-updated', handleManualUpdate);
    };
  }, [refreshSubscription]);

  const hasFeature = useCallback((featureName: string): boolean => {
    if (!subscription || !subscription.isActive) return false;

    const plan = subscription.plan;
    switch (featureName.toUpperCase()) {
      case 'AI_FEATURES':
        return plan.aiFeaturesEnabled;
      case 'ADVANCED_TASK_MANAGEMENT':
        return plan.advancedTaskManagement;
      case 'CUSTOM_INTEGRATIONS':
        return plan.customIntegrations;
      case 'ANALYTICS':
      case 'ANALYTICS_REPORTING':
        return plan.analyticsReporting;
      case 'PRIORITY_SUPPORT':
        return plan.prioritySupport;
      case 'SSO_SAML':
        return plan.ssoSaml;
      case 'PHONE_SUPPORT':
        return plan.phoneSupport;
      case 'WHITEBOARD_COLLABORATION':
        return plan.whiteboardCollaboration;
      default:
        return false;
    }
  }, [subscription]);

  const canAddTeamMember = useCallback((currentSize: number): boolean => {
    if (!subscription || !subscription.isActive) return false;
    const maxMembers = subscription.plan.maxTeamMembers;
    return maxMembers === -1 || currentSize < maxMembers;
  }, [subscription]);

  const canUploadFile = useCallback((fileSize: number, currentUsed: number): boolean => {
    if (!subscription || !subscription.isActive) return false;
    const quota = subscription.plan.storageQuotaBytes;
    return quota === -1 || (currentUsed + fileSize) <= quota;
  }, [subscription]);

  const canStartVideoCall = useCallback((): boolean => {
    if (!subscription || !subscription.isActive) return false;
    return subscription.plan.videoCallDurationMinutes !== 0;
  }, [subscription]);

  const getStorageUsage = useCallback(() => {
    if (!subscription) {
      return { used: 0, total: 0, percentage: 0 };
    }

    const total = subscription.plan.storageQuotaBytes;
    const usedMb = subscription.storageUsedMb || 0;
    const used = usedMb * 1024 * 1024; // Convert MB to bytes
    const percentage = total === -1 ? 0 : (used / total) * 100;

    return { used, total, percentage };
  }, [subscription]);

  const daysUntilExpiry = subscription?.daysRemaining || 0;
  const isNearExpiry = daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  const isInTrial = subscription?.isInTrial || false;

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        refreshSubscription,
        hasFeature,
        canAddTeamMember,
        canUploadFile,
        canStartVideoCall,
        getStorageUsage,
        daysUntilExpiry,
        isNearExpiry,
        isInTrial,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
