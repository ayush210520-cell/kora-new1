const isProduction = process.env.NODE_ENV === 'production';

class Logger {
  static info(message, data = null) {
    if (!isProduction) {
      console.log(`ℹ️ ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }

  static success(message, data = null) {
    if (!isProduction) {
      console.log(`✅ ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }

  static warn(message, data = null) {
    console.warn(`⚠️ ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  static error(message, error = null) {
    console.error(`❌ ${message}`);
    if (error) {
      if (isProduction) {
        // In production, only log essential error info
        console.error('Error:', {
          message: error.message,
          name: error.name,
          ...(error.response && { status: error.response.status })
        });
      } else {
        // In development, log full error details
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          response: error.response?.data,
          status: error.response?.status
        });
      }
    }
  }

  static debug(message, data = null) {
    if (!isProduction) {
      console.log(`🔍 ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }

  static webhook(message, data = null) {
    // Always log webhook events for monitoring
    console.log(`🔔 ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  static payment(message, data = null) {
    // Always log payment events for monitoring
    console.log(`💰 ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  static shiprocket(message, data = null) {
    // Always log Shiprocket events for monitoring
    console.log(`🚀 ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
}

module.exports = Logger;
