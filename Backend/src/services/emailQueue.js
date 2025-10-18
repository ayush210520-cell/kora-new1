const emailService = require('./emailService');

// Simple email queue
const emailQueue = [];
let isProcessing = false;

// Add email to queue
function addToQueue(emailData, type = 'welcome') {
  emailQueue.push({
    data: emailData,
    type: type,
    timestamp: new Date(),
    retries: 0
  });
  
  console.log(`📧 Email added to queue: ${type} for ${emailData.email}`);
  
  // Process queue if not already processing
  if (!isProcessing) {
    processQueue();
  }
}

// Process email queue
async function processQueue() {
  if (isProcessing || emailQueue.length === 0) {
    return;
  }
  
  isProcessing = true;
  console.log(`📧 Processing email queue: ${emailQueue.length} emails`);
  
  while (emailQueue.length > 0) {
    const emailItem = emailQueue.shift();
    
    try {
      console.log(`📧 Sending ${emailItem.type} email to ${emailItem.data.email}`);
      
      let result;
      if (emailItem.type === 'welcome') {
        result = await emailService.sendWelcomeEmail(emailItem.data);
      } else if (emailItem.type === 'order') {
        result = await emailService.sendOrderConfirmationEmail(emailItem.data);
      }
      
      if (result && result.success) {
        console.log(`✅ Email sent successfully: ${emailItem.type}`);
      } else {
        throw new Error(result ? result.error : 'Unknown error');
      }
      
    } catch (error) {
      console.error(`❌ Email failed: ${emailItem.type}`, error.message);
      
      // Retry logic
      emailItem.retries++;
      if (emailItem.retries < 3) {
        console.log(`🔄 Retrying email: ${emailItem.type} (attempt ${emailItem.retries + 1})`);
        emailQueue.unshift(emailItem); // Add back to front of queue
      } else {
        console.error(`❌ Email permanently failed after 3 retries: ${emailItem.type}`);
      }
    }
    
    // Wait 2 seconds between emails
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  isProcessing = false;
  console.log('📧 Email queue processing complete');
}

// Get queue status
function getQueueStatus() {
  return {
    queueLength: emailQueue.length,
    isProcessing: isProcessing,
    pendingEmails: emailQueue.map(item => ({
      type: item.type,
      email: item.data.email,
      timestamp: item.timestamp,
      retries: item.retries
    }))
  };
}

module.exports = {
  addToQueue,
  processQueue,
  getQueueStatus
};


