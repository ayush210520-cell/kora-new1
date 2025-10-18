# EC2 Deployment Guide - Fix करने के लिए Steps

## समस्या
Server reboot के बाद कुछ देर काम करता है फिर timeout हो जाता है।

## कारण
- Prisma 17 database connections बना रहा था
- Connection pool properly configured नहीं था
- Database connection limit exceed हो रही थी

## Solution Steps

### 1. EC2 पर SSH करें
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 2. Backend directory में जाएं
```bash
cd /path/to/your/backend
```

### 3. नई changes pull करें
```bash
git pull origin main
```

### 4. PM2 install करें (अगर नहीं है)
```bash
npm install -g pm2
```

### 5. Logs directory बनाएं
```bash
mkdir -p logs
```

### 6. Old process को stop करें
```bash
# अगर पहले से running है तो
pm2 stop all
pm2 delete all

# या अगर सीधे node से चला रहे हैं
pkill -f "node server.js"
```

### 7. PM2 से server start करें
```bash
pm2 start ecosystem.config.js
```

### 8. PM2 को system startup में add करें
```bash
pm2 startup
# जो command output में आए, वो run करें (sudo के साथ)

pm2 save
```

### 9. Server status check करें
```bash
pm2 status
pm2 logs kora-backend --lines 50
```

## Monitoring Commands

### Server status देखें
```bash
pm2 status
```

### Logs देखें
```bash
# Real-time logs
pm2 logs kora-backend

# Last 100 lines
pm2 logs kora-backend --lines 100

# Only errors
pm2 logs kora-backend --err
```

### Memory usage check करें
```bash
pm2 monit
```

### Server restart करें (बिना downtime)
```bash
pm2 restart kora-backend
```

### Server stop/start करें
```bash
pm2 stop kora-backend
pm2 start kora-backend
```

## Database Connection Settings

अब database connection pool properly configured है:
- **Maximum connections: 5** (पहले 17 था)
- **Pool timeout: 10 seconds**
- **Connect timeout: 30 seconds**
- **Health check: हर 60 seconds**

## Improvements जो किए गए

1. ✅ Connection pool limit को 5 connections पर set किया
2. ✅ Connection timeout settings add की
3. ✅ Automatic health check हर minute
4. ✅ Graceful error handling
5. ✅ PM2 configuration for auto-restart
6. ✅ Memory limit (500MB) के बाद auto-restart

## Troubleshooting

### अगर फिर भी timeout हो रहा है:

1. **Database connections check करें:**
```bash
# EC2 पर
pm2 logs kora-backend | grep "connections"
```

2. **Database में active connections देखें:**
```sql
-- RDS में login करके
SELECT count(*) FROM pg_stat_activity;
```

3. **PM2 memory usage check करें:**
```bash
pm2 monit
```

4. **Server health endpoint check करें:**
```bash
curl https://server.korakagazindia.com/health
```

### अगर database not reachable है:

1. **RDS Security Group check करें:**
   - EC2 का security group RDS में allowed होना चाहिए
   - Port 5432 open होना चाहिए

2. **DATABASE_URL check करें:**
```bash
cd /path/to/backend
cat .env | grep DATABASE_URL
```

## Important Notes

- 🔴 **Server को अब manually restart करने की जरूरत नहीं होनी चाहिए**
- 🔴 **PM2 automatically monitor और restart करेगा**
- 🔴 **Memory exceed होने पर automatic restart होगा**
- 🔴 **Database connections अब properly managed हैं**

## Next Steps

1. Changes को EC2 पर deploy करें
2. PM2 setup करें
3. 2-3 hours monitor करें
4. Logs check करें कि कोई error तो नहीं आ रहा

## Contact

अगर फिर भी issue हो तो logs share करें:
```bash
pm2 logs kora-backend --lines 200 > logs-output.txt
```

