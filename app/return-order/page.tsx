"use client"

import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

export default function ReturnOrderPage() {
  const [formData, setFormData] = useState({
    orderNumber: '',
    email: '',
    reason: '',
    description: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle exchange request submission
    alert('Exchange request submitted successfully! We will contact you within 24 hours.')
  }

  return (
    <>
      <SiteHeader />
      <main className="pt-[100px] min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Exchange My Order
            </h1>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Important Note</h3>
                <p className="text-sm text-blue-700">
                  We do not offer returns or refunds, but we do allow exchanges for size issues or defective products within 3 days of delivery. Products must be unused and in original packaging with all tags intact.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Number *
                  </label>
                  <Input
                    type="text"
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({...formData, orderNumber: e.target.value})}
                    placeholder="Enter your order number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Exchange *
                  </label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-brand focus:border-transparent"
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="wrong-size">Wrong Size</option>
                    <option value="defective">Defective Product</option>
                    <option value="wrong-product">Wrong Product Received</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Details
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Please provide additional details about your exchange request"
                    rows={4}
                  />
                </div>

                <Button type="submit" className="w-full bg-primary-brand hover:bg-primary-brand/90">
                  Submit Exchange Request
                </Button>
              </form>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">What happens next?</h3>
                <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                  <li>We'll review your exchange request within 24 hours</li>
                  <li>You'll receive an email with exchange instructions</li>
                  <li>We'll provide a prepaid return shipping label</li>
                  <li>Once we receive your item, we'll process your exchange</li>
                </ol>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Need help? Contact us at{' '}
                  <a href="mailto:contact@korakagazindia.com" className="text-primary-brand hover:underline">
                    contact@korakagazindia.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
