/**
 * Check Shiprocket Pickup Locations
 */

require('dotenv').config();
const axios = require('axios');

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

async function authenticate() {
  const response = await axios.post(`${SHIPROCKET_BASE_URL}/auth/login`, {
    email: process.env.SHIPROCKET_EMAIL,
    password: process.env.SHIPROCKET_PASSWORD,
  });
  return response.data.token;
}

async function getPickupLocations() {
  console.log('🔍 Checking Shiprocket Pickup Locations\n');
  
  try {
    const token = await authenticate();
    console.log('✅ Authenticated successfully\n');
    
    const response = await axios.get(`${SHIPROCKET_BASE_URL}/settings/company/pickup`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const locations = response.data.data.shipping_address;
    
    console.log(`📍 Available Pickup Locations (${locations.length}):\n`);
    
    locations.forEach((location, index) => {
      console.log(`${index + 1}. Pickup Location Name: "${location.pickup_location}"`);
      console.log(`   Address: ${location.address}`);
      console.log(`   City: ${location.city}, ${location.state} - ${location.pin_code}`);
      console.log(`   Phone: ${location.phone}`);
      console.log(`   Email: ${location.email || 'N/A'}`);
      console.log('');
    });
    
    console.log('💡 Update your .env file with one of these pickup location names:');
    console.log('   SHIPROCKET_PICKUP_LOCATION="<exact_name_from_above>"\n');
    
    // Show current setting
    console.log(`⚠️  Current setting in .env: "${process.env.SHIPROCKET_PICKUP_LOCATION}"`);
    
    const currentExists = locations.find(l => l.pickup_location === process.env.SHIPROCKET_PICKUP_LOCATION);
    if (currentExists) {
      console.log('✅ Current pickup location is valid!');
    } else {
      console.log('❌ Current pickup location is NOT valid! Please update it.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

getPickupLocations();

