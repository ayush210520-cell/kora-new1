import { useState, useCallback } from 'react';
import { getCityStateFromPincode, getCityStateFromPincodeAlternative, type PincodeData, type PincodeResponse } from '@/lib/pincode-service';

interface UsePincodeLookupReturn {
  isLoading: boolean;
  error: string | null;
  lookupPincode: (pincode: string) => Promise<PincodeData | null>;
  clearError: () => void;
}

export function usePincodeLookup(): UsePincodeLookupReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupPincode = useCallback(async (pincode: string): Promise<PincodeData | null> => {
    if (!pincode || pincode.length !== 6) {
      setError('Please enter a valid 6-digit pincode');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try primary API first
      let result: PincodeResponse = await getCityStateFromPincode(pincode);
      
      // If primary API fails, try alternative
      if (!result.success) {
        console.log('Primary API failed, trying alternative...');
        result = await getCityStateFromPincodeAlternative(pincode);
      }

      if (result.success && result.data) {
        setError(null);
        return result.data;
      } else {
        setError(result.error || 'Failed to fetch pincode details');
        return null;
      }
    } catch (err) {
      const errorMessage = 'Network error. Please check your internet connection and try again.';
      setError(errorMessage);
      console.error('Pincode lookup error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    lookupPincode,
    clearError,
  };
}
