# BreakingCID Worker Deployment Guide

## Overview

This guide provides step-by-step instructions to deploy the BreakingCID worker on a Kali Linux server. The worker executes security scans on behalf of the central BreakingCID platform.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  BreakingCID Frontend (Web)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/REST API
                         │
┌────────────────────────▼────────────────────────────────────┐
│              BreakingCID Backend (Node.js/tRPC)             │
│  - Manages jobs in database                                 │
│  - Exposes /api/worker endpoints                            │
│  - Stores results and logs                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/REST API
                         │
┌────────────────────────▼────────────────────────────────────┐
│        BreakingCID Worker (Kali Linux - Python)             │
│  - Polls for pending jobs                                   │
│  - Executes security scans                                  │
│  - Sends logs and results back                              │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- **Server**: Kali Linux (or Ubuntu with Kali tools)
- **Root Access**: Required for installation
- **Network**: Connectivity to BreakingCID backend server
- **Disk Space**: Minimum 10GB for tools and results
- **RAM**: Minimum 2GB (4GB+ recommended)

## Installation Steps

### Step 1: Prepare the Server

Connect to your Kali Linux server via SSH:

```bash
ssh root@your-kali-server.com
```

### Step 2: Clone the Repository

```bash
cd /tmp
git clone https://github.com/yourusername/breakingcid.git
cd breakingcid
```

### Step 3: Run the Deployment Script

The deployment script automates all installation steps:

```bash
sudo bash worker/deploy.sh
```

The script will:
- Update system packages
- Install dependencies (Python 3.10, tools, libraries)
- Create worker directory structure at `/opt/breakingcid-worker`
- Copy worker files
- Create configuration file
- Setup systemd service

### Step 4: Configure the Worker

Edit the configuration file:

```bash
nano /opt/breakingcid-worker/.env
```

**Critical Configuration:**

```env
# Backend server URL (MUST be reachable from worker)
BACKEND_URL=http://your-backend-server.com:3000

# API key for authentication (must match backend)
WORKER_API_KEY=your-secret-api-key-here

# Worker identification
WORKER_ID=worker-001
WORKER_NAME=Kali-Worker-01

# Polling interval (seconds)
POLL_INTERVAL=5

# Scan timeout (seconds)
SCAN_TIMEOUT=300

# Enable verbose logging
VERBOSE=true
```

### Step 5: Start the Worker

```bash
# Start the worker service
systemctl start breakingcid-worker

# Enable auto-start on boot
systemctl enable breakingcid-worker

# Check status
systemctl status breakingcid-worker
```

### Step 6: Verify Installation

Check if worker is running:

```bash
# View service status
systemctl status breakingcid-worker

# View logs
journalctl -u breakingcid-worker -f

# Check process
ps aux | grep worker_client.py
```

Expected output:
```
[+] Worker connected to backend
[+] Polling for jobs...
[*] No pending jobs
```

## Monitoring

### Using the Monitor Script

```bash
bash /opt/breakingcid-worker/monitor.sh
```

The monitor provides:
- Service status
- Backend connectivity
- Recent logs
- System resources
- Active scans

### Manual Monitoring

View logs in real-time:

```bash
journalctl -u breakingcid-worker -f
```

Check worker process:

```bash
ps aux | grep worker_client.py
top -p $(pgrep -f worker_client.py)
```

Check disk usage:

```bash
du -sh /opt/breakingcid-worker
du -sh /opt/breakingcid-worker/logs
du -sh /opt/breakingcid-worker/results
```

## Troubleshooting

### Worker not connecting to backend

**Problem**: Worker shows "Backend unreachable"

**Solution**:
1. Check backend URL in `.env`
2. Verify network connectivity: `curl http://backend-url:3000`
3. Check firewall rules
4. Verify API key matches backend configuration

### Service fails to start

**Problem**: `systemctl status` shows failed

