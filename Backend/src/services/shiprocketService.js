const axios = require('axios');
require('dotenv').config();

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';
let shiprocketToken = null;
let tokenExpiry = null;

class ShiprocketService {
  constructor() {
    this.baseURL = SHIPROCKET_BASE_URL;
    this.email = process.env.SHIPROCKET_EMAIL;
    this.password = process.env.SHIPROCKET_PASSWORD;
    this.pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || 'Default Warehouse';
    this.companyName = process.env.SHIPROCKET_COMPANY_NAME || 'Your Company Pvt Ltd';
    this.resellerName = process.env.SHIPROCKET_RESELLER_NAME || 'Your Company Name';
  }

  // Authenticate with Shiprocket
  async authenticate() {
    try {
      if (shiprocketToken && tokenExpiry && new Date() < tokenExpiry) {
        return shiprocketToken;
      }

      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email: this.email,
        password: this.password,
      });

      shiprocketToken = response.data.token;
      // Token typically expires in 24 hours, set expiry to 23 hours for safety
      tokenExpiry = new Date(Date.now() + 23 * 60 * 60 * 1000);

      console.log('✅ Shiprocket authentication successful');
      return shiprocketToken;
    } catch (error) {
      console.error('❌ Shiprocket authentication failed:', error.response?.data || error.message);
      throw new Error('Shiprocket Authentication Failed');
    }
  }

  // Create order in Shiprocket
  async createOrder(order, address, orderItems, user = null) {
    try {
      console.log('🔐 Authenticating with Shiprocket...');
      const token = await this.authenticate();
      console.log('✅ Shiprocket authentication successful');

      // Sanitize phone number: remove spaces and non-numeric characters, keep only 10 digits
      const sanitizePhone = (phone) => {
        if (!phone) return '9999999999'; // Default fallback
        const cleaned = phone.replace(/\D/g, ''); // Remove all non-digits
        return cleaned.slice(-10); // Take last 10 digits
      };

      const payload = {
        order_id: order.id,
        order_date: order.createdAt.toISOString(),
        pickup_location: this.pickupLocation,
        comment: `Order placed via ${order.paymentMethod}`,
        reseller_name: this.resellerName,
        company_name: this.companyName,
        shipping_is_billing: true,
        billing_customer_name: address.name,
        billing_last_name: '',
        billing_address: address.address,
        billing_address_2: '',
        billing_isd_code: "+91",
        billing_city: address.city,
        billing_pincode: address.pincode,
        billing_state: address.state,
        billing_country: "India",
        billing_phone: sanitizePhone(address.phone),
        billing_alternate_phone: sanitizePhone(address.phone),
        billing_email: user?.email || address.email || '',
        order_items: orderItems.map((item) => ({
          name: item.product.name,
          sku: item.product.sku || item.product.id, // Use SKU from database, fallback to ID
          units: item.quantity,
          selling_price: typeof item.price === 'object' && item.price.toNumber ? item.price.toNumber() : Number(item.price),
          discount: 0,
          tax: 0,
          hsn: "00000000"
        })),
        payment_method: order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
        shipping_charges: 0,
        giftwrap_charges: 0,
        transaction_charges: 0,
        total_discount: 0,
        sub_total: typeof order.totalAmount === 'object' && order.totalAmount.toNumber ? order.totalAmount.toNumber() : Number(order.totalAmount),
        length: 16,
        breadth: 12,
        height: 0.5,
        weight: 0.5,
        order_type: "NON ESSENTIALS"
      };

      console.log('📤 Sending order to Shiprocket with payload:', JSON.stringify(payload, null, 2));
      console.log('🔍 SKU Mapping Verification:');
      payload.order_items.forEach((item, index) => {
        console.log(`  Item ${index + 1}: ${item.name} - SKU: ${item.sku}`);
      });
      
      const response = await axios.post(`${this.baseURL}/orders/create/adhoc`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('✅ Shiprocket order created successfully:', response.data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // Token expired, reset and retry once
        shiprocketToken = null;
        tokenExpiry = null;
        return this.createOrder(order, address, orderItems);
      }
      
      console.error('❌ Shiprocket order creation failed:', error.response?.data || error.message);
      throw new Error(`Failed to create Shiprocket order: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get tracking information
  async getTrackingInfo(awbCode) {
    try {
      const token = await this.authenticate();

      const response = await axios.get(`${this.baseURL}/courier/track/awb/${awbCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        shiprocketToken = null;
        tokenExpiry = null;
        return this.getTrackingInfo(awbCode);
      }
      
      console.error('❌ Shiprocket tracking fetch failed:', error.response?.data || error.message);
      return null;
    }
  }

  // Get courier serviceability
  async checkServiceability(pincode) {
    try {
      const token = await this.authenticate();

      // Use a default pickup pincode if not configured
      const pickupPincode = process.env.SHIPROCKET_PICKUP_PINCODE || '110001';

      const response = await axios.get(`${this.baseURL}/courier/serviceability`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          pickup_postcode: pickupPincode,
          delivery_postcode: pincode,
          weight: 0.5,
          cod: 1, // Check both COD and prepaid
        },
      });

      return response.data;
    } catch (error) {
      console.error('❌ Shiprocket serviceability check failed:', error.response?.data || error.message);
      return null;
    }
  }

  // Cancel order
  async cancelOrder(shipmentId) {
    try {
      const token = await this.authenticate();

      const response = await axios.post(`${this.baseURL}/orders/cancel`, {
        shipment_id: shipmentId,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    } catch (error) {
      console.error('❌ Shiprocket order cancellation failed:', error.response?.data || error.message);
      throw new Error('Failed to cancel Shiprocket order');
    }
  }

  // Get courier list
  async getCourierList() {
    try {
      const token = await this.authenticate();

      const response = await axios.get(`${this.baseURL}/courier`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch courier list:', error.response?.data || error.message);
      return null;
    }
  }

  // Validate credentials
  validateCredentials() {
    if (!this.email || !this.password) {
      throw new Error('Shiprocket credentials not configured. Please set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD environment variables.');
    }
  }
}

module.exports = new ShiprocketService();
