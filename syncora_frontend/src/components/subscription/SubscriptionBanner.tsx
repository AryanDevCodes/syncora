import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, Sparkles, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SubscriptionBanner: React.FC = () => {
  const { subscription, daysUntilExpiry, isNearExpiry, isInTrial } = useSubscription();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = React.useState(false);

  if (!subscription || dismissed) return null;

  const showBanner =
    isInTrial ||
    (isNearExpiry && !subscription.autoRenew) ||
    subscription.status === 'CANCELLED';

  if (!showBanner) return null;

  const getBannerConfig = () => {
    if (subscription.status === 'CANCELLED') {
      return {
        icon: <AlertCircle className="h-5 w-5" />,
        title: 'Subscription Cancelled',
        message: 'Your subscription has been cancelled. Reactivate to continue using premium features.',
        action: 'Reactivate',
        variant: 'destructive' as const,
        route: '/subscription',
      };
    }

    if (isInTrial) {
      return {
        icon: <Sparkles className="h-5 w-5" />,
        title: `Trial: ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} left`,
        message: 'Upgrade now to continue using all premium features after your trial ends.',
        action: 'Upgrade Now',
        variant: 'default' as const,
        route: '/subscription',
      };
    }

    if (isNearExpiry) {
      return {
        icon: <Clock className="h-5 w-5" />,
        title: `Expiring Soon: ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} left`,
        message: 'Your subscription is about to expire. Renew now to avoid service interruption.',
        action: 'Renew',
        variant: 'default' as const,
        route: '/subscription',
      };
    }

    return null;
  };

  const config = getBannerConfig();
  if (!config) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="sticky top-0 z-50"
      >
        <Alert
          className={`rounded-none border-x-0 border-t-0 ${
            config.variant === 'destructive'
              ? 'border-destructive/20 bg-destructive/10'
              : 'border-primary/20 bg-primary/10'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              {config.icon}
              <div>
                <p className="font-semibold text-sm">{config.title}</p>
                <AlertDescription className="text-xs">{config.message}</AlertDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={config.variant}
                onClick={() => navigate(config.route)}
                className="whitespace-nowrap"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                {config.action}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDismissed(true)}
                className="text-xs"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
};

export default SubscriptionBanner;
