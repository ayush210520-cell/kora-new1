# 🔥 SSH Connection Failed - Quick Fix

## ⚡ 99% यह Problem है:

### **Public IP Change हो गया है!**

Jab bhi aap EC2 reboot karte ho, **Public IP change ho jaata hai** (unless you have Elastic IP).

---

## ✅ Fix (2 Minutes):

### **Step 1: AWS Console में नया IP देखें**

1. AWS Console खोलें: https://console.aws.amazon.com
2. EC2 Dashboard में जाएं
3. "Instances" click करें
4. अपना instance select करें
5. **Public IPv4 address** copy करें (यह नया होगा!)

### **Step 2: नए IP से connect करें**

```bash
# अपना .pem key file और नया IP डालें:
ssh -i /path/to/your-key.pem ubuntu@NEW-PUBLIC-IP

# Example:
ssh -i ~/Downloads/kora-key.pem ubuntu@13.127.45.123
```

**बस! हो गया! 🎉**

---

## 🔍 Diagnostic Tool Use करें:

मैंने एक script बनाया है जो automatically check करेगा क्या problem है:

```bash
cd /Users/ayushsolanki/Desktop/kora
./test-ec2-connection.sh
```

यह आपसे पूछेगा:
- EC2 IP
- Key file path
- Username

और बता देगा exactly क्या problem है! 🔧

---

## 🛡️ Future के लिए - Elastic IP Setup करें:

**Elastic IP लेने से IP कभी change नहीं होगा:**

1. AWS Console → EC2 → "Elastic IPs" (left sidebar)
2. "Allocate Elastic IP address" button
3. "Allocate" click करें
4. New IP select करें → "Actions" → "Associate Elastic IP"
5. अपना instance select करें
6. "Associate" click करें

**Done!** अब IP permanent है! 🎯

---

## 📋 Other Common Fixes:

### Fix 1: Key Permissions
```bash
chmod 400 /path/to/your-key.pem
```

### Fix 2: Security Group Check
AWS Console में:
- Security Groups → आपका SG select करें
- Inbound Rules में देखें:
  - Type: SSH
  - Port: 22
  - Source: 0.0.0.0/0 (या My IP)

### Fix 3: Instance Running है?
AWS Console में:
- Instance State = "Running" (green)
- Status Checks = "2/2 checks passed"

---

## 🆘 Emergency: Browser से Login करें

अगर SSH bilkul काम नहीं कर रहा:

1. AWS Console → EC2 → Instances
2. Instance select करें
3. "Connect" button (top right)
4. "Session Manager" tab
5. "Connect" button

Browser में terminal खुल जाएगा! 💻

---

## 📞 Quick Help Commands:

```bash
# Test if port 22 is open
nc -zv YOUR-EC2-IP 22

# Verbose SSH for debugging
ssh -vvv -i key.pem ubuntu@YOUR-IP

# Test key permissions
ls -la /path/to/key.pem
# Should show: -r-------- (400 permissions)
```

---

## 🎯 Most Likely Solution:

**95% cases में यही होता है:**

1. ✅ AWS Console खोलो
2. ✅ नया Public IP copy करो  
3. ✅ `ssh -i key.pem ubuntu@NEW-IP` run करो

**Done!** 🚀

---

**Detailed guide:** `Backend/TROUBLESHOOT-SSH.md` में है पूरी details के साथ.

