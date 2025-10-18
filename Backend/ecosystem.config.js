module.exports = {
  apps: [{
    name: 'kora-backend',
    script: './server.js',
    instances: 1, // Run single instance to prevent multiple DB connection pools
    exec_mode: 'fork', // Fork mode for single instance
    autorestart: true, // Auto restart if crashes
    watch: false, // Don't watch files in production
    max_memory_restart: '600M', // Restart if memory exceeds 600MB
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    // Enhanced restart strategy
    min_uptime: '10s', // Minimum uptime before considered stable
    max_restarts: 15, // Max restarts within restart window
    restart_delay: 3000, // Wait 3 seconds before restart
    exp_backoff_restart_delay: 100, // Exponential backoff for rapid restarts
    // Graceful shutdown
    kill_timeout: 10000, // 10 seconds to gracefully shutdown
    wait_ready: false, // Don't wait - start immediately
    listen_timeout: 15000, // 15 seconds to start listening
    // Health monitoring
    cron_restart: '0 4 * * *', // Auto restart daily at 4 AM IST (to prevent memory leaks)
    // Error handling
    stop_exit_codes: [0], // Only stop on clean exit
    // Logs rotation
    log_rotate_max_size: '50M',
  }]
};

