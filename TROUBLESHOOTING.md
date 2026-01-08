# Troubleshooting Guide

Comprehensive troubleshooting guide for the Image Upload System.

## Table of Contents

1. [Common Issues](#common-issues)
   - [Console Warnings & Known Issues](#console-warnings--known-issues)
   - [Port Already in Use](#issue-port-already-in-use)
2. [Installation Issues](#installation-issues)
3. [Runtime Issues](#runtime-issues)
4. [Performance Issues](#performance-issues)
5. [Security Issues](#security-issues)
6. [Storage Issues](#storage-issues)
7. [Network Issues](#network-issues)
8. [Debugging Tips](#debugging-tips)
9. [Performance Optimization](#performance-optimization)

---

## Common Issues

### Console Warnings & Known Issues

These are non-critical console messages that you may see during development:

#### Issue: Pool Service Warning

**Symptoms:**
```
[PoolService] Pool not deployed yet - set POOL_ADDRESS in poolPriceService.ts
```

**Cause:**
- The DC/wDOGE liquidity pool hasn't been deployed yet
- This is expected behavior during development before pool deployment

**Solution:**
- This warning now appears only once per session
- To resolve: Deploy your DC/wDOGE pool and update the `POOL_ADDRESS` in `services/poolPriceService.ts`
- For more information, see the file header comments in `poolPriceService.ts`

**File:** `services/poolPriceService.ts:82`

---

#### Issue: RSS Feed CORS Errors

**Symptoms:**
```
Access to fetch at 'https://api.allorigins.win/raw?url=...' has been blocked by CORS policy
Failed to fetch RSS feed from...
```

**Cause:**
- External RSS feeds may be temporarily unavailable
- CORS proxies can be flaky
- Network connectivity issues

**Solution:**
- These errors are now handled silently to reduce console noise
- The crypto news feature uses multiple fallback CORS proxies
- RSS feeds are optional - the platform functions without them
- If needed, you can configure alternative RSS sources in `services/cryptoNewsService.ts`

**File:** `services/cryptoNewsService.ts:252`

---

#### Issue: React Grab Warnings

**Symptoms:**
```
computations created outside a `createRoot` or `render` will never be disposed
```

**Cause:**
- Third-party library issue with react-grab v0.0.94
- Not caused by your code

**Solution:**
- This is a harmless warning from the react-grab library
- Can be safely ignored
- Update react-grab when a new version is available

---

#### Issue: MetaMask Provider Error

**Symptoms:**
```
MetaMask encountered an error setting the global Ethereum provider
```

**Cause:**
- Multiple wallet extensions installed (MetaMask, Coinbase Wallet, etc.)
- Extensions competing for the global `window.ethereum` object

**Solution:**
- This is a browser extension conflict, not an application error
- Harmless - your app will work fine
- Disable one of the wallet extensions if you want to eliminate the warning

---

### Issue: Port Already in Use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Causes:**
- Another process is using the port
- Previous server instance didn't shut down properly
- Port is reserved by system service

**Solutions:**

1. **Find and kill the process:**
   ```bash
   # Find process using port 3001
   lsof -i :3001

   # Or use netstat
   netstat -tulpn | grep :3001

   # Kill the process
   kill -9 <PID>
   ```

2. **Use a different port:**
   ```bash
   # In .env file
   PORT=3002
   ```

3. **Restart PM2 if using process manager:**
   ```bash
   pm2 restart dogepump-backend
   ```

---

### Issue: Permission Denied on Upload Directory

**Symptoms:**
```
Error: EACCES: permission denied, mkdir './uploads'
Error: EACCES: permission denied, open './uploads/temp/file.jpg'
```

**Causes:**
- Incorrect directory permissions
- Running as wrong user
- Directory doesn't exist

**Solutions:**

1. **Create directories with proper permissions:**
   ```bash
   # Create directories
   mkdir -p uploads/temp uploads/permanent

   # Set proper permissions
   chmod 755 uploads
   chmod 755 uploads/temp
   chmod 755 uploads/permanent

   # Set ownership (if running as www-data)
   sudo chown -R www-data:www-data uploads
   ```

2. **Run as correct user:**
   ```bash
   # Check current user
   whoami

   # Switch to correct user if needed
   sudo -u www-data npm start server
   ```

3. **Check SELinux/AppArmor (if enabled):**
   ```bash
   # Check SELinux status
   getenforce

   # Temporarily disable for testing (not recommended for production)
   sudo setenforce 0
   ```

---

### Issue: JWT Token Expired

**Symptoms:**
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Token expired"
}
```

**Causes:**
- Access token expired (15 minutes default)
- Refresh token expired (7 days default)
- Clock synchronization issues

**Solutions:**

1. **Refresh the token:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{
       "refreshToken": "<your-refresh-token>"
     }'
   ```

2. **Login again:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "password": "password"
     }'
   ```

3. **Check system clock:**
   ```bash
   # Check system time
   date

   # Sync with NTP server
   sudo ntpdate pool.ntp.org
   ```

---

### Issue: File Upload Timeout

**Symptoms:**
```
Error: Request timeout
Error: ETIMEDOUT
```

**Causes:**
- File too large for timeout setting
- Slow network connection
- Server processing time exceeded

**Solutions:**

1. **Increase timeout in Nginx:**
   ```nginx
   # In nginx configuration
   location /api/ {
       proxy_connect_timeout 300s;
       proxy_send_timeout 300s;
       proxy_read_timeout 300s;
   }
   ```

2. **Increase timeout in Fastify:**
   ```javascript
   // In server/index.ts
   fastify.addContentTypeParser('multipart/form-data', {
       bodyLimit: 10485760 * 10, // 100MB
       parseAs: 'buffer'
   }, (req, body, done) => {
       done(null, body)
   })
   ```

3. **Optimize image before upload:**
   - Compress images client-side
   - Resize large images before upload
   - Use appropriate format (WebP for web)

---

### Issue: Out of Memory

**Symptoms:**
```
JavaScript heap out of memory
Error: FATAL ERROR: Reached heap limit Allocation failed
```

**Causes:**
- Processing large images
- Memory leak in application
- Insufficient system RAM

**Solutions:**

1. **Increase Node.js memory limit:**
   ```bash
   # Set memory limit to 4GB
   NODE_OPTIONS="--max-old-space-size=4096" npm run server

   # Or in PM2 ecosystem file
   {
     "max_memory_restart": "2G"
   }
   ```

2. **Reduce image processing quality:**
   ```env
   # In .env file
   IMAGE_QUALITY_HIGH=70
   IMAGE_QUALITY_MEDIUM=60
   IMAGE_QUALITY_LOW=50
   ```

3. **Process images in batches:**
   ```javascript
   // Process one image at a time
   for (const image of images) {
       await processImage(image);
       // Allow garbage collection
       await new Promise(resolve => setTimeout(resolve, 100));
   }
   ```

4. **Add swap space:**
   ```bash
   # Create 2GB swap file
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile

   # Make permanent
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```

---

## Installation Issues

### Issue: Sharp Installation Error

**Symptoms:**
```
Error: Cannot find module 'sharp'
Error: /usr/bin/node: cannot execute binary file
```

**Causes:**
- Sharp not installed for current platform
- Missing system dependencies
- Node.js version mismatch

**Solutions:**

1. **Rebuild Sharp:**
   ```bash
   npm rebuild sharp

   # Or reinstall
   npm uninstall sharp
   npm install sharp
   ```

2. **Install system dependencies:**
   ```bash
   # Ubuntu/Debian
   sudo apt install -y libvips-dev

   # CentOS/RHEL
   sudo yum install -y vips-devel

   # macOS
   brew install vips
   ```

3. **Use prebuilt binaries:**
   ```bash
   npm install sharp --ignore-scripts
   ```

---

### Issue: Dependencies Installation Failed

**Symptoms:**
```
npm ERR! code ECONNREFUSED
npm ERR! syscall connect
npm ERR! errno ECONNREFUSED
```

**Causes:**
- Network connectivity issues
- npm registry down
- Firewall blocking npm

**Solutions:**

1. **Check network connection:**
   ```bash
   ping registry.npmjs.org
   ```

2. **Use different npm registry:**
   ```bash
   npm install --registry=https://registry.npm.taobao.org
   ```

3. **Clear npm cache:**
   ```bash
   npm cache clean --force
   ```

4. **Use npm mirror:**
   ```bash
   npm config set registry https://registry.npmjs.org/
   ```

---

### Issue: TypeScript Compilation Error

**Symptoms:**
```
error TS2307: Cannot find module 'sharp'
error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'
```

**Causes:**
- Missing type definitions
- Incorrect TypeScript version
- Type mismatches

**Solutions:**

1. **Install type definitions:**
   ```bash
   npm install --save-dev @types/node @types/sharp
   ```

2. **Check TypeScript version:**
   ```bash
   # Check version
   npx tsc --version

   # Update if needed
   npm install -g typescript@latest
   ```

3. **Fix type errors:**
   ```typescript
   // Example fix
   // Before:
   const quality: number = '75';

   // After:
   const quality: number = 75;
   ```

---

## Runtime Issues

### Issue: Server Not Starting

**Symptoms:**
```
Error: listen EADDRNOTAVAIL: address not available
Error: Server failed to start
```

**Causes:**
- Invalid host address
- Port already in use
- Network configuration issue

**Solutions:**

1. **Check host configuration:**
   ```env
   # In .env file
   HOST=0.0.0.0  # Listen on all interfaces
   # Or specific IP
   HOST=192.168.1.100
   ```

2. **Check port availability:**
   ```bash
   # Check if port is in use
   netstat -tulpn | grep :3001

   # Or use lsof
   lsof -i :3001
   ```

3. **Check firewall:**
   ```bash
   # Check UFW status
   sudo ufw status

   # Allow port if needed
   sudo ufw allow 3001/tcp
   ```

---

### Issue: CORS Errors in Browser

**Symptoms:**
```
Access to XMLHttpRequest has been blocked by CORS policy
No 'Access-Control-Allow-Origin' header is present
```

**Causes:**
- CORS not configured
- Origin not allowed
- Preflight request failed

**Solutions:**

1. **Configure CORS in .env:**
   ```env
   # Allow specific origin
   CORS_ORIGIN=https://yourdomain.com

   # Or allow all origins (not recommended for production)
   CORS_ORIGIN=*
   ```

2. **Check CORS configuration in server:**
   ```javascript
   // In server/index.ts
   fastify.register(cors, {
     origin: process.env.CORS_ORIGIN.split(','),
     credentials: true,
   });
   ```

3. **Check Nginx CORS headers:**
   ```nginx
   # In nginx configuration
   add_header Access-Control-Allow-Origin https://yourdomain.com;
   add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
   add_header Access-Control-Allow-Headers "Authorization, Content-Type";
   add_header Access-Control-Allow-Credentials true;
   ```

---

### Issue: Database Connection Error

**Symptoms:**
```
Error: connect ECONNREFUSED
Error: Connection refused
Error: Authentication failed
```

**Causes:**
- Database not running
- Wrong connection string
- Firewall blocking connection
- Invalid credentials

**Solutions:**

1. **Check if database is running:**
   ```bash
   # PostgreSQL
   sudo systemctl status postgresql

   # MongoDB
   sudo systemctl status mongod

   # Start if not running
   sudo systemctl start postgresql
   ```

2. **Check connection string:**
   ```env
   # In .env file
   DATABASE_URL=postgresql://user:password@localhost:5432/database

   # Or MongoDB
   DATABASE_URL=mongodb://localhost:27017/database
   ```

3. **Test connection:**
   ```bash
   # PostgreSQL
   psql -U user -d database -h localhost

   # MongoDB
   mongo --host localhost --port 27017
   ```

4. **Check firewall:**
   ```bash
   # Allow database port
   sudo ufw allow 5432/tcp  # PostgreSQL
   sudo ufw allow 27017/tcp # MongoDB
   ```

---

## Performance Issues

### Issue: Slow Image Upload

**Symptoms:**
- Uploads take very long time
- Progress bar stuck
- Timeout errors

**Causes:**
- Large file sizes
- Slow network connection
- Server processing bottleneck
- Insufficient resources

**Solutions:**

1. **Optimize images before upload:**
   ```javascript
   // Client-side compression
   const canvas = document.createElement('canvas');
   const ctx = canvas.getContext('2d');
   canvas.width = 1920;
   canvas.height = 1080;
   ctx.drawImage(img, 0, 0, 1920, 1080);
   canvas.toBlob((blob) => {
       // Upload compressed blob
   }, 'image/jpeg', 0.8);
   ```

2. **Increase server resources:**
   ```bash
   # Check CPU usage
   htop

   # Check memory usage
   free -h

   # Upgrade server if needed
   ```

3. **Use CDN for static files:**
   ```nginx
   # In nginx configuration
   location ~* \.(jpg|jpeg|png|gif|webp|avif)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

4. **Enable compression:**
   ```nginx
   # Enable gzip
   gzip on;
   gzip_types image/jpeg image/png image/webp;
   ```

---

### Issue: High CPU Usage

**Symptoms:**
- CPU usage consistently high
- Server slow to respond
- Load average high

**Causes:**
- Image processing intensive
- Infinite loops
- Memory leaks
- Too many concurrent requests

**Solutions:**

1. **Monitor CPU usage:**
   ```bash
   # Check CPU usage
   top
   # Or
   htop
   ```

2. **Optimize image processing:**
   ```javascript
   // Use worker threads for CPU-intensive tasks
   import { Worker } from 'worker_threads';

   const worker = new Worker('./image-processor.js', {
       workerData: { imageBuffer }
   });
   ```

3. **Implement rate limiting:**
   ```javascript
   // Limit concurrent uploads
   const MAX_CONCURRENT_UPLOADS = 5;
   let activeUploads = 0;

   if (activeUploads >= MAX_CONCURRENT_UPLOADS) {
       return reply.status(429).send({
           error: 'Too many concurrent uploads'
       });
   }
   ```

4. **Use caching:**
   ```javascript
   // Cache processed images
   const cache = new Map();
   const cacheKey = `${imageId}_${variant}`;

   if (cache.has(cacheKey)) {
       return cache.get(cacheKey);
   }
   ```

---

### Issue: Memory Leak

**Symptoms:**
- Memory usage increases over time
- Server crashes after running for a while
- Out of memory errors

**Causes:**
- Unclosed connections
- Large objects not garbage collected
- Event listeners not removed
- Circular references

**Solutions:**

1. **Monitor memory usage:**
   ```bash
   # Check memory usage
   free -h

   # Monitor over time
   watch -n 1 free -h
   ```

2. **Use memory profiling:**
   ```javascript
   // Enable memory profiling
   const heapdump = require('heapdump');

   setInterval(() => {
       const filename = `/tmp/heapdump-${Date.now()}.heapsnapshot`;
       heapdump.writeSnapshot(filename, (err, filename) => {
           console.log(`Heap dump written to ${filename}`);
       });
   }, 300000); // Every 5 minutes
   ```

3. **Fix common memory leaks:**
   ```javascript
   // Remove event listeners
   element.removeEventListener('click', handler);

   // Close database connections
   await pool.end();

   // Clear large objects
   largeArray = null;
   ```

4. **Use PM2 memory limit:**
   ```bash
   # Restart when memory exceeds limit
   pm2 start npm --name "app" -- start server --max-memory-restart 1G
   ```

---

## Security Issues

### Issue: File Upload Vulnerability

**Symptoms:**
- Suspicious files uploaded
- Security warnings in logs
- Malware detected

**Causes:**
- File signature validation disabled
- MIME type validation disabled
- Insufficient security checks

**Solutions:**

1. **Enable all security validations:**
   ```env
   # In .env file
   SECURITY_VALIDATE_FILE_SIGNATURE=true
   SECURITY_ENABLE_MALWARE_DETECTION=true
   SECURITY_ENABLE_XSS_DETECTION=true
   SECURITY_VALIDATE_CONTENT_TYPE=true
   SECURITY_VALIDATE_DIMENSIONS=true
   SECURITY_VALIDATE_ASPECT_RATIO=true
   ```

2. **Review security logs:**
   ```bash
   # Check for security events
   pm2 logs dogepump-backend | grep -i security

   # Or check log files
   tail -f logs/security.log
   ```

3. **Implement additional security measures:**
   ```javascript
   // Add virus scanning
   const { exec } = require('child_process');
   exec(`clamscan --no-summary ${filePath}`, (error, stdout, stderr) => {
       if (error) {
           // File infected or scan failed
       }
   });
   ```

---

### Issue: Rate Limiting Too Aggressive

**Symptoms:**
- Legitimate users blocked
- Too many requests errors
- Users unable to upload

**Causes:**
- Rate limit too low
- Shared IP address
- Bot traffic

**Solutions:**

1. **Adjust rate limits:**
   ```env
   # In .env file
   RATE_LIMIT_WINDOW_MS=120000  # 2 minutes
   RATE_LIMIT_MAX_REQUESTS=200   # Increase limit
   ```

2. **Implement IP whitelisting:**
   ```javascript
   // Whitelist trusted IPs
   const WHITELISTED_IPS = ['192.168.1.100', '10.0.0.1'];

   if (WHITELISTED_IPS.includes(request.ip)) {
       // Skip rate limiting
       return next();
   }
   ```

3. **Use CAPTCHA for suspicious requests:**
   ```javascript
   // Implement CAPTCHA for high-frequency requests
   if (requestCount > threshold) {
       return reply.send({
           requireCaptcha: true
       });
   }
   ```

---

## Storage Issues

### Issue: Disk Space Full

**Symptoms:**
- Uploads fail
- "No space left on device" error
- Server becomes unresponsive

**Causes:**
- Too many files uploaded
- Temporary files not cleaned up
- Log files too large
- Insufficient disk space

**Solutions:**

1. **Check disk usage:**
   ```bash
   # Check disk space
   df -h

   # Find large directories
   du -sh /var/www/dogepump/uploads/* | sort -h
   ```

2. **Clean up temporary files:**
   ```bash
   # Remove files older than 24 hours
   find uploads/temp -type f -mtime +1 -delete

   # Or use the cleanup function
   await storageService.cleanupOldImages({
       olderThan: new Date(Date.now() - 86400000),
       temporaryOnly: true
   });
   ```

3. **Clean up log files:**
   ```bash
   # Compress old logs
   find logs -name "*.log" -mtime +7 -exec gzip {} \;

   # Remove old compressed logs
   find logs -name "*.log.gz" -mtime +30 -delete
   ```

4. **Set up automatic cleanup:**
   ```bash
   # Add to crontab
   crontab -e

   # Add this line (runs daily at 2 AM)
   0 2 * * * find /var/www/dogepump/uploads/temp -type f -mtime +1 -delete
   ```

5. **Increase disk space:**
   ```bash
   # Resize disk (cloud provider)
   # Or add additional storage
   ```

---

### Issue: Temporary Files Not Cleaning Up

**Symptoms:**
- Uploads directory keeps growing
- Disk space running out
- Many old temporary files

**Causes:**
- Cleanup interval too long
- Cleanup function not running
- Error in cleanup function

**Solutions:**

1. **Check cleanup configuration:**
   ```env
   # In .env file
   STORAGE_CLEANUP_INTERVAL=3600000  # 1 hour
   STORAGE_TEMP_TTL=86400000       # 24 hours
   ```

2. **Check cleanup logs:**
   ```bash
   # Look for cleanup errors
   pm2 logs dogepump-backend | grep -i cleanup

   # Or check log files
   tail -f logs/cleanup.log
   ```

3. **Manually trigger cleanup:**
   ```javascript
   // Create cleanup endpoint
   fastify.post('/admin/cleanup', async (request, reply) => {
       const result = await storageService.cleanupOldImages({
           olderThan: new Date(Date.now() - 86400000),
           temporaryOnly: true
       });
       return reply.send(result);
   });
   ```

4. **Verify cleanup function:**
   ```javascript
   // Check if cleanup is being called
   setInterval(async () => {
       console.log('Running cleanup...');
       await storageService.cleanupOldImages({
           olderThan: new Date(Date.now() - config.STORAGE.TEMP_FILE_TTL),
           temporaryOnly: true
       });
   }, config.STORAGE.CLEANUP_INTERVAL);
   ```

---

## Network Issues

### Issue: Connection Refused

**Symptoms:**
```
Error: connect ECONNREFUSED
Error: Connection refused
```

**Causes:**
- Server not running
- Wrong port
- Firewall blocking connection
- Network configuration issue

**Solutions:**

1. **Check if server is running:**
   ```bash
   # Check PM2 status
   pm2 status

   # Check if port is listening
   netstat -tulpn | grep :3001
   ```

2. **Check firewall:**
   ```bash
   # Check UFW status
   sudo ufw status

   # Allow port if needed
   sudo ufw allow 3001/tcp
   ```

3. **Check network configuration:**
   ```bash
   # Check IP address
   ip addr show

   # Check routing
   ip route show

   # Test connectivity
   telnet localhost 3001
   ```

---

### Issue: Slow Response Times

**Symptoms:**
- Requests take long time to complete
- Timeout errors
- Poor user experience

**Causes:**
- Network latency
- Server overload
- Database queries slow
- Image processing bottleneck

**Solutions:**

1. **Measure response times:**
   ```bash
   # Use curl to measure response time
   curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/api/images

   # Create curl-format.txt
   #     time_namelookup:  %{time_namelookup}\n
   #        time_connect:     %{time_connect}\n
   #     time_appconnect:  %{time_appconnect}\n
   #    time_pretransfer:  %{time_pretransfer}\n
   #       time_redirect:  %{time_redirect}\n
   #  time_starttransfer:  %{time_starttransfer}\n
   #                     ----------\n
   #          time_total:  %{time_total}\n
   ```

2. **Optimize database queries:**
   ```javascript
   // Add indexes
   db.images.createIndex({ userId: 1, createdAt: -1 });

   // Use pagination
   const images = await db.images.find({ userId })
       .limit(20)
       .skip(page * 20)
       .toArray();
   ```

3. **Use caching:**
   ```javascript
   // Cache frequently accessed data
   const cache = new Map();

   async function getImage(imageId) {
       if (cache.has(imageId)) {
           return cache.get(imageId);
       }

       const image = await db.images.findOne({ id: imageId });
       cache.set(imageId, image);
       return image;
   }
   ```

4. **Enable compression:**
   ```nginx
   # Enable gzip compression
   gzip on;
   gzip_min_length 1024;
   gzip_types text/plain text/css application/json application/javascript;
   ```

---

## Debugging Tips

### Enable Debug Logging

```env
# In .env file
LOG_LEVEL=debug
```

### Use Node.js Debugger

```bash
# Start with debugger
node --inspect=0.0.0.0:9229 server/index.js

# Or with PM2
pm2 start npm --name "app" -- start server --node-args="--inspect=0.0.0.0:9229"
```

### Use Chrome DevTools

1. Open Chrome DevTools
2. Go to `chrome://inspect`
3. Connect to Node.js debugger
4. Set breakpoints and debug

### Monitor Process

```bash
# Monitor with PM2
pm2 monit

# Monitor with htop
htop

# Monitor with top
top
```

### Check Logs

```bash
# PM2 logs
pm2 logs dogepump-backend

# Tail logs
pm2 logs dogepump-backend --lines 100

# Follow logs
pm2 logs dogepump-backend --lines 0
```

### Use Profiling

```javascript
// Enable CPU profiling
const profiler = require('v8-profiler-next');

// Start profiling
profiler.startProfiling('CPU');

// Stop profiling
const profile = profiler.stopProfiling('CPU');
fs.writeFileSync('profile.cpuprofile', profile);
```

---

## Performance Optimization

### Image Processing Optimization

1. **Use appropriate quality settings:**
   ```env
   IMAGE_QUALITY_HIGH=85
   IMAGE_QUALITY_MEDIUM=70
   IMAGE_QUALITY_LOW=55
   ```

2. **Enable progressive loading:**
   ```env
   IMAGE_PROGRESSIVE=true
   ```

3. **Strip metadata:**
   ```env
   IMAGE_STRIP_METADATA=true
   ```

4. **Use efficient formats:**
   ```env
   IMAGE_DEFAULT_FORMAT=webp
   ```

### Server Optimization

1. **Enable compression:**
   ```nginx
   gzip on;
   gzip_types image/jpeg image/png image/webp;
   ```

2. **Use caching:**
   ```nginx
   location ~* \.(jpg|jpeg|png|gif|webp|avif)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

3. **Use CDN:**
   - Configure CDN to serve static files
   - Use CDN for image delivery
   - Enable CDN caching

### Database Optimization

1. **Add indexes:**
   ```javascript
   db.images.createIndex({ userId: 1, createdAt: -1 });
   db.images.createIndex({ checksum: 1 });
   ```

2. **Use connection pooling:**
   ```javascript
   const pool = new Pool({
       max: 20,
       idleTimeoutMillis: 30000,
   });
   ```

3. **Optimize queries:**
   ```javascript
   // Use projection to limit returned fields
   db.images.find({ userId }, { projection: { id: 1, url: 1 } });
   ```

---

## Getting Help

If you're still experiencing issues:

1. **Check documentation:**
   - [Complete System Documentation](./server/IMAGE_UPLOAD_SYSTEM.md)
   - [API Reference](./server/API_REFERENCE.md)
   - [Quick Start Guide](./QUICKSTART.md)
   - [Deployment Guide](./DEPLOYMENT.md)

2. **Check logs:**
   ```bash
   pm2 logs dogepump-backend --lines 100
   ```

3. **Search for similar issues:**
   - GitHub Issues
   - Stack Overflow
   - Fastify Documentation
   - Sharp Documentation

4. **Create a support request:**
   - Include error messages
   - Include system information
   - Include steps to reproduce
   - Include logs

---

## Common Error Messages Reference

| Error Message | Cause | Solution |
|---------------|--------|-----------|
| `EADDRINUSE` | Port already in use | Kill process or change port |
| `EACCES` | Permission denied | Check file permissions |
| `ECONNREFUSED` | Connection refused | Check if server is running |
| `ETIMEDOUT` | Connection timeout | Increase timeout or check network |
| `ENOTFOUND` | Host not found | Check DNS configuration |
| `ECONNRESET` | Connection reset | Check network stability |
| `EMFILE` | Too many open files | Increase file descriptor limit |
| `ENOMEM` | Out of memory | Increase memory or optimize code |
| `EPIPE` | Broken pipe | Check connection stability |

---

**Remember:** Always test changes in development before deploying to production!
