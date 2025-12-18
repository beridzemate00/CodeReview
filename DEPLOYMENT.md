# CodeReview.ai Deployment Guide

## 🚀 Quick Deploy (Recommended)

### Prerequisites
- GitHub account (you already have this ✅)
- Prisma Accelerate database (you already have this ✅)
- Vercel account (free)
- Railway account (free)

---

## Option 1: Vercel + Railway (Free Tier)

### Step 1: Deploy Backend on Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `CodeReview` repository
4. Set the **Root Directory** to `backend`
5. Railway will auto-detect Node.js

**Add Environment Variables in Railway:**
```
DATABASE_URL=your-prisma-accelerate-url
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
GEMINI_API_KEY=your-gemini-key
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-secret
GITHUB_REDIRECT_URI=https://your-backend.railway.app/api/github/callback
```

6. Click **Deploy** and wait for build
7. Copy your Railway URL (e.g., `https://codereview-backend.railway.app`)

---

### Step 2: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import your `CodeReview` repository
4. Set **Root Directory** to `frontend`
5. Framework Preset: **Vite**
6. Build Command: `npm run build`
7. Output Directory: `dist`

**Add Environment Variable:**
```
VITE_API_URL=https://your-backend.railway.app
```

8. Click **Deploy**

---

### Step 3: Update GitHub OAuth Callback

After deployment, update your GitHub OAuth App:
1. Go to https://github.com/settings/developers
2. Edit your OAuth App
3. Update **Authorization callback URL** to:
   `https://your-backend.railway.app/api/github/callback`

---

## Option 2: Docker on VPS (DigitalOcean, AWS, etc.)

### Step 1: Get a VPS
- DigitalOcean: $4-6/month
- AWS Lightsail: $3.50/month
- Vultr: $5/month

### Step 2: SSH into server and install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin
```

### Step 3: Clone and Deploy
```bash
git clone https://github.com/beridzemate00/CodeReview.git
cd CodeReview

# Create production .env
cp backend/.env.example backend/.env
nano backend/.env  # Edit with your values

# Build and run
docker compose up -d --build
```

### Step 4: Setup Nginx + SSL (Optional but recommended)
```bash
sudo apt install nginx certbot python3-certbot-nginx

# Configure nginx
sudo nano /etc/nginx/sites-available/codereview
```

Add:
```nginx
server {
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/codereview /etc/nginx/sites-enabled/
sudo certbot --nginx -d your-domain.com
sudo systemctl restart nginx
```

---

## Option 3: Render.com (Alternative to Railway)

1. Go to [render.com](https://render.com)
2. Create **New Web Service**
3. Connect GitHub repo
4. Set Root Directory: `backend`
5. Build Command: `npm install && npx prisma generate && npm run build`
6. Start Command: `npm start`
7. Add environment variables

---

## 🔑 Production Environment Variables

### Backend (.env)
```env
# Database (Prisma Accelerate - already have)
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_KEY

# Auth
JWT_SECRET=generate-a-strong-random-string-here

# Server
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com

# AI (Optional)
GEMINI_API_KEY=your-gemini-api-key

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=your-github-app-client-id
GITHUB_CLIENT_SECRET=your-github-app-client-secret
GITHUB_REDIRECT_URI=https://your-backend-domain.com/api/github/callback

# Email (Optional - for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=CodeReview.ai <noreply@codereview.ai>
```

### Frontend
```env
VITE_API_URL=https://your-backend-domain.com
```

---

## 🔒 Security Checklist

- [ ] Change JWT_SECRET to a strong random string
- [ ] Use HTTPS everywhere
- [ ] Set proper CORS origins in backend
- [ ] Keep API keys secret (never commit to git)
- [ ] Enable rate limiting (already done ✅)
- [ ] Regular database backups

---

## 📋 Post-Deployment

1. Test login/register
2. Test code review
3. Test GitHub OAuth (if configured)
4. Monitor logs for errors
5. Set up monitoring (optional: UptimeRobot free tier)

---

## Need Help?

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Prisma Accelerate: https://www.prisma.io/docs/accelerate
