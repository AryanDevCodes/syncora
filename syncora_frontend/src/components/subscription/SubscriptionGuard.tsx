import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Lock, Sparkles, TrendingUp } from 'lucide-react';

interface SubscriptionGuardProps {
  feature?: string;
  requiredPlan?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  feature,
  requiredPlan,
  children,
  fallback,
}) => {
  const { subscription, hasFeature } = useSubscription();
  const navigate = useNavigate();

  // Check if user has the required feature
  if (feature && !hasFeature(feature)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Alert className="border-primary/20 bg-primary/5">
        <Lock className="h-4 w-4" />
        <AlertTitle>Premium Feature</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>This feature requires a {requiredPlan || 'higher'} subscription plan.</p>
          <Button
            onClick={() => navigate('/subscription')}
            variant="default"
            size="sm"
            className="mt-2"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Upgrade Now
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Check if subscription is active
  if (subscription && !subscription.isActive) {
    return (
      <Alert className="border-destructive/20 bg-destructive/5">
        <Lock className="h-4 w-4" />
        <AlertTitle>Subscription Inactive</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>Your subscription is not active. Please renew to continue using this feature.</p>
          <Button
            onClick={() => navigate('/subscription')}
            variant="default"
            size="sm"
            className="mt-2"
          >
            Renew Subscription
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};

interface FeatureButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  feature?: string;
  onUpgradeClick?: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export const FeatureButton: React.FC<FeatureButtonProps> = ({
  feature,
  onUpgradeClick,
  children,
  variant = 'default',
  ...props
}) => {
  const { hasFeature } = useSubscription();
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (feature && !hasFeature(feature)) {
      e.preventDefault();
      if (onUpgradeClick) {
        onUpgradeClick();
      } else {
        navigate('/subscription');
      }
      return;
    }
    props.onClick?.(e);
  };

  const isLocked = feature && !hasFeature(feature);

  return (
    <Button
      {...props}
      variant={variant}
      onClick={handleClick}
      className={`${props.className} ${isLocked ? 'opacity-70' : ''}`}
    >
      {isLocked && <Lock className="w-4 h-4 mr-2" />}
      {children}
      {isLocked && <Sparkles className="w-4 h-4 ml-2" />}
    </Button>
  );
};

export default SubscriptionGuard;
