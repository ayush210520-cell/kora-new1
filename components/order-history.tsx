"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { orderAPI } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, Package, Calendar, MapPin } from "lucide-react";
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
  };
  orderItems: OrderItem[];
  createdAt: string;
  updatedAt: string;
}



export default function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("newest");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await orderAPI.getAll();
        setOrders(response.orders);
        setLoading(false);
      } catch (error: any) {
        console.error('Failed to fetch orders:', error);
        setError(error.message || 'Failed to load orders');
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.address.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderItems.some(item => item.product.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "amount-high":
        return b.totalAmount - a.totalAmount;
      case "amount-low":
        return a.totalAmount - b.totalAmount;
      default:
        return 0;
    }
  });

  const totalOrders = orders.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-brand" />
          <p className="text-gray-600">Loading your order history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Error Loading Orders</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No Orders Yet</h2>
              <p className="text-gray-600 mb-6">
                You haven't placed any orders yet. Start shopping to see your order history here.
              </p>
              <Button asChild>
                <Link href="/products">Start Shopping</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-brand mb-2">Order History</h1>
        <p className="text-gray-600">Track your orders and view order history</p>
      </div>

      {/* Order Statistics */}
      <div className="mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary-brand">{totalOrders}</div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="amount-high">Amount High to Low</SelectItem>
                <SelectItem value="amount-low">Amount Low to High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-6">
        {sortedOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Order Items Preview */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Items:</h4>
                <div className="space-y-2">
                  {order.orderItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                        {item.product.images[0] && (
                          <Image
                            src={item.product.images[0].url}
                            alt={item.product.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span>Qty: {item.quantity}</span>
                          {item.size && (
                            <span>Size: {item.size}</span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm font-medium">₹{item.price.toLocaleString()}</p>
                    </div>
                  ))}
                  {order.orderItems.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{order.orderItems.length - 3} more items
                    </p>
                  )}
                </div>
              </div>

              {/* Order Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                <div>
                  <p className="text-gray-600">Total Amount:</p>
                  <p className="font-semibold text-lg text-primary-brand">₹{order.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Payment Method:</p>
                  <p className="font-medium">
                    {order.paymentMethod === 'PREPAID' ? 'Online Payment' : 'Cash on Delivery'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Items:</p>
                  <p className="font-medium">{order.orderItems.length}</p>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="mb-4 pt-4 border-t">
                <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Shipping Address:
                </h4>
                <p className="text-sm text-gray-600">
                  {order.address.name}, {order.address.address}, {order.address.city}, {order.address.state} {order.address.pincode}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button asChild size="sm">
                  <Link href={`/orders/${order.id}`}>View Details</Link>
                </Button>
                
                {order.orderStatus === 'DELIVERED' && (
                  <Button variant="outline" size="sm">
                    Write Review
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State for Search */}
      {searchTerm && sortedOrders.length === 0 && (
        <div className="text-center py-8">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No orders found</h3>
          <p className="text-gray-600 mb-4">
            No orders match your search criteria
          </p>
          <Button variant="outline" onClick={() => {
            setSearchTerm("");
            setStatusFilter("all");
          }}>
            Clear Filters
          </Button>
        </div>
      )}

      {/* Results Count */}
      <div className="text-center mt-8 text-sm text-gray-500">
        Showing {sortedOrders.length} of {orders.length} orders
      </div>
    </div>
  );
}
