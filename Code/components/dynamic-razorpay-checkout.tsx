"use client";

import { useState, useEffect, useCallback } from "react";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { orderAPI, addressAPI, type Address } from "@/lib/api";
import type { RazorpayOptions, RazorpayResponse } from "@/types/razorpay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ShoppingCart, CreditCard, Truck, MapPin, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usePincodeLookup } from "@/hooks/use-pincode-lookup";

interface AddressFormData {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

interface OrderSummary {
  subtotal: number;
  shipping: number;
  total: number;
  itemCount: number;
}

export default function DynamicRazorpayCheckout() {
  const { state: cartState, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { isLoading: isPincodeLoading, error: pincodeError, lookupPincode, clearError } = usePincodeLookup();
  
  // Address management states
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  
  const [addressForm, setAddressForm] = useState<AddressFormData>({
    name: user?.name || "",
    phone: user?.phone || "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
  });
  
  const [paymentMethod, setPaymentMethod] = useState<"PREPAID">("PREPAID");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const [orderSummary, setOrderSummary] = useState<OrderSummary>({
    subtotal: 0,
    shipping: 0,
    total: 0,
    itemCount: 0,
  });

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = () => {
      if (document.querySelector('script[src*="razorpay"]')) {
        setIsRazorpayLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      
      script.onload = () => {
        setIsRazorpayLoaded(true);
        console.log('Razorpay script loaded successfully');
      };
      
      script.onerror = () => {
        setError('Failed to load Razorpay payment gateway');
        console.error('Failed to load Razorpay script');
      };

      document.body.appendChild(script);
    };

    loadRazorpay();
  }, []);

  // Calculate order summary when cart changes
  useEffect(() => {
    const subtotal = cartState.total;
    const shipping = 0; // Free shipping for now
    const total = subtotal + shipping;
    
    setOrderSummary({
      subtotal,
      shipping,
      total,
      itemCount: cartState.itemCount,
    });
  }, [cartState]);

  // Fetch saved addresses when component mounts
  useEffect(() => {
    const fetchSavedAddresses = async () => {
      if (!isAuthenticated) {
        setIsLoadingAddresses(false);
        return;
      }

      try {
        const { addresses } = await addressAPI.getAll();
        setSavedAddresses(addresses);
        
        // Auto-select first address if available
        if (addresses.length > 0 && !selectedAddressId) {
          setSelectedAddressId(addresses[0].id);
        } else if (addresses.length === 0) {
          // No saved addresses, show new address form
          setIsAddingNewAddress(true);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
        toast.error('Failed to load saved addresses');
        setIsAddingNewAddress(true); // Fallback to new address form
      } finally {
        setIsLoadingAddresses(false);
      }
    };

    fetchSavedAddresses();
  }, [isAuthenticated]);

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setAddressForm(prev => ({
        ...prev,
        name: user.name || "",
        phone: user.phone || "",
      }));
    }
  }, [user]);

  const handleAddressChange = async (field: keyof AddressFormData, value: string) => {
    setAddressForm(prev => ({
      ...prev,
      [field]: value,
    }));

    // Auto-fill city and state when pincode is entered
    if (field === 'pincode' && value.length === 6 && /^\d{6}$/.test(value)) {
      try {
        clearError(); // Clear any previous pincode errors
        const pincodeData = await lookupPincode(value);
        
        if (pincodeData) {
          setAddressForm(prev => ({
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

  const validateForm = (): boolean => {
    // If using saved address, just check if one is selected
    if (!isAddingNewAddress && selectedAddressId) {
      if (cartState.items.length === 0) {
        setError('Your cart is empty');
        return false;
      }
      return true;
    }

    // If adding new address, validate form fields
    const requiredFields: (keyof AddressFormData)[] = ['name', 'phone', 'address', 'city', 'state', 'pincode'];
    
    for (const field of requiredFields) {
      if (!addressForm[field]?.trim()) {
        setError(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        return false;
      }
    }

    if (!/^\d{10}$/.test(addressForm.phone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }

    if (!/^\d{6}$/.test(addressForm.pincode.replace(/\D/g, ''))) {
      setError('Please enter a valid 6-digit pincode');
      return false;
    }

    if (cartState.items.length === 0) {
      setError('Your cart is empty');
      return false;
    }

    return true;
  };

  // Handle selecting an existing address
  const handleSelectAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    setIsAddingNewAddress(false);
    setEditingAddressId(null);
  };

  // Handle editing an address
  const handleEditAddress = (address: Address) => {
    setEditingAddressId(address.id);
    setIsAddingNewAddress(true);
    setAddressForm({
      name: address.name,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark || "",
    });
  };

  // Handle deleting an address
  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      await addressAPI.delete(addressId);
      toast.success('Address deleted successfully');
      
      // Refresh addresses
      const { addresses } = await addressAPI.getAll();
      setSavedAddresses(addresses);
      
      // If deleted address was selected, select first available or show new address form
      if (selectedAddressId === addressId) {
        if (addresses.length > 0) {
          setSelectedAddressId(addresses[0].id);
        } else {
          setSelectedAddressId(null);
          setIsAddingNewAddress(true);
        }
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

  // Handle saving new or edited address
  const handleSaveAddress = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const addressData = {
        name: addressForm.name,
        phone: addressForm.phone,
        address: addressForm.address,
        city: addressForm.city,
        state: addressForm.state,
        pincode: addressForm.pincode,
        landmark: addressForm.landmark,
      };

      if (editingAddressId) {
        // Update existing address
        await addressAPI.update(editingAddressId, addressData);
        toast.success('Address updated successfully');
      } else {
        // Create new address
        await addressAPI.create(addressData);
        toast.success('Address saved successfully');
      }

      // Refresh addresses
      const { addresses } = await addressAPI.getAll();
      setSavedAddresses(addresses);
      
      // Select the newly saved/updated address
      const targetAddress = editingAddressId 
        ? addresses.find(a => a.id === editingAddressId)
        : addresses[0]; // New address will be first (orderBy createdAt desc)
      
      if (targetAddress) {
        setSelectedAddressId(targetAddress.id);
      }

      // Reset form
      setIsAddingNewAddress(false);
      setEditingAddressId(null);
      setAddressForm({
        name: user?.name || "",
        phone: user?.phone || "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        landmark: "",
      });
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    }
  };

  const createAddress = async (): Promise<string> => {
    // If user selected existing address, return its ID
    if (selectedAddressId && !isAddingNewAddress) {
      return selectedAddressId;
    }

    try {
      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        throw new Error('User must be logged in to create address');
      }

      console.log('🏠 Creating address with data:', {
        name: addressForm.name,
        phone: addressForm.phone,
        address: addressForm.address,
        city: addressForm.city,
        state: addressForm.state,
        pincode: addressForm.pincode,
        landmark: addressForm.landmark,
      });

      const response = await addressAPI.create({
        name: addressForm.name,
        phone: addressForm.phone,
        address: addressForm.address,
        city: addressForm.city,
        state: addressForm.state,
        pincode: addressForm.pincode,
        landmark: addressForm.landmark,
      });
      
      console.log('✅ Address created successfully:', response);
      
      // Add to saved addresses
      setSavedAddresses(prev => [response.address, ...prev]);
      
      return response.address.id;
    } catch (error) {
      console.error('❌ Address creation failed:', error);
      throw new Error('Failed to create shipping address');
    }
  };

  const createOrder = async (addressId: string) => {
    try {
      const orderItems = cartState.items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        size: item.size,
      }));

      // Validate order items before sending
      console.log('Cart items for order:', cartState.items);
      console.log('Mapped order items:', orderItems);
      
      // Check if product IDs are valid CUIDs (backend uses CUID, not UUID)
      const cuidRegex = /^c[a-z0-9]{24}$/i;
      const invalidProductIds = orderItems.filter(item => !cuidRegex.test(item.productId));
      
      if (invalidProductIds.length > 0) {
        console.error('Invalid product IDs found:', invalidProductIds);
        console.warn('Product IDs are not valid CUIDs. This might cause backend validation to fail.');
        
        // For now, let's try to proceed and see what the backend says
        // In production, you should ensure product IDs are proper CUIDs
      }
      
      // Log each cart item in detail
      cartState.items.forEach((item, index) => {
        console.log(`Cart item ${index + 1}:`, {
          id: item.id,
          idType: typeof item.id,
          idLength: item.id?.length,
          name: item.name,
          size: item.size,
          quantity: item.quantity,
          price: item.price
        });
      });

      const orderData = {
        addressId,
        orderItems,
        paymentMethod,
        notes: `Order placed via ${paymentMethod === 'PREPAID' ? 'online payment' : 'cash on delivery'}`,
      };

      console.log('Creating order with data:', orderData);
      console.log('Cart items:', cartState.items);
      console.log('Order items being sent:', orderItems);
      console.log('Address ID:', addressId);
      console.log('Payment method:', paymentMethod);

      const response = await orderAPI.create(orderData);
      console.log('Order created successfully:', response);

      return response.order;
    } catch (error: any) {
      console.error('Order creation failed:', error);
      
      // Try to get more detailed error information
      if (error.message.includes('400')) {
        console.error('Bad Request - Validation error details:', error);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        
        // Check if we have detailed error information
        if ((error as any).errorData) {
          console.error('Backend error data:', (error as any).errorData);
          
          if ((error as any).errorData.errors && Array.isArray((error as any).errorData.errors)) {
            const validationErrors = (error as any).errorData.errors.map((e: any) => e.msg).join(', ');
            throw new Error(`Validation failed: ${validationErrors}`);
          } else if ((error as any).errorData.error) {
            throw new Error(`Backend error: ${(error as any).errorData.error}`);
          }
        }
        
        // For 400 errors, the issue is usually validation
        throw new Error('Order validation failed. Check console for details.');
      } else {
        throw new Error(`Failed to create order: ${error.message}`);
      }
    }
  };

  const processRazorpayPayment = async (order: any) => {
    return new Promise<RazorpayResponse>((resolve, reject) => {
      if (typeof window.Razorpay === 'undefined') {
        reject(new Error('Razorpay is not loaded'));
        return;
      }

      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY || "rzp_test_hgR0tKivZOIs2l",
        amount: orderSummary.total * 100, // Convert to paise
        currency: "INR",
        name: "KORAKAGAZ",
        description: `Payment for KORAKAGAZ order`, // No order number yet - will be generated after payment
        order_id: order.razorpayOrderId, // Razorpay order ID only
        capture: true, // Enable automatic capture
        handler: function (response: RazorpayResponse) {
          console.log('Payment successful:', response);
          console.log('Razorpay Order ID:', response.razorpay_order_id);
          console.log('Razorpay Payment ID:', response.razorpay_payment_id);
          resolve(response);
        },
        prefill: {
          name: addressForm.name,
          email: user?.email || "customer@kora.com",
          contact: addressForm.phone,
        },
        theme: { 
          color: "#8B4513"
        },
        modal: {
          ondismiss: function() {
            reject(new Error('Payment cancelled by user'));
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      setError('Please login to continue');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Debug: Check authentication status
      console.log('User authenticated:', isAuthenticated);
      console.log('User:', user);
      
      // Check if token exists
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      
      // Step 1: Create shipping address
      toast.info('Creating shipping address...');
      console.log('Creating address with data:', addressForm);
      
      const addressId = await createAddress();
      console.log('Address created with ID:', addressId);
      
      if (paymentMethod === "PREPAID") {
        // NEW FLOW FOR PREPAID: Create Razorpay order only (no DB order yet)
        toast.info('Preparing payment...');
        console.log('Creating Razorpay order for PREPAID payment...');
        
        const razorpayOrderResponse = await createOrder(addressId);
        console.log('Razorpay order created:', razorpayOrderResponse);
        
        // Check if this is the new flow (pendingPayment = true means only Razorpay order created)
        if (razorpayOrderResponse.pendingPayment) {
          console.log('NEW FLOW: Razorpay order created, DB order will be created after payment');
          
          // Step 2: Process Razorpay payment
          toast.info('Redirecting to payment gateway...');
          const paymentResponse = await processRazorpayPayment(razorpayOrderResponse);
          
          console.log('Payment completed successfully:', paymentResponse);
          
          // Payment successful - webhook will create the order in DB
          toast.success('Payment successful! Your order is being processed...');
          clearCart();
          
          // Redirect to orders page (order will be created by webhook)
          // We don't have order.id yet, so redirect to general orders page
          setTimeout(() => {
            window.location.href = `/orders`;
          }, 2000);
        } else {
          // Old flow compatibility (if backend returns full order)
          toast.info('Redirecting to payment gateway...');
          await processRazorpayPayment(razorpayOrderResponse);
          
          toast.success('Payment successful! Order placed successfully.');
          clearCart();
          
          setTimeout(() => {
            window.location.href = `/orders/${razorpayOrderResponse.id}`;
          }, 2000);
        }
      } else {
        // COD order - created in DB immediately
        toast.info('Creating order...');
        const order = await createOrder(addressId);
        
        toast.success('Order placed successfully with Cash on Delivery!');
        clearCart();
        
        // Redirect to order confirmation
        setTimeout(() => {
          window.location.href = `/orders/${order.id}`;
        }, 2000);
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setError('Authentication failed. Please login again.');
        toast.error('Authentication failed. Please login again.');
      } else if (error.message.includes('404')) {
        setError('API endpoint not found. Please check if the backend server is running.');
        toast.error('API endpoint not found. Please check backend server.');
      } else if (error.message.includes('Payment cancelled')) {
        setError('Payment was cancelled. Please try again.');
        toast.error('Payment cancelled');
      } else if (error.message.includes('Insufficient stock')) {
        setError('Some items in your cart are out of stock. Please update your cart.');
        toast.error('Items out of stock');
      } else {
        setError(error.message || 'Something went wrong during checkout');
        toast.error(error.message || 'Checkout failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isRazorpayLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-brand" />
          <p className="text-gray-600">Loading payment gateway...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-brand mb-2">Checkout</h1>
        <p className="text-gray-600">Complete your purchase securely</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Items ({orderSummary.itemCount}):</span>
                  <span>₹{orderSummary.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping:</span>
                  <span className="text-green-600">Free</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold text-primary-brand">
                  <span>Total:</span>
                  <span>₹{orderSummary.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Cart Items Preview */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Items in cart:</p>
                {cartState.items.slice(0, 3).map((item) => (
                  <div key={item.id + item.size} className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-xs">
                      {item.quantity}
                    </div>
                    <span className="flex-1 truncate">{item.name}</span>
                    <span className="text-gray-600">₹{item.price}</span>
                  </div>
                ))}
                {cartState.items.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{cartState.items.length - 3} more items
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Information
              </CardTitle>
              <CardDescription>
                Please provide your delivery address and payment details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-6 border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {isLoadingAddresses ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-brand" />
                  <span className="ml-2 text-gray-600">Loading addresses...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Saved Addresses */}
                  {!isAddingNewAddress && savedAddresses.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Saved Addresses</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddingNewAddress(true)}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add New Address
                        </Button>
                      </div>

                      <div className="grid gap-4">
                        {savedAddresses.map((address) => (
                          <div
                            key={address.id}
                            className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              selectedAddressId === address.id
                                ? 'border-primary-brand bg-amber-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleSelectAddress(address.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-gray-900">{address.name}</h4>
                                  {selectedAddressId === address.id && (
                                    <span className="text-xs bg-primary-brand text-white px-2 py-1 rounded">
                                      Selected
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{address.phone}</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {address.address}, {address.landmark && `${address.landmark}, `}
                                  {address.city}, {address.state} - {address.pincode}
                                </p>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditAddress(address);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteAddress(address.id);
                                  }}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Address Form */}
                  {isAddingNewAddress && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">
                          {editingAddressId ? 'Edit Address' : 'Add New Address'}
                        </Label>
                        {savedAddresses.length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setIsAddingNewAddress(false);
                              setEditingAddressId(null);
                              setAddressForm({
                                name: user?.name || "",
                                phone: user?.phone || "",
                                address: "",
                                city: "",
                                state: "",
                                pincode: "",
                                landmark: "",
                              });
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>

                      {/* Personal Information */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={addressForm.name}
                      onChange={(e) => handleAddressChange('name', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={addressForm.phone}
                      onChange={(e) => handleAddressChange('phone', e.target.value)}
                      placeholder="Enter 10-digit phone number"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    value={addressForm.address}
                    onChange={(e) => handleAddressChange('address', e.target.value)}
                    placeholder="Enter your complete street address"
                  />
                </div>

                {/* Pincode, City, State */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode *</Label>
                    <div className="relative">
                      <Input
                        id="pincode"
                        value={addressForm.pincode}
                        onChange={(e) => handleAddressChange('pincode', e.target.value)}
                        placeholder="6-digit pincode"
                        maxLength={6}
                        className="pr-10"
                      />
                      {isPincodeLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        </div>
                      )}
                      {!isPincodeLoading && addressForm.pincode.length === 6 && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <MapPin className="h-4 w-4 text-green-500" />
                        </div>
                      )}
                    </div>
                    {pincodeError && (
                      <p className="text-sm text-red-600 mt-1">{pincodeError}</p>
                    )}
                    {addressForm.city && addressForm.state && (
                      <p className="text-sm text-green-600 mt-1">
                        ✓ {addressForm.city}, {addressForm.state}
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={addressForm.city}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={addressForm.state}
                        onChange={(e) => handleAddressChange('state', e.target.value)}
                        placeholder="State"
                      />
                    </div>
                  </div>
                </div>

                      {/* Landmark */}
                      <div className="space-y-2">
                        <Label htmlFor="landmark">Landmark (Optional)</Label>
                        <Input
                          id="landmark"
                          value={addressForm.landmark}
                          onChange={(e) => handleAddressChange('landmark', e.target.value)}
                          placeholder="Nearby landmark or reference point"
                        />
                      </div>
                    </div>
                  )}

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method *</Label>
                    <div className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg bg-gray-50">
                      <CreditCard className="h-4 w-4" />
                      <span className="font-medium">Online Payment (Credit/Debit Card, UPI, Net Banking)</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Secure payment powered by Razorpay. You'll be redirected to a secure payment gateway.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {isAddingNewAddress && (
                      <Button
                        onClick={handleSaveAddress}
                        disabled={isLoading}
                        className="w-full h-12 text-lg font-semibold bg-primary-brand hover:bg-primary-brand/90 text-white"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            {editingAddressId ? 'Update Address' : 'Save Address'}
                          </>
                        )}
                      </Button>
                    )}
                    
                    {!isAddingNewAddress && (
                      <Button
                        onClick={handlePlaceOrder}
                        disabled={isLoading || cartState.items.length === 0 || !selectedAddressId}
                        className="w-full h-12 text-lg font-semibold bg-amber-800 hover:bg-amber-900 text-white"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-5 w-5 mr-2" />
                            Pay ₹{orderSummary.total.toLocaleString()}
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Security Notice */}
                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      🔒 Your payment information is secure and encrypted
                    </p>
                  </div>
                </div>
              )}

              {/* Debug Information */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Debug Info (Development Only)</h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>API Base URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}</p>
                    <p>User Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
                    <p>User ID: {user?.id || 'Not logged in'}</p>
                    <p>Cart Items: {cartState.items.length}</p>
                    <p>Cart Total: ₹{cartState.total}</p>
                    <p>Razorpay Loaded: {isRazorpayLoaded ? 'Yes' : 'No'}</p>
                    
                    {/* Cart Items Debug */}
                    {cartState.items.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="font-medium">Cart Items Details:</p>
                        {cartState.items.map((item, index) => (
                          <div key={index} className="ml-2 text-xs">
                            <p>Item {index + 1}: {item.name}</p>
                            <p>ID: {item.id} (Length: {item.id.length})</p>
                            <p>Size: {item.size}, Qty: {item.quantity}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
