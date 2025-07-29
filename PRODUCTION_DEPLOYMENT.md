# ExamTech Production Deployment Guide

This guide provides comprehensive instructions for deploying ExamTech in a production environment with security, monitoring, and scalability considerations.

## 🚀 Quick Start

### 1. Prerequisites

- **Server**: Ubuntu 20.04+ or CentOS 8+ with at least 4GB RAM
- **Domain**: A registered domain name with DNS access
- **SSL Certificate**: Let's Encrypt or commercial SSL certificate
- **Docker & Docker Compose**: Latest stable versions
- **Git**: For code deployment

### 2. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install additional tools
sudo apt install -y nginx certbot python3-certbot-nginx curl wget git
```

### 3. Environment Configuration

Create production environment file:

```bash
# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 32)
MONGO_ROOT_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
GRAFANA_PASSWORD=$(openssl rand -base64 16)

# Create .env file
cat > .env << EOF
# Database Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
REDIS_PASSWORD=${REDIS_PASSWORD}

# JWT Configuration
JWT_SECRET=${JWT_SECRET}

# Application URLs
FRONTEND_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com

# Monitoring
GRAFANA_PASSWORD=${GRAFANA_PASSWORD}

# Security Settings
NODE_ENV=production
ENABLE_HEALTH_CHECKS=true
ENABLE_METRICS=true
ENABLE_PROCTORING=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=/app/uploads

# Database Optimization
MONGODB_CONNECTION_POOL_SIZE=10
MONGODB_SOCKET_TIMEOUT_MS=45000
MONGODB_SERVER_SELECTION_TIMEOUT_MS=30000
EOF
```

### 4. SSL Certificate Setup

```bash
# Stop nginx temporarily
sudo systemctl stop nginx

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Create SSL directory
sudo mkdir -p /etc/nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /etc/nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /etc/nginx/ssl/
```

### 5. Nginx Configuration

Create production nginx configuration:

```bash
sudo mkdir -p /etc/nginx/sites-available/examtech
sudo mkdir -p /etc/nginx/sites-enabled/examtech

# Create nginx configuration
sudo tee /etc/nginx/sites-available/examtech << 'EOF'
upstream backend {
    server localhost:3001;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Health check
    location /health {
        proxy_pass http://backend/health;
        access_log off;
    }

    # Static files
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/examtech /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Application Deployment

```bash
# Clone repository
git clone https://github.com/yourusername/examtech.git
cd examtech

# Copy environment file
cp .env.example .env
# Edit .env with production values

# Create necessary directories
mkdir -p logs/{backend,frontend,nginx,mongodb,redis}
mkdir -p backend/uploads
mkdir -p monitoring/{prometheus,grafana}

# Build and start services
docker-compose up -d --build

# Check service status
docker-compose ps
docker-compose logs -f
```

### 7. Database Initialization

```bash
# Create admin user
docker-compose exec backend node -e "
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const adminUser = new User({
      email: 'admin@yourdomain.com',
      password: 'SecurePassword123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'super_admin'
    });
    
    await adminUser.save();
    console.log('Admin user created successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error creating admin user:', err);
    process.exit(1);
  });
"
```

### 8. Monitoring Setup

Create Prometheus configuration:

```bash
cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'examtech-backend'
    static_configs:
      - targets: ['backend:3001']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'examtech-frontend'
    static_configs:
      - targets: ['frontend:3000']
    scrape_interval: 30s

  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongodb:27017']
    scrape_interval: 30s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
    scrape_interval: 30s
EOF
```

### 9. Backup Configuration

Create automated backup script:

```bash
cat > backup.sh << 'EOF'
#!/bin/bash

# Backup script for ExamTech
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/examtech"
MONGODB_CONTAINER="examtech-mongodb"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup MongoDB
docker exec $MONGODB_CONTAINER mongodump --out /dump
docker cp $MONGODB_CONTAINER:/dump $BACKUP_DIR/mongodb_$DATE
docker exec $MONGODB_CONTAINER rm -rf /dump

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz backend/uploads/

# Backup logs
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz logs/

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "mongodb_*" -mtime +7 -exec rm -rf {} \;

echo "Backup completed: $DATE"
EOF

chmod +x backup.sh

# Add to crontab (daily backup at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /path/to/examtech/backup.sh") | crontab -
```

### 10. Security Hardening

```bash
# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Set up fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create fail2ban configuration
sudo tee /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 5
EOF

sudo systemctl restart fail2ban
```

### 11. Performance Optimization

```bash
# Configure system limits
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Optimize MongoDB
docker-compose exec mongodb mongosh --eval "
db.adminCommand({
  setParameter: 1,
  maxTransactionLockRequestTimeoutMillis: 5000
});
"

# Configure Redis persistence
docker-compose exec redis redis-cli CONFIG SET save "900 1 300 10 60 10000"
```

### 12. Health Monitoring

```bash
# Create health check script
cat > health-check.sh << 'EOF'
#!/bin/bash

# Health check script
HEALTH_URL="https://yourdomain.com/health"
LOG_FILE="/var/log/examtech-health.log"

# Check application health
response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $response -eq 200 ]; then
    echo "$(date): Application is healthy" >> $LOG_FILE
else
    echo "$(date): Application is unhealthy (HTTP $response)" >> $LOG_FILE
    
    # Restart services if unhealthy
    cd /path/to/examtech
    docker-compose restart backend frontend
fi
EOF

chmod +x health-check.sh

# Add to crontab (check every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /path/to/examtech/health-check.sh") | crontab -
```

## 🔧 Maintenance

### Regular Tasks

1. **Log Rotation**: Configure logrotate for application logs
2. **SSL Renewal**: Set up automatic SSL certificate renewal
3. **Security Updates**: Regularly update Docker images and system packages
4. **Database Maintenance**: Regular MongoDB maintenance and optimization
5. **Backup Verification**: Test backup restoration procedures

### Monitoring Alerts

Set up monitoring alerts for:
- High CPU/Memory usage
- Disk space warnings
- Application errors
- SSL certificate expiration
- Backup failures

## 🚨 Troubleshooting

### Common Issues

1. **Application won't start**
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```

2. **Database connection issues**
   ```bash
   docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
   ```

3. **SSL certificate issues**
   ```bash
   sudo certbot renew --dry-run
   ```

4. **Performance issues**
   ```bash
   docker stats
   docker-compose exec backend node health-check.js
   ```

### Emergency Procedures

1. **Rollback**: Use `docker-compose down && git checkout previous-version && docker-compose up -d`
2. **Database Recovery**: Restore from backup using `mongorestore`
3. **Service Restart**: `docker-compose restart [service-name]`

## 📊 Performance Tuning

### Application Level
- Enable Redis caching
- Optimize database queries
- Implement connection pooling
- Use CDN for static assets

### Infrastructure Level
- Load balancing for high traffic
- Auto-scaling based on metrics
- Database read replicas
- CDN for global distribution

## 🔒 Security Checklist

- [ ] Strong JWT secret generated
- [ ] Database passwords secured
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Fail2ban enabled
- [ ] Regular security updates
- [ ] Backup encryption
- [ ] Access logging enabled
- [ ] Rate limiting configured
- [ ] Input validation implemented

## 📈 Scaling Considerations

### Horizontal Scaling
- Multiple application instances
- Load balancer configuration
- Database sharding
- Redis cluster setup

### Vertical Scaling
- Increase server resources
- Optimize application code
- Database indexing
- Caching strategies

---

**Production deployment completed!** 🎉

Your ExamTech application is now running in a secure, monitored, and scalable production environment. 