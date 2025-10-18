"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, Users, UserPlus, Mail, Phone, MapPin, Calendar, Search, XCircle } from "lucide-react"
import { config } from '@/lib/config'

interface User {
  id: string
  name: string
  email: string
  phone: string
  isActive: boolean
  createdAt: string
  addresses: Array<{
    id: string
    address: string
    city: string
    state: string
    pincode: string
  }>
  orders: Array<{
    id: string
    orderNumber: string
    totalAmount: number
    orderStatus: string
    createdAt: string
  }>
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm)
      )
      setFilteredUsers(filtered)
    }
  }, [searchTerm, users])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`${config.apiUrl}/api/auth/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('👥 Users data received:', data)
        setUsers(data.users || [])
        setFilteredUsers(data.users || [])
      } else {
        console.error('❌ Failed to fetch users:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTotalSpent = (orders: User['orders']) => {
    return orders.reduce((total, order) => total + order.totalAmount, 0)
  }

  const getOrderCount = (orders: User['orders']) => {
    return orders.length
  }

  const getActiveOrders = (orders: User['orders']) => {
    return orders.filter(order => 
      ['PENDING', 'CONFIRMED', 'SHIPPED'].includes(order.orderStatus)
    ).length
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
        <p className="text-gray-600 mt-1">View and manage all registered users</p>
      </div>

      {/* Users Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserPlus className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Mail className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.reduce((total, user) => total + user.orders.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">New This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(user => {
                    const userDate = new Date(user.createdAt)
                    const now = new Date()
                    return userDate.getMonth() === now.getMonth() && 
                           userDate.getFullYear() === now.getFullYear()
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline" className="bg-gray-50">
              {filteredUsers.length} users found
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{user.name}</h3>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="h-4 w-4" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone className="h-4 w-4" />
                            {user.phone}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          Joined {new Date(user.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* User Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm font-medium text-gray-700">Total Orders</p>
                        <p className="text-lg font-bold text-gray-900">{getOrderCount(user.orders)}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm font-medium text-gray-700">Total Spent</p>
                        <p className="text-lg font-bold text-gray-900">₹{(typeof getTotalSpent(user.orders) === 'object' && getTotalSpent(user.orders).toNumber ? getTotalSpent(user.orders).toNumber() : Number(getTotalSpent(user.orders))).toFixed(2)}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm font-medium text-gray-700">Active Orders</p>
                        <p className="text-lg font-bold text-gray-900">{getActiveOrders(user.orders)}</p>
                      </div>
                    </div>

                    {/* Addresses */}
                    {user.addresses.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Addresses ({user.addresses.length})</p>
                        <div className="space-y-2">
                          {user.addresses.slice(0, 2).map((address) => (
                            <div key={address.id} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-900">
                                {address.address}, {address.city}, {address.state} - {address.pincode}
                              </span>
                            </div>
                          ))}
                          {user.addresses.length > 2 && (
                            <p className="text-sm text-gray-500">
                              +{user.addresses.length - 2} more addresses
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Recent Orders */}
                    {user.orders.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Recent Orders</p>
                        <div className="space-y-2">
                          {user.orders.slice(0, 3).map((order) => (
                            <div key={order.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">#{order.orderNumber}</span>
                                <Badge variant="outline" className="text-xs">
                                  {order.orderStatus}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">₹{(typeof order.totalAmount === 'object' && order.totalAmount.toNumber ? order.totalAmount.toNumber() : Number(order.totalAmount)).toFixed(2)}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(order.createdAt).toLocaleDateString('en-IN')}
                                </p>
                              </div>
                            </div>
                          ))}
                          {user.orders.length > 3 && (
                            <p className="text-sm text-gray-500">
                              +{user.orders.length - 3} more orders
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 lg:flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUser(user)}
                      className="w-full lg:w-auto"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No users found' : 'No users yet'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? 'Try adjusting your search terms.' 
                    : 'Users will appear here once they register.'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  User Details - {selectedUser.name}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Full Name</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedUser.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="text-lg text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Phone</p>
                    <p className="text-lg text-gray-900">{selectedUser.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Status</p>
                    <Badge className={selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Member Since</p>
                    <p className="text-lg text-gray-900">
                      {new Date(selectedUser.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{getOrderCount(selectedUser.orders)}</p>
                  </div>
                </div>

                {/* Addresses */}
                {selectedUser.addresses.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">All Addresses</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedUser.addresses.map((address) => (
                        <div key={address.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                            <div>
                              <p className="font-medium text-gray-900">{address.address}</p>
                              <p className="text-sm text-gray-600">
                                {address.city}, {address.state} - {address.pincode}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Orders */}
                {selectedUser.orders.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">All Orders</h3>
                    <div className="space-y-3">
                      {selectedUser.orders.map((order) => (
                        <div key={order.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">#{order.orderNumber}</p>
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
                              <p className="text-lg font-bold text-gray-900">₹{(typeof order.totalAmount === 'object' && order.totalAmount.toNumber ? order.totalAmount.toNumber() : Number(order.totalAmount)).toFixed(2)}</p>
                              <Badge variant="outline" className="mt-1">
                                {order.orderStatus}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedUser(null)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
