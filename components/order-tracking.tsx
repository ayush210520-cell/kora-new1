'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    images: string[];
  };
}

interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paymentMethod: 'COD' | 'PREPAID';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  razorpayOrderId?: string;
  delhiveryWaybill?: string;
  trackingUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
  address: Address;
}

interface TrackingInfo {
  data?: {
    shipment_track: Array<{
      shipment_status: string;
      shipment_track_activities: Array<{
        date: string;
        status: string;
        location: string;
        activity: string;
      }>;
    }>;
  };
}

interface OrderTrackingProps {
  orderId: string;
}


const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-800';
    case 'COMPLETED': return 'bg-green-100 text-green-800';
    case 'FAILED': return 'bg-red-100 text-red-800';
    case 'REFUNDED': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function OrderTracking({ orderId }: OrderTrackingProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      setOrder(data.order);
      setTrackingInfo(data.trackingInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      toast.error('Failed to fetch order details');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTracking = async () => {
    if (!order?.delhiveryWaybill) return;
    
    setIsRefreshing(true);
    try {
      await fetchOrderDetails();
      toast.success('Tracking information refreshed!');
    } catch (err) {
      toast.error('Failed to refresh tracking');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">❌ {error || 'Order not found'}</div>
        <Button onClick={fetchOrderDetails}>Try Again</Button>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Order Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order #{order.orderNumber}
              </CardTitle>
              <CardDescription>
                Placed on {formatDate(order.createdAt)}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                {order.paymentStatus}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Delivery Address
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>{order.address.name}</div>
                <div>{order.address.address}</div>
                <div>{order.address.city}, {order.address.state} - {order.address.pincode}</div>
                {order.address.landmark && <div>Landmark: {order.address.landmark}</div>}
                <div className="flex items-center gap-2 mt-2">
                  <Phone className="h-4 w-4" />
                  {order.address.phone}
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Order Summary</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Payment Method: <span className="font-medium">{order.paymentMethod}</span></div>
                <div>Total Amount: <span className="font-medium">{formatPrice(order.totalAmount)}</span></div>
                {order.razorpayOrderId && (
                  <div>Razorpay Order: <span className="font-mono text-xs">{order.razorpayOrderId}</span></div>
                )}
                {order.delhiveryWaybill && (
                  <div>AWB Number: <span className="font-mono text-xs">{order.delhiveryWaybill}</span></div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.orderItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  {item.product.images && item.product.images.length > 0 ? (
                    <img 
                      src={item.product.images[0]} 
                      alt={item.product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{item.product.name}</h4>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatPrice(item.price)}</div>
                  <div className="text-sm text-gray-600">Total: {formatPrice(item.price * item.quantity)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tracking Information */}
      {order.delhiveryWaybill && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipment Tracking
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshTracking}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                {order.trackingUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Track on Shiprocket
                    </a>
                  </Button>
                )}
              </div>
            </div>
            <CardDescription>
              AWB: {order.delhiveryWaybill}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trackingInfo?.data?.shipment_track?.[0] ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {trackingInfo.data.shipment_track[0].shipment_status}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {trackingInfo.data.shipment_track[0].shipment_track_activities.map((activity, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        {index < trackingInfo.data.shipment_track[0].shipment_track_activities.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-200 mt-1"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="font-medium">{activity.status}</div>
                        <div className="text-sm text-gray-600">{activity.activity}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {activity.location} • {formatDate(activity.date)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Tracking information not available yet</p>
                <p className="text-sm">Please check back later or contact support</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Order Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{order.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

