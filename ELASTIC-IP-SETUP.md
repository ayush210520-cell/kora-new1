# 🌐 Elastic IP Setup Guide - Step by Step

## 🎯 क्या है Elastic IP?

**Elastic IP = Permanent Public IP Address**

- ✅ Reboot करने पर same रहता है
- ✅ Stop/Start करने पर same रहता है
- ✅ Instance change करने पर भी transfer कर सकते हो
- ✅ **FREE** है जब तक instance running है

---

## 💰 Pricing:

```
✅ FREE - जब Elastic IP किसी running instance से attached है
❌ $0.005/hour (~$3.60/month) - अगर allocated है लेकिन attached नहीं
❌ $0.005/hour - अगर instance stopped है लेकिन IP attached है
```

**Bottom line:** Running instance के साथ bilkul FREE! 🎉

---

## 🚀 Setup Steps

### **Step 1: AWS Console खोलो**

```
1. AWS Console → https://console.aws.amazon.com
2. EC2 Dashboard
3. Left sidebar में "Elastic IPs" (Network & Security section)
```

---

### **Step 2: Allocate Elastic IP**

```
1. Orange button "Allocate Elastic IP address" click करो

2. Configuration:
   ┌─────────────────────────────────────────────┐
   │ Network Border Group:                       │
   │ ▼ ap-south-1                                │
   │                                             │
   │ Public IPv4 address pool:                   │
   │ ⦿ Amazon's pool of IPv4 addresses          │
   │ ○ Customer owned pool of IPv4 addresses    │
   │                                             │
   │ Tags (Optional):                            │
   │ Key: Name                                   │
   │ Value: korakagaz-backend-elastic-ip         │
   └─────────────────────────────────────────────┘

3. "Allocate" button click करो
```

**Result:**
```
✅ Success! Allocated Elastic IP: 15.206.XX.XX
```

---

### **Step 3: Associate with Instance**

```
1. New Elastic IP को select करो (checkbox)

2. ऊपर "Actions" dropdown
   ↓
3. "Associate Elastic IP address" select करो

4. Configuration:
   ┌─────────────────────────────────────────────┐
   │ Resource type:                              │
   │ ⦿ Instance                                  │
   │ ○ Network interface                         │
   │                                             │
   │ Instance:                                   │
   │ ▼ i-0b753262e179f871a                      │
   │   (korakagaz-backend-server)               │
   │                                             │
   │ Private IP address:                         │
   │ ▼ 172.31.13.171 (auto-selected)            │
   │                                             │
   │ ☑ Allow this Elastic IP address to be      │
   │   reassociated                              │
   └─────────────────────────────────────────────┘

5. "Associate" button click करो
```

**Result:**
```
✅ Successfully associated!
Old IP: 13.204.77.226 (released back to AWS)
New IP: 15.206.XX.XX (Your permanent Elastic IP)
```

---

### **Step 4: Instance Details Verify करो**

```
1. EC2 → Instances → korakagaz-backend-server

2. Details में check करो:
   Public IPv4 address: 15.206.XX.XX
   Elastic IP address: 15.206.XX.XX ✅
```

---

### **Step 5: DNS Update करो**

**अब domain DNS settings update करनी होंगी:**

#### **Option A: अगर Hostinger/GoDaddy/Namecheap से domain है:**

```
1. Domain provider की website पर login करो

2. DNS Management / DNS Settings में जाओ

3. "A Record" ढूंढो जो "server" subdomain के लिए है:
   
   Before:
   ┌──────┬────────┬─────────────────┬─────┐
   │ Type │ Name   │ Value           │ TTL │
   ├──────┼────────┼─────────────────┼─────┤
   │ A    │ server │ 13.204.77.226   │ 300 │
   └──────┴────────┴─────────────────┴─────┘

   After:
   ┌──────┬────────┬─────────────────┬─────┐
   │ Type │ Name   │ Value           │ TTL │
   ├──────┼────────┼─────────────────┼─────┤
   │ A    │ server │ 15.206.XX.XX    │ 300 │
   └──────┴────────┴─────────────────┴─────┘
                    ↑ New Elastic IP

4. Save/Update करो

5. Wait 5-10 minutes for DNS propagation
```

#### **Option B: अगर AWS Route 53 use कर रहे हो:**

```
1. AWS Console → Route 53

2. Hosted zones → korakagazindia.com select करो

3. "server.korakagazindia.com" record ढूंढो

4. Edit करो:
   - Value: 13.204.77.226 → NEW_ELASTIC_IP
   - Save

5. Changes automatically propagate (1-2 minutes)
```

---

### **Step 6: Test करो**

#### **6.1: DNS Propagation Check:**

```bash
# Terminal में
nslookup server.korakagazindia.com

# Should show new Elastic IP
```

#### **6.2: SSH Test:**

```bash
# New IP से connect करो
ssh -i ~/Downloads/korakagaz-backend-key.pem ubuntu@NEW_ELASTIC_IP
```

#### **6.3: API Test:**

