# Deployment Guide

Complete guide for deploying the Image Upload System to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Security Configuration](#security-configuration)
4. [Deployment Options](#deployment-options)
5. [Database Setup](#database-setup)
6. [Storage Configuration](#storage-configuration)
7. [SSL/HTTPS Setup](#sslhttps-setup)
8. [Monitoring & Logging](#monitoring--logging)
9. [Scaling Recommendations](#scaling-recommendations)
10. [Performance Optimization](#performance-optimization)
11. [Backup Strategy](#backup-strategy)
12. [Maintenance](#maintenance)

---

## Prerequisites

### System Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB
- Node.js: 18+
- Operating System: Linux (Ubuntu 20.04+ recommended)

**Recommended:**
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 100GB+ SSD
- Node.js: 20+
- Operating System: Linux (Ubuntu 22.04+ LTS)

### Software Requirements

- **Node.js** 18+ ([Install Guide](https://nodejs.org/en/download/package-manager))
- **npm** 9+ (comes with Node.js)
- **Git** 2.x+
- **PM2** (for process management)
- **Nginx** (recommended reverse proxy)
- **PostgreSQL** or **MongoDB** (if using database)

### Network Requirements

- Public IP address
- Domain name (recommended)
- SSL certificate (required for production)
- Open ports: 80 (HTTP), 443 (HTTPS), 22 (SSH)

---

## Environment Setup

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Git
sudo apt install -y git

# Verify installations
node --version  # Should be 18+
npm --version   # Should be 9+
pm2 --version
nginx -v
```

### 2. Clone Repository

```bash
# Clone repository
cd /var/www
sudo git clone <repository-url> dogepump
cd dogepump

# Set proper permissions
sudo chown -R $USER:$USER /var/www/dogepump
```

### 3. Install Dependencies

```bash
# Install Node.js dependencies
npm ci --production

# Create upload directories
mkdir -p uploads/temp uploads/permanent
chmod 755 uploads uploads/temp uploads/permanent
```

### 4. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit environment file
nano .env
```

**Production Environment Variables:**

```env
# Server Configuration
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=warn

# CORS (Your domain)
CORS_ORIGIN=https://yourdomain.com

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp
UPLOAD_DIR=/var/www/dogepump/uploads

# Image Processing
IMAGE_QUALITY_HIGH=90
IMAGE_QUALITY_MEDIUM=75
IMAGE_QUALITY_LOW=60
IMAGE_SIZE_THUMBNAIL=150
IMAGE_SIZE_SMALL=300
IMAGE_SIZE_MEDIUM=500
IMAGE_SIZE_LARGE=1200
IMAGE_SIZE_EXTRA_LARGE=1920
IMAGE_ALLOWED_FORMATS=jpeg,png,webp,avif
IMAGE_DEFAULT_FORMAT=webp
IMAGE_MAX_WIDTH=4096
IMAGE_MAX_HEIGHT=4096
IMAGE_MIN_WIDTH=32
IMAGE_MIN_HEIGHT=32
IMAGE_PROGRESSIVE=true
IMAGE_STRIP_METADATA=true

# JWT Secrets (USE STRONG RANDOM STRINGS!)
JWT_SECRET=<generate-32-char-random-string>
JWT_REFRESH_SECRET=<generate-32-char-random-string>
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Authentication
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBER=true
PASSWORD_REQUIRE_SPECIAL=false
USERNAME_MIN_LENGTH=3
USERNAME_MAX_LENGTH=20
BCRYPT_ROUNDS=12
MAX_SESSIONS_PER_USER=5

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Storage Configuration
STORAGE_BACKEND=local
STORAGE_BASE_PATH=/var/www/dogepump/uploads
STORAGE_MAX_SIZE=107374182400
STORAGE_TEMP_TTL=86400000
STORAGE_ENABLE_DEDUPLICATION=true
STORAGE_CLEANUP_INTERVAL=3600000
STORAGE_MAX_FILE_SIZE=52428800

# Security Configuration
SECURITY_MAX_FILE_SIZE=10485760
SECURITY_MAX_WIDTH=4096
SECURITY_MAX_HEIGHT=4096
SECURITY_MIN_WIDTH=32
SECURITY_MIN_HEIGHT=32
SECURITY_MIN_ASPECT_RATIO=0.1
SECURITY_MAX_ASPECT_RATIO=10
SECURITY_ENABLE_MALWARE_DETECTION=true
SECURITY_ENABLE_XSS_DETECTION=true
SECURITY_ENABLE_EXIF_VALIDATION=true
SECURITY_ENABLE_MAGIC_NUMBER_VALIDATION=true
SECURITY_STRIP_METADATA=true
SECURITY_CSP_ENABLED=true
SECURITY_HEADERS_ENABLED=true
SECURITY_ENABLE_AUDIT_LOGGING=true
SECURITY_AUDIT_LOG_RETENTION_DAYS=30
SECURITY_VALIDATE_FILE_SIGNATURE=true
SECURITY_VALIDATE_CONTENT_TYPE=true
SECURITY_VALIDATE_DIMENSIONS=true
SECURITY_VALIDATE_ASPECT_RATIO=true
SECURITY_SANITIZE_INPUTS=true
SECURITY_SANITIZE_FILENAMES=true
SECURITY_SANITIZE_URL_PARAMS=true

# S3/MinIO Configuration (if using cloud storage)
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=<your-access-key>
S3_SECRET_ACCESS_KEY=<your-secret-key>
S3_BUCKET=your-bucket-name
S3_USE_SSL=true
```

**Generate Strong Secrets:**

```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Security Configuration

### 1. Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Check status
sudo ufw status
```

### 2. Security Headers

Configure Nginx to add security headers:

```nginx
# /etc/nginx/sites-available/dogepump
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Other configuration...
}
```

### 3. File Permissions

```bash
# Set proper permissions for uploads directory
sudo chown -R www-data:www-data /var/www/dogepump/uploads
sudo chmod -R 755 /var/www/dogepump/uploads

# For additional security, make uploads directory not executable
sudo chmod -R 644 /var/www/dogepump/uploads/*
```

### 4. Environment File Security

```bash
# Restrict .env file permissions
chmod 600 .env
chown $USER:$USER .env

# Add to .gitignore if not already
echo ".env" >> .gitignore
```

---

## Deployment Options

### Option 1: PM2 (Recommended)

PM2 provides process management, automatic restarts, and logging.

```bash
# Start backend with PM2
pm2 start npm --name "dogepump-backend" -- start server

# Start frontend with PM2
pm2 start npm --name "dogepump-frontend" -- start preview

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions output by the command

# Monitor processes
pm2 monit

# View logs
pm2 logs dogepump-backend
pm2 logs dogepump-frontend

# Restart processes
pm2 restart dogepump-backend
pm2 restart dogepump-frontend

# Stop processes
pm2 stop dogepump-backend
pm2 stop dogepump-frontend
```

**PM2 Ecosystem File (`ecosystem.config.js`):**

```javascript
module.exports = {
  apps: [
    {
      name: 'dogepump-backend',
      script: 'npm',
      args: 'start server',
      cwd: '/var/www/dogepump',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'dogepump-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/dogepump',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
```

**Start with Ecosystem File:**

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 2: Systemd Service

Create systemd service for automatic startup.

```bash
# Create service file
sudo nano /etc/systemd/system/dogepump.service
```

**Service File Content:**

```ini
[Unit]
Description=Dogepump Backend Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/dogepump
ExecStart=/usr/bin/npm start server
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=dogepump
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

**Enable and Start Service:**

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable dogepump

# Start service
sudo systemctl start dogepump

# Check status
sudo systemctl status dogepump

# View logs
sudo journalctl -u dogepump -f

# Restart service
sudo systemctl restart dogepump

# Stop service
sudo systemctl stop dogepump
```

### Option 3: Docker (Optional)

Create `Dockerfile`:

```dockerfile
# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create upload directories
RUN mkdir -p uploads/temp uploads/permanent

# Expose port
EXPOSE 3001

# Start application
CMD ["npm", "start", "server"]
```

**Docker Compose (`docker-compose.yml`):**

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3001:3001"
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
      - PORT=3001
    restart: unless-stopped
```

**Run with Docker:**

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Database Setup

### PostgreSQL Setup

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql
```

```sql
-- Create database
CREATE DATABASE dogepump;

-- Create user
CREATE USER dogepump_user WITH PASSWORD 'strong_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE dogepump TO dogepump_user;

-- Exit
\q
```

**Configure Database Connection:**

```env
# In .env file
DATABASE_URL=postgresql://dogepump_user:strong_password@localhost:5432/dogepump
```

### MongoDB Setup

```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Configure Database Connection:**

```env
# In .env file
DATABASE_URL=mongodb://localhost:27017/dogepump
```

### Database Migration

```bash
# Run migrations (if using migration tool)
npm run migrate

# Or seed database
npm run seed
```

---

## Storage Configuration

### Local Storage

Default configuration uses local filesystem.

**Directory Structure:**

```
/var/www/dogepump/uploads/
├── temp/           # Temporary files (auto-cleanup)
│   └── user_id/
│       └── timestamp_filename.jpg
└── permanent/       # Permanent files
    └── user_id/
        └── timestamp_filename.jpg
```

**Storage Management:**

```bash
# Monitor storage usage
du -sh /var/www/dogepump/uploads

# Clean up old temporary files manually
find /var/www/dogepump/uploads/temp -type f -mtime +1 -delete

# Set up automatic cleanup cron job
crontab -e
```

**Add to Crontab:**

```cron
# Clean up temp files older than 24 hours every hour
0 * * * * find /var/www/dogepump/uploads/temp -type f -mtime +1 -delete
```

### S3/MinIO Setup

For distributed storage, use S3 or MinIO.

#### AWS S3 Setup

1. **Create S3 Bucket:**

```bash
# Using AWS CLI
aws s3 mb s3://your-bucket-name

# Set bucket policy for public read access
aws s3api put-bucket-policy --bucket your-bucket-name --policy file://policy.json
```

**Policy File (`policy.json`):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

2. **Configure Environment:**

```env
STORAGE_BACKEND=s3
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
S3_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_BUCKET=your-bucket-name
S3_USE_SSL=true
```

#### MinIO Setup

1. **Install MinIO:**

```bash
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# Create data directory
mkdir -p /data/minio
```

2. **Start MinIO:**

```bash
minio server /data/minio --console-address ":9001"
```

3. **Configure Environment:**

```env
STORAGE_BACKEND=minio
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=dogepump-uploads
S3_USE_SSL=false
```

---

## SSL/HTTPS Setup

### Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com

# Follow the prompts to configure Nginx

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

### Manual SSL Certificate

```bash
# Copy SSL certificates
sudo cp /path/to/your-cert.crt /etc/ssl/certs/
sudo cp /path/to/your-key.key /etc/ssl/private/

# Set proper permissions
sudo chmod 644 /etc/ssl/certs/your-cert.crt
sudo chmod 600 /etc/ssl/private/your-key.key
```

### Nginx SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/your-cert.crt;
    ssl_certificate_key /etc/ssl/private/your-key.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy to backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeout for large file uploads
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Serve static files
    location / {
        root /var/www/dogepump/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Monitoring & Logging

### Application Monitoring

**PM2 Monitoring:**

```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs

# Log management
pm2 install pm2-logrotate
```

**System Monitoring:**

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Monitor system resources
htop
```

### Log Management

**Configure Log Rotation:**

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/dogepump
```

**Logrotate Configuration:**

```
/var/www/dogepump/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Error Tracking

**Sentry Integration:**

```bash
# Install Sentry
npm install @sentry/node

# Configure Sentry
# In server/index.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: 'https://example@sentry.io/123456',
  environment: process.env.NODE_ENV,
});
```

---

## Scaling Recommendations

### Horizontal Scaling

**Load Balancer Setup:**

```nginx
upstream backend {
    least_conn;
    server 10.0.0.1:3001;
    server 10.0.0.2:3001;
    server 10.0.0.3:3001;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    location /api/ {
        proxy_pass http://backend;
        # ... other proxy settings
    }
}
```

**PM2 Cluster Mode:**

```bash
# Start multiple instances
pm2 start npm --name "dogepump-backend" -- start server -i max

# Or specify number of instances
pm2 start npm --name "dogepump-backend" -- start server -i 4
```

### Vertical Scaling

**Increase Resources:**

```bash
# Check current resources
free -h
df -h
lscpu

# Upgrade server resources via cloud provider
```

### Database Scaling

**Read Replicas:**

```sql
-- PostgreSQL read replica setup
-- Configure master-slave replication
```

**Connection Pooling:**

```javascript
// Use connection pooling
const { Pool } = require('pg');

const pool = new Pool({
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Caching Layer

**Redis Setup:**

```bash
# Install Redis
sudo apt install -y redis-server

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis
```

**Use Redis for Caching:**

```javascript
// Cache frequently accessed images
import Redis from 'ioredis';

const redis = new Redis();

// Cache image metadata
await redis.setex(`image:${imageId}`, 3600, JSON.stringify(metadata));
```

---

## Performance Optimization

### Image Optimization

```env
# Optimize image quality settings
IMAGE_QUALITY_HIGH=85
IMAGE_QUALITY_MEDIUM=70
IMAGE_QUALITY_LOW=55

# Enable progressive loading
IMAGE_PROGRESSIVE=true

# Strip metadata
IMAGE_STRIP_METADATA=true
```

### Nginx Optimization

```nginx
# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

# Enable caching
location ~* \.(jpg|jpeg|png|gif|webp|avif)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Node.js Optimization

```javascript
// Increase memory limit
node --max-old-space-size=4096 server/index.js

// Use worker threads for CPU-intensive tasks
```

---

## Backup Strategy

### Database Backup

**PostgreSQL Backup:**

```bash
# Create backup script
nano /usr/local/bin/backup-db.sh
```

**Backup Script:**

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/var/backups/postgresql
mkdir -p $BACKUP_DIR

pg_dump -U dogepump_user dogepump | gzip > $BACKUP_DIR/dogepump_$DATE.sql.gz

# Keep last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

**Schedule with Cron:**

```cron
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-db.sh
```

**MongoDB Backup:**

```bash
# Create backup script
mongodump --uri="mongodb://localhost:27017/dogepump" --out=/var/backups/mongodb/$(date +%Y%m%d)
```

### File Backup

```bash
# Backup uploads directory
rsync -avz /var/www/dogepump/uploads/ /var/backups/uploads/$(date +%Y%m%d)/

# Or use tar
tar -czf /var/backups/uploads_$(date +%Y%m%d).tar.gz /var/www/dogepump/uploads/
```

### Offsite Backup

```bash
# Sync to S3
aws s3 sync /var/backups/ s3://your-backup-bucket/

# Or use rclone for other cloud providers
rclone sync /var/backups/ remote:backups/
```

---

## Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Review logs for errors
- Check disk usage
- Update security patches
- Review security events

**Monthly:**
- Rotate JWT secrets
- Review and update dependencies
- Test backup restoration
- Performance audit

**Quarterly:**
- Security audit
- Capacity planning
- Disaster recovery test

### Dependency Updates

```bash
# Check for outdated packages
npm outdated

# Update dependencies
npm update

# Audit for security vulnerabilities
npm audit
npm audit fix
```

### Log Cleanup

```bash
# Clean up old logs
find /var/www/dogepump/logs -name "*.log" -mtime +30 -delete

# Or use logrotate (configured above)
```

### Health Checks

```bash
# Create health check script
nano /usr/local/bin/health-check.sh
```

**Health Check Script:**

```bash
#!/bin/bash

# Check if backend is running
if ! pm2 status dogepump-backend | grep -q "online"; then
    echo "Backend is down, restarting..."
    pm2 restart dogepump-backend
fi

# Check if frontend is running
if ! pm2 status dogepump-frontend | grep -q "online"; then
    echo "Frontend is down, restarting..."
    pm2 restart dogepump-frontend
fi

# Check disk space
DISK_USAGE=$(df /var/www/dogepump | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "Warning: Disk usage is ${DISK_USAGE}%"
fi
```

**Schedule Health Checks:**

```cron
# Every 5 minutes
*/5 * * * * /usr/local/bin/health-check.sh
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Server prepared with required software
- [ ] Environment variables configured
- [ ] JWT secrets generated and secured
- [ ] Database installed and configured
- [ ] Upload directories created with proper permissions
- [ ] SSL certificate obtained
- [ ] Firewall configured
- [ ] Nginx configured
- [ ] Backup strategy in place
- [ ] Monitoring set up

### Post-Deployment

- [ ] Application started successfully
- [ ] All endpoints responding
- [ ] SSL certificate working
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Health checks passing
- [ ] Backup tested
- [ ] Monitoring alerts configured

---

## Troubleshooting

For common deployment issues, see [Troubleshooting Guide](./TROUBLESHOOTING.md).

---

## Additional Resources

- [Complete System Documentation](./server/IMAGE_UPLOAD_SYSTEM.md)
- [Quick Start Guide](./QUICKSTART.md)
- [API Reference](./server/API_REFERENCE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
