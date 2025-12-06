import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionMessage {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  status: string;
  startDate: string;
  endDate: string;
  billingCycle: string;
  autoRenew: boolean;
}

export const useSubscriptionWebSocket = (
  onSubscriptionUpdate?: (subscription: SubscriptionMessage) => void
) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const clientRef = useRef<Client | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (!user?.id) return;

    try {
      const client = new Client({
        webSocketFactory: () => new SockJS(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/ws/subscription`),
        
        onConnect: () => {
          console.log('WebSocket connected for subscription updates');
          
          // Subscribe to user-specific subscription updates
          client.subscribe(`/queue/subscription/${user.id}`, (message) => {
            try {
              const subscription: SubscriptionMessage = JSON.parse(message.body);
              
              // Notify user about subscription changes
              if (subscription.status === 'ACTIVE') {
                toast({
                  title: 'Subscription Updated',
                  description: `Your ${subscription.planName} plan is now active.`,
                });
              } else if (subscription.status === 'CANCELLED') {
                toast({
                  title: 'Subscription Cancelled',
                  description: 'Your subscription has been cancelled.',
                  variant: 'destructive',
                });
              } else if (subscription.status === 'EXPIRED') {
                toast({
                  title: 'Subscription Expired',
                  description: 'Your subscription has expired. Please renew to continue using premium features.',
                  variant: 'destructive',
                });
              }
              
              // Call callback with updated subscription
              onSubscriptionUpdate?.(subscription);
            } catch (error) {
              console.error('Error processing subscription update:', error);
            }
          });

          // Subscribe to global subscription events
          client.subscribe('/topic/subscription/events', (message) => {
            try {
              const event = JSON.parse(message.body);
              console.log('Subscription event:', event);
              
              // Handle global events (e.g., maintenance notifications)
              if (event.eventType === 'MAINTENANCE') {
                toast({
                  title: 'Maintenance Scheduled',
                  description: event.data.message,
                });
              }
            } catch (error) {
              console.error('Error processing subscription event:', error);
            }
          });
        },
        
        onStompError: (frame) => {
          console.error('STOMP error:', frame);
          
          // Attempt reconnection
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...');
            connect();
          }, 5000);
        },
        
        onDisconnect: () => {
          console.log('WebSocket disconnected');
        },
      });

      client.activate();
      clientRef.current = client;
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  }, [user?.id, onSubscriptionUpdate, toast]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user?.id, connect, disconnect]);

  return {
    isConnected: clientRef.current?.connected ?? false,
    reconnect: connect,
    disconnect,
  };
};
