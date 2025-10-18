# ⚡ Elastic IP - Quick Setup (5 Minutes)

## 🎯 क्या है?

**Elastic IP = Permanent IP Address**

```
Without Elastic IP:
Reboot → IP: 13.204.77.226 → 52.66.123.45 ❌ (Changes!)

With Elastic IP:
Reboot → IP: 15.206.XX.XX → 15.206.XX.XX ✅ (Same!)
```

---

## 💰 Cost: FREE ✅

(जब तक instance running है)

---

## 🚀 5-Minute Setup:

### **Step 1: Allocate (1 min)**

```
AWS Console → EC2 → Left sidebar "Elastic IPs"
↓
"Allocate Elastic IP address" button
↓
Allocate (keep defaults)
↓
✅ New IP: 15.206.XX.XX
```

---

### **Step 2: Associate (1 min)**

```
Select new Elastic IP
↓
Actions → "Associate Elastic IP address"
↓
Instance: korakagaz-backend-server (select from dropdown)
↓
Associate
↓
✅ Done! IP attached
```

---

### **Step 3: Update DNS (2 min)**

```
Domain provider (Hostinger/GoDaddy/etc.) में login करो
↓
DNS Settings / DNS Management
↓
A Record edit करो:

Name: server
Type: A
Value: 13.204.77.226 → NEW_ELASTIC_IP ✅
TTL: 300

↓
Save
↓
Wait 5-10 minutes
```

---

### **Step 4: Test (1 min)**

```bash
# DNS check
nslookup server.korakagazindia.com

# Should show new IP

# Test SSH
ssh -i key.pem ubuntu@NEW_ELASTIC_IP

# Test API
curl https://server.korakagazindia.com/health
```

---

## ✅ Benefits:

```
✅ Reboot से IP change नहीं होगा
✅ SSH command same रहेगी
✅ DNS update की जरूरत नहीं (future में)
✅ Zero downtime
✅ FREE (running instance के साथ)
```

---

## 📋 Quick Checklist:

- [ ] AWS Console → Elastic IPs → Allocate
- [ ] Associate with korakagaz-backend-server
- [ ] Note down new IP
- [ ] DNS में A record update करो
- [ ] 10 minutes wait करो
- [ ] Test: `nslookup server.korakagazindia.com`
- [ ] Test: Login on frontend

---

## 🎯 Result:

**अब आपका IP permanent है!**

Reboot, Stop, Start - कुछ भी करो, IP same रहेगा! 🚀

---

**Detailed guide:** `ELASTIC-IP-SETUP.md` में पूरी details हैं.


