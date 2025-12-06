import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { HardDrive, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const StorageQuotaIndicator: React.FC = () => {
  const { subscription, getStorageUsage } = useSubscription();
  const navigate = useNavigate();
  const { used, total, percentage } = getStorageUsage();

  if (!subscription) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    if (bytes === -1) return 'Unlimited';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const isNearLimit = percentage > 80;
  const isUnlimited = total === -1;

  return (
    <Card className="border-border/40">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <HardDrive className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Storage Usage</p>
            <p className="text-xs text-muted-foreground">
              {isUnlimited ? 'Unlimited storage' : `${formatBytes(used)} of ${formatBytes(total)}`}
            </p>
          </div>
        </div>

        {!isUnlimited && (
          <>
            <Progress
              value={percentage}
              className={`h-2 mb-2`}
            />
            <div className="flex items-center justify-between text-xs">
              <span className={isNearLimit ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                {percentage.toFixed(1)}% used
              </span>
              {isNearLimit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate('/subscription')}
                  className="h-6 text-xs"
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Upgrade
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StorageQuotaIndicator;
