import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from '@/hooks/use-toast';

// Feature limits mapping
const FEATURE_LIMITS: Record<string, { feature: string; message: string }> = {
  '/api/teams/members': {
    feature: 'team members',
    message: 'You have reached your plan team member limit.',
  },
  '/api/files/upload': {
    feature: 'file storage',
    message: 'You have reached your plan storage limit.',
  },
  '/api/video/rooms': {
    feature: 'video calls',
    message: 'Video calls are not available in your current plan.',
  },
  '/api/whiteboard/create': {
    feature: 'whiteboards',
    message: 'Whiteboard collaboration is not available in your current plan.',
  },
  '/api/tasks': {
    feature: 'advanced task management',
    message: 'Advanced task management is not available in your current plan.',
  },
  '/api/analytics': {
    feature: 'analytics',
    message: 'Analytics and reporting are not available in your current plan.',
  },
};

export const setupSubscriptionInterceptor = (
  checkFeature: (feature: string) => boolean,
  getStorageUsage: () => { used: number; total: number; percentage: number }
) => {
  // Request interceptor - check limits before sending request
  axios.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const url = config.url || '';

      // Check team member limits
      if (url.includes('/api/teams/members') && config.method === 'post') {
        // This would need actual team size from context
        // For now, just check if feature is available
        if (!checkFeature('unlimited_team_members')) {
          // Let the backend handle the limit check
        }
      }

      // Check storage limits for file uploads
      if (url.includes('/api/files/upload') && config.method === 'post') {
        const storageUsage = getStorageUsage();
        if (storageUsage.percentage >= 100) {
          toast({
            title: 'Storage Limit Reached',
            description: 'You have reached your storage limit. Visit Subscription page to upgrade your plan.',
            variant: 'destructive',
          });
          return Promise.reject(new Error('Storage limit reached'));
        } else if (storageUsage.percentage >= 90) {
          toast({
            title: 'Storage Almost Full',
            description: `You have used ${storageUsage.percentage.toFixed(0)}% of your storage. Consider upgrading soon.`,
            variant: 'default',
          });
        }
      }

      // Check video call feature
      if (url.includes('/api/video/rooms') && config.method === 'post') {
        if (!checkFeature('video_conferencing')) {
          toast({
            title: 'Feature Unavailable',
            description: 'Video calls are not available in your current plan. Visit Subscription page to upgrade.',
            variant: 'destructive',
          });
          return Promise.reject(new Error('Feature not available'));
        }
      }

      // Check whiteboard feature
      if (url.includes('/api/whiteboard') && (config.method === 'post' || config.method === 'put')) {
        if (!checkFeature('whiteboard_collaboration')) {
          toast({
            title: 'Feature Unavailable',
            description: 'Whiteboard collaboration is not available in your current plan. Visit Subscription page to upgrade.',
            variant: 'destructive',
          });
          return Promise.reject(new Error('Feature not available'));
        }
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle limit errors from backend
  axios.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 403) {
        const data = error.response.data as any;
        
        // Check if it's a subscription limit error
        if (data?.error === 'SUBSCRIPTION_LIMIT_EXCEEDED' || data?.message?.includes('limit')) {
          const url = error.config?.url || '';
          const limitInfo = Object.entries(FEATURE_LIMITS).find(([key]) => 
            url.includes(key)
          )?.[1];

          toast({
            title: 'Subscription Limit Reached',
            description: (limitInfo?.message || 'You have reached a limit in your current plan.') + ' Visit Subscription page to upgrade.',
            variant: 'destructive',
          });
        } else {
          // Generic 403 error
          toast({
            title: 'Access Denied',
            description: data?.message || 'You do not have permission to perform this action.',
            variant: 'destructive',
          });
        }
      } else if (error.response?.status === 402) {
        // Payment required
        toast({
          title: 'Payment Required',
          description: 'This feature requires an active subscription. Visit Pricing page to view plans.',
          variant: 'destructive',
        });
      } else if (error.response?.status === 429) {
        // Rate limit exceeded
        const data = error.response.data as any;
        toast({
          title: 'Rate Limit Exceeded',
          description: data?.message || 'You have made too many requests. Please try again later.',
          variant: 'destructive',
        });
      }

      return Promise.reject(error);
    }
  );
};

// Note: Axios doesn't expose a way to remove all interceptors easily
// Store interceptor IDs if you need to remove them later
