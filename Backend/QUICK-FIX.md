# ⚡ Quick Fix Guide - Server Timeout Issue

## 🔴 Problem
Server reboot के बाद थोड़ी देर काम करता है, फिर timeout हो जाता है।

## ✅ Solution
Database connection pool limit set करनी होगी और PM2 से server manage करना होगा।

---

## 🚀 EC2 पर Deploy करने के Steps

### 1️⃣ EC2 में SSH करें
```bash
ssh -i your-key.pem ubuntu@your-server-ip
cd /path/to/backend
```

### 2️⃣ Latest code pull करें
```bash
git pull origin main
```

### 3️⃣ Setup script run करें
```bash
chmod +x setup-production.sh
./setup-production.sh
```

### 4️⃣ PM2 startup command run करें
Setup script के end में जो command दिखाई देगी (sudo के साथ), वो run करें:
```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

### 5️⃣ Test करें
```bash
# Server status
npm run pm2:status

# Health check
curl http://localhost:3001/health

# Logs देखें
npm run pm2:logs
```

---

## 📊 Monitoring Commands

```bash
# Status देखें
npm run pm2:status

# Live logs देखें
npm run pm2:logs

# Memory/CPU monitor करें
npm run pm2:monit

# Server restart करें
npm run pm2:restart

# Health monitor logs
tail -f /var/log/kora-health-monitor.log
```

---

## 🔧 What Changed?

### Before (Problem):
- ❌ 17 database connections बन रहे थे
- ❌ No connection limit
- ❌ Server crash पर manual restart
- ❌ Memory leaks

### After (Fixed):
- ✅ Only 5 database connections
- ✅ Connection timeout: 30 seconds
- ✅ Pool timeout: 10 seconds
- ✅ Auto-restart on crash
- ✅ Auto-restart on memory > 500MB
- ✅ Health check every 5 minutes
- ✅ Error logging
- ✅ Process monitoring with PM2

---

## 🆘 Troubleshooting

### Server not starting?
```bash
# Check logs
npm run pm2:logs

# Check if port 3001 is busy
lsof -i :3001
```

### Database connection error?
```bash
# Test database connection
node -e "require('./src/config/db.js').\$connect().then(() => console.log('OK'))"

# Check .env file
cat .env | grep DATABASE_URL
```

### Server still timing out?
```bash
# Check active connections
npm run pm2:monit

# Check health endpoint
curl http://localhost:3001/health

# Restart server
npm run pm2:restart
```

---

## 📱 Contact Commands

अगर issue हो तो ये information collect करें:

```bash
# Server status
npm run pm2:status > status.txt

# Last 200 log lines
npm run pm2:logs --lines 200 > logs.txt

# System info
free -h > memory.txt
df -h > disk.txt
```

---

## ⚠️ Important Notes

1. **PM2 automatically restart करेगा** - Manual restart की जरूरत नहीं
2. **Health monitor हर 5 minutes check करता है**
3. **Memory limit 500MB** - उसके बाद auto-restart
4. **Connection pool = 5** - पहले 17 था, अब controlled है
5. **Logs automatically rotate होते हैं** - Disk space issue नहीं होगा

---

## ✨ Expected Behavior

- Server start होने के बाद stable रहेगा
- Timeout issues नहीं होने चाहिए
- अगर crash भी हो तो 4 seconds में auto-restart
- Memory exceed होने पर graceful restart
- Database connections properly managed

---

## 🎯 Next Steps

1. ✅ Changes को EC2 पर deploy करें
2. ✅ PM2 setup करें
3. ✅ 2-3 hours monitor करें
4. ✅ अगर सब ठीक है तो customer traffic allow करें

---

**🔥 Ab server rock solid रहेगा!**

