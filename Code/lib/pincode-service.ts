// Pincode lookup service for India
export interface PincodeData {
  city: string;
  state: string;
  district: string;
  pincode: string;
  country: string;
}

export interface PincodeResponse {
  success: boolean;
  data?: PincodeData;
  error?: string;
}

// Free API for Indian pincode lookup
const PINCODE_API_BASE = 'https://api.postalpincode.in/pincode';

export async function getCityStateFromPincode(pincode: string): Promise<PincodeResponse> {
  try {
    // Validate pincode
    if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      return {
        success: false,
        error: 'Invalid pincode format. Please enter a 6-digit pincode.'
      };
    }

    const response = await fetch(`${PINCODE_API_BASE}/${pincode}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Check if API returned valid data
    if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
      const postOffice = data[0].PostOffice[0]; // Take first post office data
      
      return {
        success: true,
        data: {
          city: postOffice.District || postOffice.Name || '',
          state: postOffice.State || '',
          district: postOffice.District || '',
          pincode: pincode,
          country: 'India'
        }
      };
    } else {
      return {
        success: false,
        error: 'Pincode not found. Please check and try again.'
      };
    }
  } catch (error) {
    console.error('Pincode lookup error:', error);
    return {
      success: false,
      error: 'Failed to fetch pincode details. Please try again later.'
    };
  }
}

// Alternative API (backup)
export async function getCityStateFromPincodeAlternative(pincode: string): Promise<PincodeResponse> {
  try {
    if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      return {
        success: false,
        error: 'Invalid pincode format. Please enter a 6-digit pincode.'
      };
    }

    // Using a different API as backup
    const response = await fetch(`https://api.zippopotam.us/in/${pincode}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.places && data.places.length > 0) {
      const place = data.places[0];
      
      return {
        success: true,
        data: {
          city: place['place name'] || '',
          state: place.state || '',
          district: place['place name'] || '',
          pincode: pincode,
          country: 'India'
        }
      };
    } else {
      return {
        success: false,
        error: 'Pincode not found. Please check and try again.'
      };
    }
  } catch (error) {
    console.error('Alternative pincode lookup error:', error);
    return {
      success: false,
      error: 'Failed to fetch pincode details. Please try again later.'
    };
  }
}
