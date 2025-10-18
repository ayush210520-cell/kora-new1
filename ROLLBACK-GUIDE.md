# 🔄 Rollback Guide - Kora Backend

## जरूरत पड़ने पर पुराने version पर कैसे जाएं

---

## 📌 Current Deployment Info

**New Version (Current):**
- Commit: `fe3d171fc6b17a693aabdbe0e4318fa98a76760c`
- Features: Auto-recovery, Database reconnection, Enhanced stability

**Previous Version (Backup):**
- Commit: `b26410a86299aee2ec259d822d26c4a37843f2f1`
- Features: Basic functionality (before stability improvements)

---

## ⚠️ कब Rollback करें?

Rollback करें अगर:
- ❌ नया version में unexpected bugs हों
- ❌ Performance worse हो गया हो
- ❌ कोई critical feature टूट गया हो
- ❌ Database connection issues बढ़ गए हों

---

## 🔄 Method 1: Quick Rollback (Recommended)

### Local से Rollback करें:

```bash
# 1. Go to project directory
cd /Users/ayushsolanki/Desktop/kora

# 2. Rollback to previous commit
git reset --hard b26410a86299aee2ec259d822d26c4a37843f2f1

# 3. Force push (CAREFUL!)
git push origin main --force

# 4. Deploy old version to production
scp -i ~/Downloads/korakagaz-backend-key.pem \
  Backend/src/config/db.js \
  Backend/server.js \
  Backend/ecosystem.config.js \
  ubuntu@13.233.176.103:~/kora/Backend/

# 5. Restart server
ssh -i ~/Downloads/korakagaz-backend-key.pem ubuntu@13.233.176.103 \
  "cd ~/kora/Backend && pm2 restart ecosystem.config.js"
```

---

## 🔄 Method 2: Rollback Directly on Server

### Server पर directly rollback करें:

```bash
# 1. Connect to server
ssh -i ~/Downloads/korakagaz-backend-key.pem ubuntu@13.233.176.103

# 2. Go to backend directory
cd ~/kora/Backend

# 3. Fetch latest from git
git fetch origin

# 4. Rollback to previous commit
git reset --hard b26410a

# 5. Restart PM2
pm2 restart ecosystem.config.js

# 6. Verify
pm2 status
pm2 logs --lines 20
```

---

## 🔄 Method 3: Revert Specific Changes Only

अगर सिर्फ कुछ files को पुराना करना हो:

```bash
# Database config को पुराना करें
git checkout b26410a -- Backend/src/config/db.js

# Server file को पुराना करें
git checkout b26410a -- Backend/server.js

# PM2 config को पुराना करें
git checkout b26410a -- Backend/ecosystem.config.js

# Commit और deploy करें
git commit -m "Rollback specific files"
git push origin main
```

---

## ✅ Rollback के बाद Verify करें

```bash
# Health check
curl https://server.korakagazindia.com/health

# Ping check
curl https://server.korakagazindia.com/ping

# PM2 status
ssh -i ~/Downloads/korakagaz-backend-key.pem ubuntu@13.233.176.103 "pm2 status"

# Logs check
ssh -i ~/Downloads/korakagaz-backend-key.pem ubuntu@13.233.176.103 "pm2 logs --lines 50"
```

---

## 🔙 फिर से नए version पर जाने के लिए

अगर rollback के बाद फिर से नया version try करना हो:

```bash
# Latest version पर आएं
git reset --hard fe3d171

# Deploy करें
# (Same deployment steps as above)
```

---

## 📝 Git Commit History

सभी versions देखने के लिए:

```bash
# Recent commits देखें
git log --oneline -10

# Specific commit पर जाएं
git checkout <commit-hash>

# या reset करें
git reset --hard <commit-hash>
```

---

## 🚨 Important Notes

1. **Backup पहले लें:**
   - Rollback से पहले current state का backup रखें
   - Database backup भी check करें

2. **Testing करें:**
   - Rollback के बाद thoroughly test करें
   - सभी critical features check करें

3. **Users को inform करें:**
   - अगर downtime हो तो users को बताएं
   - Social media/email notification भेजें

4. **Monitoring:**
   - Rollback के बाद closely monitor करें
   - Logs regularly check करते रहें

---

## 🆘 Emergency Rollback (Server Down हो तो)

```bash
# 1. Connect to server
ssh -i ~/Downloads/korakagaz-backend-key.pem ubuntu@13.233.176.103

# 2. Stop monitoring
~/kora/Backend/monitor-server.sh stop

# 3. Stop PM2
pm2 stop kora-backend

# 4. Quick rollback
cd ~/kora/Backend
git reset --hard b26410a

# 5. Restart
pm2 start ecosystem.config.js

# 6. Check status
pm2 status
curl http://localhost:3001/ping
```

---

## 📞 Quick Commands Reference

| Task | Command |
|------|---------|
| View commit history | `git log --oneline -10` |
| Rollback to commit | `git reset --hard <commit>` |
| Check current version | `git rev-parse HEAD` |
| Server status | `pm2 status` |
| Server logs | `pm2 logs --lines 50` |
| Restart server | `pm2 restart kora-backend` |

---

## ✅ Current System is Stable

**अभी तक कोई issue नहीं है!** 

नया version पूरी तरह से tested है और सब कुछ working है। यह guide सिर्फ safety के लिए है - future में अगर कभी जरूरत पड़े तो use कर सकते हैं।

---

**Last Updated:** October 12, 2025  
**Current Version:** fe3d171 (Stable with auto-recovery)  
**Previous Version:** b26410a (Basic version - backup)

