"use client";

import { useState, useEffect } from "react";
import { config } from "@/lib/config";
import { api } from "@/lib/api";
import { usePincodeLookup } from "@/hooks/use-pincode-lookup";
import { toast } from "sonner";
import { Loader2, MapPin } from "lucide-react";

export default function CheckoutPage() {
  const { isLoading: isPincodeLoading, error: pincodeError, lookupPincode, clearError } = usePincodeLookup();
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    paymentMethod: "PREPAID",
    items: [
      { productId: "PRODUCT_ID_HERE", quantity: 1, price: 500 }, // Example item
    ],
    totalAmount: 500,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = async () => {
      try {
        // Check if script already exists
        if (document.querySelector('script[src*="razorpay"]')) {
          console.log('Razorpay script already loaded');
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        
        script.onload = () => {
          console.log('Razorpay script loaded successfully');
        };
        
        script.onerror = () => {
          console.error('Failed to load Razorpay script');
        };

        document.body.appendChild(script);
      } catch (error) {
        console.error('Error loading Razorpay script:', error);
      }
    };

    loadRazorpay();

    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Auto-fill city and state when pincode is entered
    if (name === 'pincode' && value.length === 6 && /^\d{6}$/.test(value)) {
      try {
        clearError(); // Clear any previous pincode errors
        const pincodeData = await lookupPincode(value);
        
        if (pincodeData) {
          setFormData(prev => ({
            ...prev,
            city: pincodeData.city,
            state: pincodeData.state,
          }));
          
          toast.success(`Location updated: ${pincodeData.city}, ${pincodeData.state}`);
        }
      } catch (error) {
        console.error('Error fetching pincode data:', error);
        // Don't show error toast for pincode lookup failures, just log it
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError("");

    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Please login to continue");
        setIsLoading(false);
        return;
      }

      // Debug: Log token info
      console.log('Token found:', token ? 'Yes' : 'No');
      console.log('Token length:', token ? token.length : 0);
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'None');

      // Test authentication first
      console.log('Testing authentication...');
      const authTestResponse = await fetch(`${config.apiUrl}/api/auth/me`, {
        headers: { 
          "Authorization": `Bearer ${token}`
        }
      });
      
      console.log('Auth test response status:', authTestResponse.status);
      if (!authTestResponse.ok) {
        const authError = await authTestResponse.json().catch(() => ({ error: 'Auth failed' }));
        console.error('Authentication failed:', authError);
        throw new Error('Authentication failed. Please login again.');
      }
      
      const userData = await authTestResponse.json();
      console.log('User authenticated:', userData);

      // TEMPORARY: Use mock address ID to test payment flow
      // TODO: Fix address creation authentication issue
      const addressId = "temp-address-id-for-testing";
      console.log('Using temporary address ID:', addressId);

      /* COMMENTED OUT FOR NOW - Address creation has auth issues
      // First create address
      console.log('Creating address with data:', {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode
      });

      const addressResponse = await fetch(`${config.apiUrl}/api/addresses`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          landmark: formData.landmark
        })
      });

      console.log('Address response status:', addressResponse.status);
      console.log('Address response headers:', Object.fromEntries(addressResponse.headers.entries()));

      if (!addressResponse.ok) {
        const errorData = await addressResponse.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error('Address creation failed:', errorData);
        throw new Error(errorData.error || `Failed to create address: ${addressResponse.status}`);
      }

      const addressData = await addressResponse.json();
      const addressId = addressData.address.id;
      */

      if (formData.paymentMethod === "PREPAID") {
        console.log('Starting PREPAID payment flow...');
        try {
          // Create Razorpay order
          const orderResponse = await fetch(`${config.apiUrl}/api/orders`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              addressId: addressId,
              orderItems: formData.items,
              paymentMethod: "PREPAID",
              notes: ""
            })
          });

        if (!orderResponse.ok) {
          throw new Error("Failed to create order");
        }

        const orderData = await orderResponse.json();
        
        // Check if Razorpay is loaded
        if (typeof (window as any).Razorpay === 'undefined') {
          alert('Razorpay is not loaded. Please refresh the page and try again.');
          return;
        }

        // Check if we have a valid Razorpay key
        const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY;
        if (!razorpayKey || razorpayKey === "rzp_test_YOUR_KEY_HERE") {
          alert('Razorpay key not configured. Please contact support.');
          return;
        }

        console.log('Creating Razorpay payment with:', {
          key: razorpayKey,
          amount: formData.totalAmount * 100,
          orderId: orderData.order.razorpayOrderId
        });
        
        // Initialize Razorpay payment
        const options = {
          key: razorpayKey,
          amount: formData.totalAmount * 100,
          currency: "INR",
          name: "KORAKAGAZ",
          description: "Order Payment",
          order_id: orderData.order.razorpayOrderId,
          capture: true, // Enable automatic capture
          handler: function (response: any) {
            // Payment successful
            alert("Payment Successful! Payment ID: " + response.razorpay_payment_id);
            // Redirect to success page or update order status
            window.location.href = "/orders";
          },
          prefill: {
            name: formData.name,
            email: "customer@kora.com",
            contact: formData.phone,
          },
          theme: { 
            color: "#8B4513" // Your theme color
          },
          modal: {
            ondismiss: function() {
              alert("Payment cancelled");
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch (error) {
        console.error("Payment error:", error);
        alert("Payment failed: " + (error instanceof Error ? error.message : String(error)));
      }
    } else {
      // COD order
      try {
        const orderResponse = await fetch(`${config.apiUrl}/api/orders`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            addressId: addressId,
            orderItems: formData.items,
            paymentMethod: "COD",
            notes: ""
          })
        });

        if (orderResponse.ok) {
          alert("Order placed successfully with COD!");
          // Redirect to orders page
          window.location.href = "/orders";
        } else {
          throw new Error("Failed to place order");
        }
              } catch (error) {
          console.error("Order error:", error);
          setError("Failed to place order: " + (error instanceof Error ? error.message : String(error)));
        }
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setError((error instanceof Error ? error.message : String(error)) || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-primary-brand text-center">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-primary-brand">Order Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">₹{formData.totalAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping:</span>
              <span className="font-medium">Free</span>
            </div>
            <hr className="my-3" />
            <div className="flex justify-between text-lg font-bold">
              <span className="text-primary-brand">Total:</span>
              <span className="text-primary-brand">₹{formData.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Checkout Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-primary-brand">Shipping Information</h2>
          
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input 
                name="name" 
                placeholder="Full Name" 
                value={formData.name} 
                onChange={handleChange} 
                className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-transparent" 
              />
              <input 
                name="phone" 
                placeholder="Phone Number" 
                value={formData.phone} 
                onChange={handleChange} 
                className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-transparent" 
              />
            </div>
            
            <input 
              name="address" 
              placeholder="Street Address" 
              value={formData.address} 
              onChange={handleChange} 
              className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-transparent" 
            />
            
            <div className="space-y-4">
              <div>
                <div className="relative">
                  <input 
                    name="pincode" 
                    placeholder="Pincode" 
                    value={formData.pincode} 
                    onChange={handleChange} 
                    maxLength={6}
                    className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-transparent pr-10" 
                  />
                  {isPincodeLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                  {!isPincodeLoading && formData.pincode.length === 6 && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <MapPin className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                </div>
                {pincodeError && (
                  <p className="text-sm text-red-600 mt-1">{pincodeError}</p>
                )}
                {formData.city && formData.state && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ {formData.city}, {formData.state}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input 
                  name="city" 
                  placeholder="City" 
                  value={formData.city} 
                  onChange={handleChange} 
                  className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-transparent" 
                />
                <input 
                  name="state" 
                  placeholder="State" 
                  value={formData.state} 
                  onChange={handleChange} 
                  className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-transparent" 
                />
              </div>
            </div>
            
            <input 
              name="landmark" 
              placeholder="Landmark (Optional)" 
              value={formData.landmark} 
              onChange={handleChange} 
              className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-transparent" 
            />

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3 text-primary-brand">Payment Method</h3>
              <div className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg bg-gray-50">
                <span className="font-medium">Online Payment (Credit/Debit Card, UPI, Net Banking)</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Secure payment powered by Razorpay. You'll be redirected to a secure payment gateway.
              </p>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-amber-800 hover:bg-amber-900 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Processing..." : "Place Order"}
            </button>
            
            {/* Test Razorpay Button */}
            <button 
              type="button" 
              onClick={() => {
                console.log('Razorpay status check:');
                console.log('- Window.Razorpay:', typeof (window as any).Razorpay);
                console.log('- Environment key:', process.env.NEXT_PUBLIC_RAZORPAY_KEY);
                console.log('- Form data:', formData);
                
                if (typeof (window as any).Razorpay === 'undefined') {
                  alert('Razorpay is NOT loaded. Check console for details.');
                } else {
                  alert('Razorpay is loaded successfully!');
                }
              }}
              className="w-full mt-2 bg-gray-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors duration-200"
            >
              Test Razorpay Status
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
