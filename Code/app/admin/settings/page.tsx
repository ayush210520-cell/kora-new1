"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Shield, 
  Settings as SettingsIcon, 
  Bell, 
  Lock, 
  Mail, 
  Phone, 
  MapPin,
  Save,
  Edit,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Calendar
} from "lucide-react"
import { config } from '@/lib/config'

interface AdminProfile {
  id: string
  name: string
  email: string
  phone: string
  role: string
  isActive: boolean
  createdAt: string
  lastLogin: string
  permissions: string[]
}

interface SystemSettings {
  siteName: string
  siteDescription: string
  contactEmail: string
  contactPhone: string
  address: string
  maintenanceMode: boolean
  allowRegistrations: boolean
  requireEmailVerification: boolean
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    siteName: 'Kora',
    siteDescription: 'Premium Fashion & Lifestyle',
    contactEmail: 'admin@kora.com',
    contactPhone: '+91 98765 43210',
    address: 'Mumbai, Maharashtra, India',
    maintenanceMode: false,
    allowRegistrations: true,
    requireEmailVerification: true
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isEditingSettings, setIsEditingSettings] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [settingsForm, setSettingsForm] = useState({
    siteName: '',
    siteDescription: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    maintenanceMode: false,
    allowRegistrations: true,
    requireEmailVerification: true
  })

  useEffect(() => {
    fetchProfile()
    setSettingsForm(systemSettings)
  }, [])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // For demo purposes, creating a mock profile
      // In real app, this would fetch from API
      const mockProfile: AdminProfile = {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@kora.com',
        phone: '+91 98765 43210',
        role: 'Super Admin',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastLogin: new Date().toISOString(),
        permissions: ['users:read', 'users:write', 'orders:read', 'orders:write', 'products:read', 'products:write', 'settings:read', 'settings:write']
      }
      
      setProfile(mockProfile)
      setProfileForm({
        name: mockProfile.name,
        email: mockProfile.email,
        phone: mockProfile.phone,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (profileForm.newPassword !== profileForm.confirmPassword) {
      alert('New passwords do not match!')
      return
    }

    try {
      // Here you would make API call to update profile
      console.log('Updating profile:', profileForm)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (profile) {
        setProfile({
          ...profile,
          name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone
        })
      }
      
      setIsEditingProfile(false)
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    }
  }

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Here you would make API call to update system settings
      console.log('Updating system settings:', settingsForm)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSystemSettings(settingsForm)
      setIsEditingSettings(false)
      alert('System settings updated successfully!')
    } catch (error) {
      console.error('Error updating settings:', error)
      alert('Failed to update settings')
    }
  }

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSettingsInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setSettingsForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSettingsCheckboxChange = (name: string, checked: boolean) => {
    setSettingsForm(prev => ({
      ...prev,
      [name]: checked
    }))
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings & Profile</h1>
        <p className="text-gray-600 mt-1">Manage your profile and system settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-600" />
                <CardTitle>Profile Management</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditingProfile ? 'Cancel' : 'Edit'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!isEditingProfile ? (
              // View Profile
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-primary-brand rounded-full flex items-center justify-center">
                    <User className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{profile?.name}</h3>
                    <p className="text-gray-600">{profile?.role}</p>
                    <Badge className={profile?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {profile?.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Email</p>
                      <p className="text-gray-900">{profile?.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Phone</p>
                      <p className="text-gray-900">{profile?.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Member Since</p>
                      <p className="text-gray-900">
                        {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Last Login</p>
                      <p className="text-gray-900">
                        {profile?.lastLogin ? new Date(profile.lastLogin).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Permissions</p>
                  <div className="flex flex-wrap gap-2">
                    {profile?.permissions.map((permission) => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Edit Profile Form
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileForm.email}
                      onChange={handleProfileInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={profileForm.phone}
                      onChange={handleProfileInputChange}
                      required
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Change Password</h4>
                  
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={profileForm.currentPassword}
                        onChange={handleProfileInputChange}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={profileForm.newPassword}
                      onChange={handleProfileInputChange}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={profileForm.confirmPassword}
                      onChange={handleProfileInputChange}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-gray-600" />
                <CardTitle>System Settings</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingSettings(!isEditingSettings)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditingSettings ? 'Cancel' : 'Edit'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!isEditingSettings ? (
              // View Settings
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Site Name</p>
                    <p className="text-gray-900">{systemSettings.siteName}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Site Description</p>
                    <p className="text-gray-900">{systemSettings.siteDescription}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Contact Email</p>
                    <p className="text-gray-900">{systemSettings.contactEmail}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Contact Phone</p>
                    <p className="text-gray-900">{systemSettings.contactPhone}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Address</p>
                    <p className="text-gray-900">{systemSettings.address}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">System Status</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Maintenance Mode</span>
                    </div>
                    <Badge className={systemSettings.maintenanceMode ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                      {systemSettings.maintenanceMode ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Allow Registrations</span>
                    </div>
                    <Badge className={systemSettings.allowRegistrations ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {systemSettings.allowRegistrations ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Email Verification</span>
                    </div>
                    <Badge className={systemSettings.requireEmailVerification ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {systemSettings.requireEmailVerification ? 'Required' : 'Optional'}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              // Edit Settings Form
              <form onSubmit={handleSettingsSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      name="siteName"
                      value={settingsForm.siteName}
                      onChange={handleSettingsInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="siteDescription">Site Description</Label>
                    <Textarea
                      id="siteDescription"
                      name="siteDescription"
                      value={settingsForm.siteDescription}
                      onChange={handleSettingsInputChange}
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      value={settingsForm.contactEmail}
                      onChange={handleSettingsInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      name="contactPhone"
                      value={settingsForm.contactPhone}
                      onChange={handleSettingsInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={settingsForm.address}
                      onChange={handleSettingsInputChange}
                      rows={2}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">System Options</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Maintenance Mode</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsForm.maintenanceMode}
                      onChange={(e) => handleSettingsCheckboxChange('maintenanceMode', e.target.checked)}
                      className="rounded border-gray-300 text-primary-brand focus:ring-primary-brand"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Allow Registrations</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsForm.allowRegistrations}
                      onChange={(e) => handleSettingsCheckboxChange('allowRegistrations', e.target.checked)}
                      className="rounded border-gray-300 text-primary-brand focus:ring-primary-brand"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Require Email Verification</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsForm.requireEmailVerification}
                      onChange={(e) => handleSettingsCheckboxChange('requireEmailVerification', e.target.checked)}
                      className="rounded border-gray-300 text-primary-brand focus:ring-primary-brand"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingSettings(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-600" />
              <CardTitle>Security Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600">Add an extra layer of security</p>
                </div>
                <Button variant="outline" size="sm">
                  Enable
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Session Management</p>
                  <p className="text-sm text-gray-600">Manage active sessions</p>
                </div>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Login History</p>
                  <p className="text-sm text-gray-600">View recent login attempts</p>
                </div>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-gray-600" />
              <CardTitle>Notification Preferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">New Orders</p>
                  <p className="text-sm text-gray-600">Get notified when orders are placed</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-primary-brand focus:ring-primary-brand"
                />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Low Stock Alerts</p>
                  <p className="text-sm text-gray-600">Get notified when products are low in stock</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-primary-brand focus:ring-primary-brand"
                />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">System Updates</p>
                  <p className="text-sm text-gray-600">Get notified about system maintenance</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-primary-brand focus:ring-primary-brand"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
