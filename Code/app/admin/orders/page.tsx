"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Package, Truck, CheckCircle, XCircle, Clock, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { config } from '@/lib/config'

interface Order {
  id: string
  orderNumber: string
  totalAmount: number | { toNumber: () => number }
  paymentMethod: 'COD' | 'PREPAID'
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  orderStatus: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  shiprocketStatus?: string
  delhiveryWaybill?: string
  trackingUrl?: string
  createdAt: string
  user: {
    name: string
    email: string
    phone: string
  }
  address: {
    name: string
    address: string
    city: string
    state: string
    pincode: string
  }
  orderItems: Array<{
    id: string
    quantity: number
    price: number | { toNumber: () => number }
    size?: string
    product: {
      name: string
      images: Array<string | { url: string }>
    }
  }>
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

// Cache for orders data
const ordersCache = new Map<string, { orders: Order[], pagination: PaginationInfo, timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // Memoized cache key
  const cacheKey = useMemo(() => {
    return `${pagination.page}-${pagination.limit}-${searchTerm}-${statusFilter}-${paymentFilter}-${dateFilter}`
  }, [pagination.page, pagination.limit, searchTerm, statusFilter, paymentFilter, dateFilter])

  // Check if data is cached and fresh
  const getCachedData = useCallback((key: string) => {
    const cached = ordersCache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached
    }
    return null
  }, [])

  // Set cached data
  const setCachedData = useCallback((key: string, data: { orders: Order[], pagination: PaginationInfo }) => {
    ordersCache.set(key, { ...data, timestamp: Date.now() })
  }, [])

  // Clear cache when needed
  const clearCache = useCallback(() => {
    ordersCache.clear()
  }, [])