**Solution**:
1. Check logs: `journalctl -u breakingcid-worker -n 50`
2. Verify Python 3.10 is installed: `python3.10 --version`
3. Check file permissions: `ls -la /opt/breakingcid-worker/`
4. Restart service: `systemctl restart breakingcid-worker`

### Scans not executing

**Problem**: Jobs stay in "pending" status

**Solution**:
1. Verify worker is running: `systemctl status breakingcid-worker`
2. Check logs for errors: `journalctl -u breakingcid-worker -f`
3. Verify tools are installed: `which nmap amass subfinder`
4. Check disk space: `df -h /opt/breakingcid-worker`

### High CPU/Memory usage

**Problem**: Worker consuming excessive resources

**Solution**:
1. Reduce `MAX_CONCURRENT_SCANS` in `.env`
2. Increase `SCAN_TIMEOUT` for long-running scans
3. Monitor with: `top -p $(pgrep -f worker_client.py)`
4. Check for stuck processes: `ps aux | grep python`

## Maintenance

### Updating the Worker

```bash
cd /tmp/breakingcid
git pull origin main
sudo bash worker/deploy.sh
systemctl restart breakingcid-worker
```

### Cleaning Up Old Results

```bash
# Remove results older than 30 days
find /opt/breakingcid-worker/results -type f -mtime +30 -delete

# Remove logs older than 7 days
find /opt/breakingcid-worker/logs -type f -mtime +7 -delete
```

### Backing Up Configuration

```bash
cp /opt/breakingcid-worker/.env /backup/breakingcid-worker-backup-$(date +%Y%m%d).env
```

## Performance Tuning

### For High-Volume Scans

Edit `/opt/breakingcid-worker/.env`:

```env
MAX_CONCURRENT_SCANS=4
POLL_INTERVAL=2
SCAN_TIMEOUT=600
```

### For Resource-Constrained Servers

```env
MAX_CONCURRENT_SCANS=1
POLL_INTERVAL=10
SCAN_TIMEOUT=300
```

### Increase File Descriptors

Add to `/etc/security/limits.conf`:

```
* soft nofile 65535
* hard nofile 65535
```

Reboot for changes to take effect.

## Security Considerations

### Network Security

- Use HTTPS for backend communication (configure in `.env`)
- Restrict worker server access via firewall
- Use strong API keys (minimum 32 characters)
- Rotate API keys regularly

### File Permissions

```bash
# Restrict worker directory
chmod 700 /opt/breakingcid-worker
chown root:root /opt/breakingcid-worker

# Restrict configuration
chmod 600 /opt/breakingcid-worker/.env
```

### Audit Logging

Enable audit logging for security scans:

```bash
auditctl -w /opt/breakingcid-worker/results -p wa -k breakingcid_results
```

## API Integration

The worker communicates with the backend via REST API:

### Endpoints Used

- `GET /api/worker/jobs/pending` - Fetch pending jobs
- `POST /api/worker/jobs/:id/start` - Mark job as running
- `POST /api/worker/jobs/:id/logs` - Send logs
- `POST /api/worker/jobs/:id/results` - Send results
- `POST /api/worker/jobs/:id/error` - Report errors

### Authentication

All requests include header:
```
X-Worker-API-Key: your-secret-api-key-here
```

## Support

For issues or questions:

1. Check logs: `journalctl -u breakingcid-worker -f`
2. Run monitor: `bash /opt/breakingcid-worker/monitor.sh`
3. Review this guide's troubleshooting section
4. Check backend connectivity: `curl http://backend-url:3000/api/worker/health`

## Next Steps

After successful deployment:

1. **Test the worker**: Submit a scan from the web interface
2. **Monitor execution**: Watch logs in real-time
3. **Verify results**: Check scan results in the web dashboard
4. **Scale up**: Deploy additional workers for load distribution
5. **Automate**: Set up monitoring alerts and automated restarts

---

**Last Updated**: 2024
**Version**: 1.0
