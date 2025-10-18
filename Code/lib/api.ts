import { config } from './config';

// API Base configuration
// Handle cases where apiUrl may or may not already include /api
const API_BASE_URL = config.apiUrl.endsWith('/api') 
  ? config.apiUrl 
  : `${config.apiUrl}/api`;

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  stock: number;
  sizeStock?: { [key: string]: number }; // Size-wise stock: {"S": 10, "M": 15, "L": 8, "XL": 5}
  images: Array<{ url: string; public_id: string }>;
  categoryId: string;
  category: { id: string; name: string };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
}

export interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paymentMethod: 'COD' | 'PREPAID';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  orderStatus: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  userId: string;
  addressId: string;
  address: Address;
  orderItems: OrderItem[];
  notes?: string;
  razorpayOrderId?: string;
  qrPaymentLink?: string;
  delhiveryWaybill?: string;
  trackingUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  addressId: string;
  orderItems: Array<{
    productId: string;
    quantity: number;
    size?: string;
  }>;
  paymentMethod: 'COD' | 'PREPAID';
  notes?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
}

export interface CreateAddressRequest {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface UpdateAddressRequest extends CreateAddressRequest {}

export interface CreateProductRequest {
  name: string;
  sku: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  images: Array<{ url: string }>;
  sizeStock?: { [key: string]: number };
}

export interface UpdateProductRequest {
  name?: string;
  sku?: string;
  description?: string;
  price?: number;
  stock?: number;
  categoryId?: string;
  images?: File[];
}

// Utility function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Utility function to get auth headers for FormData requests
const getAuthHeadersForFormData = (): HeadersInit => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Generic API request function
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  // API_BASE_URL includes /api, so we can use endpoints directly
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  };

  try {
    console.log(`🌐 Making API request to: ${url}`);
    console.log('🔧 Request config:', {
      method: config.method || 'GET',
      headers: config.headers,
      body: config.body ? (typeof config.body === 'string' ? config.body.substring(0, 100) + '...' : 'FormData') : 'No body'
    });
    
    // Log FormData contents if it's FormData
    if (config.body instanceof FormData) {
      console.log('📋 FormData contents:');
      for (let [key, value] of config.body.entries()) {
        console.log(`  ${key}: ${value}`);
      }
    }
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorData: any = {};
      let responseText = '';
      
      try {
        responseText = await response.text();
        console.log('📄 Raw response text:', responseText);
        
        if (responseText) {
          errorData = JSON.parse(responseText);
        } else {
          errorData = { error: `Empty response body. Status: ${response.status}` };
        }
      } catch (parseError) {
        console.log('❌ Failed to parse response as JSON:', parseError);
        errorData = { 
          error: `Failed to parse error response: ${response.statusText}`,
          rawResponse: responseText
        };
      }
      
      const error = new Error(errorData.error || `HTTP error! status: ${response.status}`);
      // Attach the response and error data to the error object for better debugging
      (error as any).status = response.status;
      (error as any).response = response;
      (error as any).errorData = errorData;
      (error as any).url = url;
      (error as any).responseText = responseText;
      
      console.error(`❌ API Error for ${endpoint}:`, {
        status: response.status,
        statusText: response.statusText,
        url,
        errorData,
        responseText
      });
      throw error;
    }

    const data = await response.json();
    console.log(`✅ API Success for ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`🚨 API request failed for ${endpoint}:`, {
      error: error instanceof Error ? error.message : String(error),
      url,
      status: (error as any).status,
      errorData: (error as any).errorData,
      responseText: (error as any).responseText
    });
    throw error;
  }
};

// Auth API
export const authAPI = {
  // User registration
  register: async (data: RegisterRequest): Promise<{ message: string; token: string; user: User }> => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // User login
  login: async (data: LoginRequest): Promise<{ message: string; token: string; user: User }> => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // User logout
  logout: async (): Promise<{ message: string }> => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },

  // Update user profile
  updateProfile: async (data: { name?: string; phone?: string }): Promise<{ message: string; user: User }> => {
    return apiRequest('/auth/update', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Admin login
  adminLogin: async (data: LoginRequest): Promise<{ message: string; token: string; admin: any }> => {
    return apiRequest('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Admin logout
  adminLogout: async (): Promise<{ message: string }> => {
    return apiRequest('/auth/admin/logout', {
      method: 'POST',
    });
  },

  // OTP Methods
  sendOtp: async (phone: string): Promise<{ success: boolean; message: string; phone: string }> => {
    return apiRequest('/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  verifyOtp: async (phone: string, otp: string): Promise<{ success: boolean; message: string; requiresRegistration?: boolean }> => {
    return apiRequest('/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
  },

  resendOtp: async (phone: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest('/otp/resend', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  completeRegistration: async (data: { phone: string; email: string; name: string; password: string }): Promise<{ success: boolean; message: string; token: string; user: User }> => {
    return apiRequest('/otp/complete-registration', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Password reset methods
  checkEmailForPasswordReset: async (email: string): Promise<{ message: string }> => {
    return apiRequest('/auth/check-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },
};

// Product API
export const productAPI = {
  // Get all products with pagination and filters
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }): Promise<{
    products: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.category) searchParams.append('category', params.category);
    if (params?.search) searchParams.append('search', params.search);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    
    return apiRequest(endpoint);
  },

  // Get single product by ID
  getById: async (id: string): Promise<{ product: Product }> => {
    return apiRequest(`/products/${id}`);
  },

  // Get all categories
  getCategories: async (): Promise<{ categories: Category[] }> => {
    return apiRequest('/products/categories');
  },

  // Create product (admin only)
  create: async (data: CreateProductRequest): Promise<{ message: string; product: Product }> => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('sku', data.sku);
    formData.append('description', data.description);
    formData.append('price', data.price.toString());
    formData.append('stock', data.stock.toString());
    formData.append('categoryId', data.categoryId);
    
    // Handle sizeStock if provided
    if (data.sizeStock) {
      console.log('🔢 Adding sizeStock to FormData:', data.sizeStock);
      formData.append('sizeStock', JSON.stringify(data.sizeStock));
      formData.append('useSizeStock', 'true');
    }
    
    // Handle images - if they are URLs, we need to handle them differently
    if (data.images && data.images.length > 0) {
      data.images.forEach((image) => {
        if (image.url) {
          // For URL strings, we'll send them as a special field
          formData.append('imageUrls', image.url);
        }
      });
    }

    return apiRequest('/products', {
      method: 'POST',
      headers: getAuthHeadersForFormData(), // Include auth headers for FormData
      body: formData,
    });
  },

  // Update product (admin only)
  update: async (id: string, data: UpdateProductRequest): Promise<{ message: string; product: Product }> => {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.sku) formData.append('sku', data.sku);
    if (data.description) formData.append('description', data.description);
    if (data.price !== undefined) formData.append('price', data.price.toString());
    if (data.stock !== undefined) formData.append('stock', data.stock.toString());
    if (data.categoryId) formData.append('categoryId', data.categoryId);
    
    if (data.images) {
      data.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    return apiRequest(`/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeadersForFormData(), // Include auth headers for FormData
      body: formData,
    });
  },

  // Delete product (admin only)
  delete: async (id: string): Promise<{ message: string }> => {
    return apiRequest(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  // Create category (admin only)
  createCategory: async (data: { name: string }): Promise<{ message: string; category: Category }> => {
    return apiRequest('/products/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update category (admin only)
  updateCategory: async (id: string, data: { name: string }): Promise<{ message: string; category: Category }> => {
    return apiRequest(`/products/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// Address API
export const addressAPI = {
  // Get all addresses for the authenticated user
  getAll: async (): Promise<{ addresses: Address[] }> => {
    return apiRequest('/addresses');
  },

  // Create new address
  create: async (data: CreateAddressRequest): Promise<{ message: string; address: Address }> => {
    return apiRequest('/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update address
  update: async (id: string, data: UpdateAddressRequest): Promise<{ message: string; address: Address }> => {
    return apiRequest(`/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete address
  delete: async (id: string): Promise<{ message: string }> => {
    return apiRequest(`/addresses/${id}`, {
      method: 'DELETE',
    });
  },
};

// Order API
export const orderAPI = {
  // Get all orders for the authenticated user
  getAll: async (): Promise<{ orders: Order[] }> => {
    return apiRequest('/orders');
  },

  // Create new order
  create: async (data: CreateOrderRequest): Promise<{
    message: string;
    order: Order & {
      razorpayOrder?: any;
      qrPaymentLink?: string;
      shiprocketDetails?: any;
    };
  }> => {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get order details with tracking
  getById: async (id: string): Promise<{ order: Order; trackingInfo?: any }> => {
    return apiRequest(`/orders/${id}`);
  },

  // Update order status (admin only)
  updateStatus: async (id: string, status: string): Promise<{ message: string }> => {
    return apiRequest(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};

// Export all APIs
export const api = {
  auth: authAPI,
  products: productAPI,
  addresses: addressAPI,
  orders: orderAPI,
};

export default api;
