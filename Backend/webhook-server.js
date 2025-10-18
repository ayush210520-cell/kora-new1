// GitHub Webhook Server for Auto-Deployment
const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto');

const app = express();
const PORT = 9000;

// GitHub webhook secret (set this in GitHub webhook settings)
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'korakagaz-deploy-secret-2025';

app.use(express.json());

// Verify GitHub webhook signature
function verifySignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
  
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// GitHub webhook endpoint
app.post('/webhook/deploy', (req, res) => {
  console.log('📥 Webhook received from GitHub');

  // Verify signature (optional but recommended)
  // if (!verifySignature(req)) {
  //   console.log('❌ Invalid signature');
  //   return res.status(401).send('Invalid signature');
  // }

  const event = req.headers['x-github-event'];
  const branch = req.body.ref;

  console.log('🔔 Event:', event);
  console.log('🌿 Branch:', branch);

  // Only deploy on push to main branch
  if (event === 'push' && branch === 'refs/heads/main') {
    console.log('🚀 Triggering deployment...');

    // Run deployment script
    exec('bash ~/kora/Backend/deploy.sh', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Deployment failed:', error);
        return;
      }
      console.log('📝 Deployment output:', stdout);
      if (stderr) console.error('⚠️  Deployment stderr:', stderr);
      console.log('✅ Deployment completed successfully!');
    });

    res.status(200).send('Deployment triggered');
  } else {
    console.log('ℹ️  Ignoring event (not a push to main)');
    res.status(200).send('Event ignored');
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'webhook-server' });
});

app.listen(PORT, () => {
  console.log(`🎣 GitHub webhook server listening on port ${PORT}`);
  console.log(`📍 Webhook URL: http://13.204.77.226:${PORT}/webhook/deploy`);
  console.log(`🔐 Secret: ${WEBHOOK_SECRET}`);
});