```bash
# Health check
curl https://server.korakagazindia.com/health
```

---

## 🔍 Verify करने के तरीके:

### **Method 1: AWS Console**
```
EC2 → Instances → korakagaz-backend-server
Details tab में:
- Elastic IP: Should show your new IP ✅
```

### **Method 2: Terminal**
```bash
# Check DNS resolution
dig server.korakagazindia.com +short
# Should return: NEW_ELASTIC_IP

# Test SSH
ssh -i key.pem ubuntu@NEW_ELASTIC_IP "echo 'Connected!'"
```

### **Method 3: Browser**
```
https://server.korakagazindia.com/health
# Should return: {"status":"healthy",...}
```

---

## 🎯 Benefits After Setup:

### **Before (Without Elastic IP):**
```
Reboot instance
  ↓
IP changes from 13.204.77.226 → 52.66.XX.XX
  ↓
❌ Frontend can't connect
❌ DNS needs update
❌ SSH command needs new IP
❌ Downtime: 10-30 minutes
```

### **After (With Elastic IP):**
```
Reboot instance (even 10 times!)
  ↓
IP stays: 15.206.XX.XX → 15.206.XX.XX
  ↓
✅ Frontend works instantly
✅ DNS stays same
✅ SSH command same
✅ Downtime: 0 minutes
```

---

## 📱 SSH Command Update:

### **Old command:**
```bash
ssh -i key.pem ubuntu@13.204.77.226
```

### **New command (After Elastic IP):**
```bash
ssh -i key.pem ubuntu@NEW_ELASTIC_IP
```

### **Or better - Update connect script:**
```bash
# Edit connect-to-server.sh में IP update करो
# Line बदलो:
ssh ubuntu@13.204.77.226 → ssh ubuntu@NEW_ELASTIC_IP
```

---

## ⚠️ Important Notes:

### **1. One-time DNS Update Required:**
```
✅ Elastic IP setup के बाद
✅ DNS में नया IP update करो
✅ 5-10 minutes wait करो
✅ फिर forever same रहेगा!
```

### **2. Never Release Elastic IP:**
```
❌ Don't click "Release Elastic IP address"
❌ Don't disassociate from instance
✅ Keep it attached to instance
```

### **3. If Instance Stopped:**
```
⚠️ Charges होंगे: $0.005/hour
💡 Solution: Don't stop instance, use reboot instead
```

---

## 🛡️ Best Practices:

### **1. Add Name Tag:**
```
Elastic IP में tag add करो:
Name: korakagaz-backend-production-ip
Environment: production
```

### **2. Document It:**
```
README में save करो:
Production Elastic IP: 15.206.XX.XX
Associated with: korakagaz-backend-server
```

### **3. Monitor Usage:**
```
CloudWatch में alert set करो अगर:
- IP disassociated हो जाए
- Instance stopped हो जाए
```

---

## 🆘 Troubleshooting:

### **Problem: SSH काम नहीं कर रहा**
```
Solution:
1. Security Group में new IP allowed है check करो
2. Wait 2-3 minutes after association
3. Try: ssh -vvv -i key.pem ubuntu@NEW_IP
```

### **Problem: Domain resolve नहीं हो रहा**
```
Solution:
1. DNS provider में A record update करो
2. Wait 5-10 minutes for propagation
3. Clear DNS cache: sudo dscacheutil -flushcache (Mac)
4. Test: nslookup server.korakagazindia.com
```

### **Problem: Frontend timeout हो रहा**
```
Solution:
1. DNS propagation wait करो (10 mins max)
2. Hard refresh: Cmd+Shift+R (Mac) या Ctrl+Shift+R (Windows)
3. Clear browser cache
```

---

## ✅ Checklist:

Setup complete होने के बाद check करो:

- [ ] Elastic IP allocated
- [ ] Elastic IP associated with instance
- [ ] Instance details में Elastic IP दिख रहा है
- [ ] DNS A record updated
- [ ] DNS propagation complete (nslookup test)
- [ ] SSH काम कर रहा है new IP से
- [ ] `curl https://server.korakagazindia.com/health` काम कर रहा
- [ ] Frontend login काम कर रहा
- [ ] IP documented in README/notes

---

## 📞 Quick Commands:

```bash
# Check current instance IP
aws ec2 describe-instances --instance-ids i-0b753262e179f871a \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text

# Check DNS
nslookup server.korakagazindia.com
dig server.korakagazindia.com +short

# Test SSH
ssh -i key.pem ubuntu@NEW_IP "hostname && curl -s localhost:3001/health"

# Test API
curl https://server.korakagazindia.com/health
```

---

## 🎉 Done!

अब आपका server एक **permanent IP** से accessible है!

**Reboot kitni bhi baar करो - IP same रहेगा!** 🚀

---

## 📖 Next Steps:

1. ✅ Elastic IP setup (this guide)
2. ✅ DNS update
3. ✅ Test everything
4. ✅ Sleep peacefully - no more IP change issues! 😴


