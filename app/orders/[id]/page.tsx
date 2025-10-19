"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { orderAPI } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle, MapPin, Phone, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  size?: string;
  product: {
    id: string;
    name: string;
    images: Array<{ url: string; public_id: string }>;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paymentMethod: 'COD' | 'PREPAID';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  address: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  orderItems: OrderItem[];
  notes?: string;
  razorpayOrderId?: string;
  qrPaymentLink?: string;
  delhiveryWaybill?: string;
  trackingUrl?: string;
  createdAt: string;
  updatedAt: string;
}


export default function OrderConfirmationPage() {
  const params = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderId = params.id as string;
        const response = await orderAPI.getById(orderId);
        setOrder(response.order);
      } catch (error: any) {
        console.error('Failed to fetch order:', error);
        setError(error.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-brand" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
              <Link href="/orders">
                <Button>View All Orders</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Success Header */}
      <div className="text-center mb-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-primary-brand mb-2">Order Confirmed!</h1>
        <p className="text-gray-600">Thank you for your purchase. Your order has been successfully placed.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Date */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Order placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>
                {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''} in your order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                      {item.product.images[0] && (
                        <Image
                          src={item.product.images[0].url}
                          alt={item.product.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Quantity: {item.quantity}</span>
                        {item.size && (
                          <span>Size: {item.size}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{item.price.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Total: ₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Order Summary & Shipping */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-mono text-sm">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>₹{order.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="text-green-600">Free</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold text-primary-brand">
                  <span>Total:</span>
                  <span>₹{order.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{order.address.name}</p>
                <p className="text-sm text-gray-600">{order.address.address}</p>
                <p className="text-sm text-gray-600">
                  {order.address.city}, {order.address.state} {order.address.pincode}
                </p>
                {order.address.landmark && (
                  <p className="text-sm text-gray-600">Near: {order.address.landmark}</p>
                )}
                <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  {order.address.phone}
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Actions */}
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/products">Continue Shopping</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/orders">View All Orders</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
