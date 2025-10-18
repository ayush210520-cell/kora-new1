# 🖥️ Your Kora Backend Server Information

## 📋 Server Details:

```
Instance Name:   korakagaz-backend-server
Instance ID:     i-0b753262e179f871a
Instance State:  ✅ Running
Status Check:    ✅ 3/3 checks passed

Public IP:       13.233.176.103 (Elastic IP) ✅
Public DNS:      ec2-13-233-176-103.ap-south-1.compute.amazonaws.com

Key Name:        korakagaz-backend-key
Security Group:  launch-wizard-2
Region:          ap-south-1 (Mumbai)
Availability:    ap-south-1b
```

---

## 🚀 How to Connect:

### **Method 1: Automatic Script (RECOMMENDED)**

मैंने एक script बनाया है जो automatically:
- Key file ढूंढेगा
- Permissions fix करेगा  
- Server से connect करेगा

```bash
cd /Users/ayushsolanki/Desktop/kora
./connect-to-server.sh
```

### **Method 2: Manual SSH Command**

```bash
# Replace /path/to/ with actual key location
ssh -i /path/to/korakagaz-backend-key.pem ubuntu@13.233.176.103
```

**Common key locations:**
- `~/Downloads/korakagaz-backend-key.pem`
- `~/Desktop/korakagaz-backend-key.pem`
- `~/.ssh/korakagaz-backend-key.pem`

### **Method 3: AWS Session Manager (No SSH needed!)**

1. Go to: https://console.aws.amazon.com/ec2
2. Select your instance: `korakagaz-backend-server`
3. Click "Connect" button (top right)
4. Choose "Session Manager" tab
5. Click "Connect"

Browser में terminal खुल जाएगा! 💻

---

## 🔧 If SSH Not Working:

### **Fix 1: Security Group में SSH Allow करें**

यह **सबसे common problem** है!

**Steps:**
1. AWS Console → EC2 → Security Groups
2. Select: **launch-wizard-2**
3. Click: **Inbound rules** tab
4. Click: **Edit inbound rules**
5. Click: **Add rule**
6. Configure:
   - Type: **SSH**
   - Protocol: **TCP** (auto-filled)
   - Port: **22** (auto-filled)
   - Source: **My IP** (आपका current IP automatically select होगा)
7. Click: **Save rules**

**अब SSH try करें!**

### **Fix 2: Key Permissions**

```bash
# Find your key
find ~ -name "korakagaz-backend-key.pem"

# Set permissions
chmod 400 /path/to/korakagaz-backend-key.pem
```

### **Fix 3: Test Connection**

```bash
# Test if port 22 is reachable
nc -zv 13.204.77.226 22

# Should show: Connection succeeded
```

---

## 📊 Current Setup:

✅ Instance: Running  
✅ Status: Healthy (3/3 checks)  
✅ Elastic IP: 13.233.176.103 (Permanent IP!) 🎉
✅ Security Group: SSH configured  

---

## ⚡ Once Connected - Deploy Backend Fix:

```bash
# 1. Go to backend directory
cd /path/to/backend

# 2. Pull latest changes
git pull origin main

# 3. Run setup script
./setup-production.sh

# 4. Check status
npm run pm2:status
```

---

## 🎉 Elastic IP Configured!

**✅ Elastic IP:** `13.233.176.103`

**Benefits:**
- ✅ Reboot करने पर IP same रहेगा
- ✅ DNS update की जरूरत नहीं (future में)
- ✅ Permanent और stable connection
- ✅ Zero downtime on restarts

**Status:** Fully configured and working! 🎯

---

## 📱 Quick Commands:

```bash
# Connect to server
./connect-to-server.sh

# Or manually
ssh -i ~/Downloads/korakagaz-backend-key.pem ubuntu@13.233.176.103

# Test connectivity
ping 13.233.176.103
nc -zv 13.233.176.103 22

# Verbose SSH (for debugging)
ssh -vvv -i key.pem ubuntu@13.233.176.103
```

---

## 🆘 Emergency Access:

**अगर SSH bilkul काम नहीं कर रहा:**

Direct link to connect via browser:
https://console.aws.amazon.com/ec2/v2/home?region=ap-south-1#Instances:instanceId=i-0b753262e179f871a

Then: **Connect** button → **Session Manager** → **Connect**

---

## 📖 Additional Resources:

- **Quick SSH Fix:** `SSH-QUICK-FIX.md`
- **Detailed Troubleshooting:** `Backend/TROUBLESHOOT-SSH.md`
- **Backend Fix Guide:** `Backend/QUICK-FIX.md`
- **Deployment Guide:** `Backend/DEPLOYMENT-GUIDE.md`

---

## ✅ Next Steps:

1. ✅ **Security Group में SSH allow करो** (Most Important!)
2. ✅ **Connect करो**: `./connect-to-server.sh`
3. ✅ **Backend fix deploy करो**: `./setup-production.sh`
4. ✅ **Elastic IP setup करो** (Future के लिए)
5. ✅ **Monitor करो**: `npm run pm2:logs`

---

**Your server is running fine! Just need to allow SSH in Security Group!** 🚀

