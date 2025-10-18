'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Truck, Clock, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface ServiceabilityData {
  data: {
    available_courier_companies: Array<{
      courier_company_id: number;
      courier_name: string;
      rate: number;
      estimated_delivery_days: string;
      cod: boolean;
    }>;
    available_courier_companies_count: number;
    pickup_pincode: string;
    delivery_pincode: string;
  };
}

export default function ShippingServiceability() {
  const [pincode, setPincode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serviceabilityData, setServiceabilityData] = useState<ServiceabilityData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkServiceability = async () => {
    if (!pincode || pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    setIsLoading(true);
    setError(null);
    setServiceabilityData(null);

    try {
      const response = await fetch(`/api/orders/shipping/serviceability/${pincode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check serviceability');
      }

      const data = await response.json();
      setServiceabilityData(data.serviceability);
      toast.success('Serviceability checked successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      toast.error('Failed to check serviceability');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Serviceability Check
          </CardTitle>
          <CardDescription>
            Check if we can deliver to your pincode and view available courier options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter 6-digit pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="flex-1"
            />
            <Button 
              onClick={checkServiceability} 
              disabled={isLoading || pincode.length !== 6}
            >
              {isLoading ? 'Checking...' : 'Check'}
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <XCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {serviceabilityData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>
                  From: {serviceabilityData.data.pickup_pincode} → To: {serviceabilityData.data.delivery_pincode}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-600">
                  Delivery Available! {serviceabilityData.data.available_courier_companies_count} courier(s) found
                </span>
              </div>

              <div className="grid gap-3">
                {serviceabilityData.data.available_courier_companies.map((courier, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="font-semibold">{courier.courier_name}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {courier.estimated_delivery_days}
                            </span>
                            <Badge variant={courier.cod ? "default" : "secondary"}>
                              {courier.cod ? 'COD Available' : 'Prepaid Only'}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            {formatPrice(courier.rate)}
                          </div>
                          <div className="text-xs text-gray-500">Shipping cost</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