  // Fetch orders with caching
  const fetchOrders = useCallback(async (forceRefresh = false) => {
    try {
      // For admin panel, always fetch fresh data (no cache check)
      // This ensures instant updates after status changes

      const token = localStorage.getItem('token')
      if (!token) return

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })
      
      if (searchTerm) queryParams.append('search', searchTerm)
      if (statusFilter !== 'all') queryParams.append('status', statusFilter)
      if (paymentFilter !== 'all') queryParams.append('payment', paymentFilter)
      if (dateFilter !== 'all') queryParams.append('date', dateFilter)

      const response = await fetch(`${config.apiUrl}/api/orders/admin/all?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📦 Orders data received:', data)
        setOrders(data.orders || [])
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || data.orders?.length || 0,
          pages: data.pagination?.pages || Math.ceil((data.orders?.length || 0) / pagination.limit)
        }))
        
        // Note: Cache disabled for admin panel to ensure instant updates
      } else {
        console.error('❌ Failed to fetch orders:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setIsLoading(false)
    }
  }, [cacheKey, pagination.page, pagination.limit, searchTerm, statusFilter, paymentFilter, dateFilter, getCachedData, setCachedData])

  // Load orders on mount
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '' || statusFilter !== 'all' || paymentFilter !== 'all' || dateFilter !== 'all') {
        setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
        fetchOrders(true) // Force refresh for search/filter
      }
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchTerm, statusFilter, paymentFilter, dateFilter, fetchOrders])

  // Pagination handlers
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.pages) {
      setPagination(prev => ({ ...prev, page }))
    }
  }, [pagination.pages])

  const nextPage = useCallback(() => {
    if (pagination.page < pagination.pages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }))
    }
  }, [pagination.page, pagination.pages])

  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      setPagination(prev => ({ ...prev, page: prev.page - 1 }))
    }
  }, [pagination.page])

  // Memoized filtered orders for summary cards
  const filteredOrders = useMemo(() => {
    let filtered = orders

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.orderStatus === statusFilter)
    }

    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => order.paymentStatus === paymentFilter)
    }

    if (dateFilter !== 'all') {
      const now = new Date()
      const orderDate = new Date()
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(order => {
            orderDate.setTime(new Date(order.createdAt).getTime())
            return orderDate.toDateString() === now.toDateString()
          })
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(order => new Date(order.createdAt) >= weekAgo)
          break
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          filtered = filtered.filter(order => new Date(order.createdAt) >= monthAgo)
          break
      }
    }

    return filtered
  }, [orders, searchTerm, statusFilter, paymentFilter, dateFilter])

  // Helper function to safely convert Decimal or number to number
  const safeToNumber = useCallback((value: number | { toNumber: () => number }): number => {
    if (typeof value === 'object' && value !== null && 'toNumber' in value) {
      return value.toNumber()
    }
    return Number(value)
  }, [])

  // Memoized summary statistics
  const summaryStats = useMemo(() => {
    const total = filteredOrders.length
    const pending = filteredOrders.filter(o => o.orderStatus === 'PENDING').length
    const delivered = filteredOrders.filter(o => o.orderStatus === 'DELIVERED').length
    const shipped = filteredOrders.filter(o => o.orderStatus === 'SHIPPED').length
    const totalRevenue = filteredOrders
      .filter(o => o.paymentStatus === 'COMPLETED')
      .reduce((sum, o) => sum + safeToNumber(o.totalAmount), 0)

    return { total, pending, delivered, shipped, totalRevenue }
  }, [filteredOrders, safeToNumber])

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />
      case 'CONFIRMED': return <CheckCircle className="h-4 w-4" />
      case 'SHIPPED': return <Truck className="h-4 w-4" />
      case 'DELIVERED': return <CheckCircle className="h-4 w-4" />
      case 'CANCELLED': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }, [])

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800'
      case 'SHIPPED': return 'bg-purple-100 text-purple-800'
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }, [])

  const getPaymentStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      case 'REFUNDED': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }, [])

  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setStatusFilter('all')
    setPaymentFilter('all')
    setDateFilter('all')
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
        <p className="text-gray-600 mt-1">View and manage all customer orders</p>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Order Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="SHIPPED">Shipped</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={clearFilters}
              className="w-full"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.delivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Truck className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Shipped</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.shipped}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{summaryStats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>All Orders ({summaryStats.total} total)</CardTitle>
          <p className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, summaryStats.total)} of {summaryStats.total} orders
            {searchTerm && ` matching "${searchTerm}"`}
            {statusFilter !== 'all' && ` with status "${statusFilter}"`}
            {paymentFilter !== 'all' && ` with payment "${paymentFilter}"`}
            {dateFilter !== 'all' && ` from "${dateFilter}"`}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.slice((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit).map((order) => (
              <div key={order.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          Order #{order.orderNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          ₹{safeToNumber(order.totalAmount).toFixed(2)}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {order.paymentMethod}
                        </Badge>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Customer</p>
                        <p className="text-sm text-gray-900">{order.user.name}</p>
                        <p className="text-sm text-gray-600">{order.user.email}</p>
                        <p className="text-sm text-gray-600">{order.user.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Shipping Address</p>
                        <p className="text-sm text-gray-900">{order.address.name}</p>
                        <p className="text-sm text-gray-600">{order.address.address}</p>
                        <p className="text-sm text-gray-600">
                          {order.address.city}, {order.address.state} - {order.address.pincode}
                        </p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Items ({order.orderItems.length})</p>
                      <div className="space-y-2">
                        {order.orderItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 text-sm">
                            {item.product.images && item.product.images[0] && (
                              <img 
                                src={typeof item.product.images[0] === 'string' ? item.product.images[0] : item.product.images[0].url} 
                                alt={item.product.name}
                                className="w-8 h-8 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <span className="font-medium">{item.product.name}</span>
                              {item.size && (
                                <span className="text-xs text-gray-500 ml-2">Size: {item.size}</span>
                              )}
                            </div>
                            <span className="text-gray-600">x{item.quantity}</span>
                            <span className="text-gray-900">₹{safeToNumber(item.price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status and Tracking */}
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className={getStatusColor(order.orderStatus)}>
                        {getStatusIcon(order.orderStatus)}
                        <span className="ml-1">{order.orderStatus}</span>
                      </Badge>
                      
                      <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                        {order.paymentStatus}
                      </Badge>

                      {order.delhiveryWaybill && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          <Package className="h-3 w-3 mr-1" />
                          {order.delhiveryWaybill}
                        </Badge>
                      )}

                      {order.shiprocketStatus && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          <Truck className="h-3 w-3 mr-1" />
                          {order.shiprocketStatus}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 lg:flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      className="w-full lg:w-auto"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    
                    {order.trackingUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(order.trackingUrl, '_blank')}
                        className="w-full lg:w-auto"
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Track Order
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' || dateFilter !== 'all' 
                    ? 'Try adjusting your search or filters.' 
                    : 'Orders will appear here once customers start placing them.'}
                </p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={pagination.page === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum
                    if (pagination.pages <= 5) {
                      pageNum = i + 1
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i
                    } else {
                      pageNum = pagination.page - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                {/* Next Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={pagination.page === pagination.page}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Order Details - #{selectedOrder.orderNumber}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrder(null)}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Order Date</p>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Total Amount</p>
                    <p className="text-sm font-bold text-gray-900">₹{safeToNumber(selectedOrder.totalAmount).toFixed(2)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Order Items</p>
                  <div className="space-y-2">
                    {selectedOrder.orderItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          {item.product.images && item.product.images[0] && (
                            <img 
                              src={typeof item.product.images[0] === 'string' ? item.product.images[0] : item.product.images[0].url} 
                              alt={item.product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium">{item.product.name}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>Qty: {item.quantity}</span>
                              {item.size && (
                                <span>Size: {item.size}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="font-medium">₹{safeToNumber(item.price).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Customer Information</p>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">{selectedOrder.user.name}</p>
                      <p className="text-sm text-gray-600">{selectedOrder.user.email}</p>
                      <p className="text-sm text-gray-600">{selectedOrder.user.phone}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Shipping Address</p>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">{selectedOrder.address.name}</p>
                      <p className="text-sm text-gray-600">{selectedOrder.address.address}</p>
                      <p className="text-sm text-gray-600">
                        {selectedOrder.address.city}, {selectedOrder.address.state}
                      </p>
                      <p className="text-sm text-gray-600">PIN: {selectedOrder.address.pincode}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  {selectedOrder.trackingUrl && (
                    <Button
                      onClick={() => window.open(selectedOrder.trackingUrl, '_blank')}
                      className="flex-1"
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Track Order
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
