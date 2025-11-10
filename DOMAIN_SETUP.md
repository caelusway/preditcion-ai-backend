# Connect Port 3000 to Domain - Easy Setup Guide

## Option 1: Using Nginx (Recommended - 5 minutes)

### Step 1: Install Nginx
```bash
sudo apt update
sudo apt install nginx -y
```

### Step 2: Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/api
```

Paste this configuration:
```
nginx
server {
    listen 80;
    server_name decentralabs.tech www.decentralabs.tech;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 3: Enable the Configuration
```bash
sudo ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 4: Done!
Your API is now accessible at:
- http://decentralabs.tech
- http://decentralabs.tech/health
- http://decentralabs.tech/docs

---

## Option 2: Add SSL with Certbot (HTTPS) - 2 more minutes

### Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Get SSL Certificate (Free)
```bash
sudo certbot --nginx -d decentralabs.tech -d www.decentralabs.tech
```

Follow the prompts and done! Your API will be available at:
- https://decentralabs.tech ✅
- https://decentralabs.tech/health ✅
- https://decentralabs.tech/docs ✅

Certbot automatically:
- Gets SSL certificate
- Updates Nginx config
- Sets up auto-renewal

---

## Option 3: Direct Access (No Nginx)

If you don't want to use Nginx, just open port 3000 in your firewall:

```bash
# Allow port 3000
sudo ufw allow 3000

# Or if using iptables
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

Then access your API at:
- http://decentralabs.tech:3000
- http://your-server-ip:3000

**Note:** This is not recommended for production as you won't have SSL/HTTPS.

---

## Troubleshooting

### Check if Nginx is running
```bash
sudo systemctl status nginx
```

### Check Nginx configuration
```bash
sudo nginx -t
```

### View Nginx logs
```bash
sudo tail -f /var/log/nginx/error.log
```

### Check if your app is running on port 3000
```bash
pm2 status
curl http://localhost:3000/health
```

### Restart everything
```bash
pm2 restart all
sudo systemctl restart nginx
```

### Check DNS
Make sure your domain points to your server IP:
```bash
dig decentralabs.tech
# or
nslookup decentralabs.tech
```

---

## Quick Commands Reference

```bash
# Start Nginx
sudo systemctl start nginx

# Stop Nginx
sudo systemctl stop nginx

# Restart Nginx
sudo systemctl restart nginx

# Reload Nginx (no downtime)
sudo systemctl reload nginx

# Check if port 3000 is open
sudo netstat -tulpn | grep :3000

# Test API from server
curl http://localhost:3000/health
```

---

## One-Command Setup (Copy & Paste)

Run this on your server:

```bash
# Install Nginx
sudo apt update && sudo apt install nginx -y

# Create config
sudo tee /etc/nginx/sites-available/api > /dev/null <<EOF
server {
    listen 80;
    server_name decentralabs.tech www.decentralabs.tech;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable and restart
sudo ln -sf /etc/nginx/sites-available/api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

echo "✅ Done! Your API is now accessible at http://decentralabs.tech"
```

Then optionally add SSL:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d decentralabs.tech -d www.decentralabs.tech
```

That's it! 🚀
