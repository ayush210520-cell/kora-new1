# 🔧 EC2 SSH Connection Troubleshooting Guide

## 🚨 Error: "Failed to connect to your instance"

यह guide follow करें step-by-step:

---

## ✅ Fix 1: Public IP Update करें (Most Common!)

### Reboot के बाद IP change हो जाता है!

**AWS Console में check करें:**

1. AWS Console → EC2 → Instances
2. आपका instance select करें
3. **Public IPv4 address** note करें
4. यह नया IP अपनी SSH command में use करें

### SSH Command (नए IP के साथ):

```bash
# Replace with your NEW public IP
ssh -i /path/to/your-key.pem ubuntu@NEW-PUBLIC-IP

# Example:
ssh -i ~/Downloads/my-key.pem ubuntu@13.127.45.67
```

---

## ✅ Fix 2: Instance Running है या नहीं?

**Check करें:**

```
AWS Console → EC2 → Instances → Instance State
```

**Should be:** ✅ Running (green dot)

**If stopped:** Instance right-click → Instance State → Start

**Wait 2-3 minutes** for instance to fully start, then try SSH again.

---

## ✅ Fix 3: Security Group में SSH Allow करें

**Steps:**

1. EC2 Console → Security Groups
2. आपके instance का Security Group select करें
3. "Inbound rules" tab click करें
4. Check करें कि यह rule है:

```
Type: SSH
Protocol: TCP
Port: 22
Source: 0.0.0.0/0 (या आपका specific IP)
```

**अगर नहीं है तो:**
1. "Edit inbound rules" click करें
2. "Add rule" button
3. Type dropdown से "SSH" select करें
4. Source में "My IP" या "0.0.0.0/0" select करें
5. "Save rules" click करें

---

## ✅ Fix 4: Key Permissions Fix करें

**Mac/Linux पर:**

```bash
# Key file को proper permissions दें
chmod 400 /path/to/your-key.pem

# Example:
chmod 400 ~/Downloads/my-kora-key.pem
```

**फिर SSH try करें:**

```bash
ssh -i ~/Downloads/my-kora-key.pem ubuntu@YOUR-NEW-IP
```

---

## ✅ Fix 5: Verbose Mode से Debug करें

**Detailed error देखने के लिए:**

```bash
ssh -vvv -i /path/to/your-key.pem ubuntu@YOUR-IP
```

यह show करेगा exactly कहां problem है.

---

## ✅ Fix 6: Network ACL Check करें

अगर ऊपर सब try कर लिया फिर भी नहीं हुआ:

1. VPC Console → Network ACLs
2. आपके subnet का NACL select करें
3. Inbound Rules में Port 22 allowed होना चाहिए
4. Outbound Rules में ephemeral ports (1024-65535) allowed होने चाहिए

---

## 🔥 Quick Test Commands

### 1. Test if port 22 is reachable:

```bash
# Mac/Linux
nc -zv YOUR-EC2-IP 22

# Should show: Connection succeeded
```

### 2. Test with telnet:

```bash
telnet YOUR-EC2-IP 22

# Should connect (then Ctrl+C to exit)
```

### 3. Ping test:

```bash
ping YOUR-EC2-IP

# Should get replies (if ICMP is allowed)
```

---

## 📱 Alternative: Use AWS Session Manager

अगर SSH bilkul काम नहीं कर रहा:

1. AWS Console → EC2 → Instances
2. आपका instance select करें
3. "Connect" button click करें
4. "Session Manager" tab select करें
5. "Connect" click करें

यह browser में terminal खोल देगा!

---

## 🎯 Common Scenarios & Solutions

### Scenario 1: "Permission denied (publickey)"
```bash
# Fix: Key permissions
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@YOUR-IP
```

### Scenario 2: "Connection timed out"
```bash
# Fix: Security Group में SSH allow करें (Port 22)
```

### Scenario 3: "Host key verification failed"
```bash
# Fix: Old SSH key remove करें
ssh-keygen -R YOUR-OLD-IP
# फिर नए IP से connect करें
```

### Scenario 4: "Network error: Connection refused"
```bash
# Fix: Instance fully running होने तक wait करें
# Status Check: 2/2 passed होना चाहिए
```

---

## 🔄 Elastic IP Setup (Recommended!)

**भविष्य में IP change होने से बचने के लिए:**

### Steps:

1. AWS Console → EC2 → Elastic IPs (left menu)
2. "Allocate Elastic IP address" button click करें
3. "Allocate" click करें
4. New IP select करें → Actions → "Associate Elastic IP address"
5. आपका instance select करें
6. "Associate" click करें

**अब IP कभी change नहीं होगा!** 🎉

---

## 📋 Checklist Before SSH:

- [ ] Instance State = Running
- [ ] Status Checks = 2/2 passed
- [ ] Public IP noted down (नया IP हो सकता है!)
- [ ] Key file permissions = 400 (`chmod 400 key.pem`)
- [ ] Security Group में SSH (Port 22) allowed है
- [ ] आप सही user use कर रहे हैं (`ubuntu` या `ec2-user`)

---

## 💡 Pro Tip: SSH Config File बनाएं

अगली बार आसान SSH के लिए:

```bash
# Edit SSH config
nano ~/.ssh/config

# Add this:
Host kora-server
    HostName YOUR-ELASTIC-IP-OR-DNS
    User ubuntu
    IdentityFile ~/path/to/your-key.pem
    ServerAliveInterval 60
```

**फिर simply:**
```bash
ssh kora-server
```

बस! 🚀

---

## 🆘 Still Not Working?

### Log in via AWS Console:

1. Go to EC2 Console
2. Select your instance
3. Click "Connect" button
4. Choose "Session Manager" tab
5. Click "Connect"

### Or Share These Details:

```bash
# Run these और output share करें:
1. Instance State (Running/Stopped?)
2. Public IP address
3. Security Group Inbound Rules
4. SSH command आप जो use कर रहे हैं

# Mac Terminal में:
ls -la ~/path/to/your-key.pem  # Key permissions
ssh -vvv -i key.pem ubuntu@IP 2>&1 | head -50  # Verbose errors
```

---

**Most common fix: नया Public IP use करें! reboot के बाद IP change हो जाता है** 🎯

