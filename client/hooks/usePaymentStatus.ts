import { useState, useEffect, useRef } from 'react';
import { getPaymentByOrder } from '@/services/payments';

export function usePaymentStatus(orderId: string, enabled: boolean = true) {
  const [paymentStatus, setPaymentStatus] = useState<string>('Pending');
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !orderId) return;

    const checkStatus = async () => {
      setLoading(true);
      try {
        const response = await getPaymentByOrder(orderId);
        if (response) {
          setPaymentStatus(response.status);
          
          // Stop polling if paid or failed
          if (response.status === 'Paid' || response.status === 'Failed') {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      } finally {
        setLoading(false);
      }
    };

    // Check immediately
    checkStatus();
    
    // Poll every 5 seconds
    intervalRef.current = setInterval(checkStatus, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [orderId, enabled]);

  return { paymentStatus, loading };
}
