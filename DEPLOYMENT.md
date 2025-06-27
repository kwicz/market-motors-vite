# Railway Deployment Guide - Market Motors

This project has been reorganized into separate frontend and backend services for Railway deployment.

## 📁 Project Structure

```
/frontend/     → Vite React app
/backend/      → Express API server
/               → Root (legacy files, can be cleaned up)
```

## 🚀 Deployment Steps

### Step 1: Deploy Backend Service

1. **Navigate to backend directory:**

   ```bash
   cd backend
   ```

2. **Initialize Railway service:**

   ```bash
   railway init --service backend
   ```

3. **Deploy backend:**

   ```bash
   railway up
   ```

4. **Note the backend URL** (e.g., `https://your-backend.up.railway.app`)

### Step 2: Add Database Plugins

In your Railway project dashboard:

1. **Add PostgreSQL Plugin:**

   - Click "New Plugin" → PostgreSQL
   - Copy the generated `DATABASE_URL`

2. **Add Redis Plugin:**

   - Click "New Plugin" → Redis
   - Copy the generated `REDIS_URL`

3. **Set Environment Variables** in backend service:
   ```
   DATABASE_URL=<your-postgres-url>
   REDIS_URL=<your-redis-url>
   JWT_SECRET=<generate-secure-secret>
   JWT_REFRESH_SECRET=<generate-secure-secret>
   SESSION_SECRET=<generate-secure-secret>
   CORS_ORIGIN=https://your-frontend.up.railway.app
   ```

### Step 3: Deploy Frontend Service

1. **Navigate to frontend directory:**

   ```bash
   cd ../frontend
   ```

2. **Update environment variables:**
   Edit `frontend/.env.production`:

   ```
   VITE_API_BASE_URL=https://your-backend.up.railway.app/api
   ```

3. **Initialize Railway service:**

   ```bash
   railway init --service frontend
   ```

4. **Deploy frontend:**
   ```bash
   railway up
   ```

### Step 4: Update CORS Configuration

Once frontend is deployed:

1. **Get frontend URL** (e.g., `https://your-frontend.up.railway.app`)
2. **Update backend environment** in Railway dashboard:
   ```
   CORS_ORIGIN=https://your-frontend.up.railway.app
   ```

### Step 5: Run Database Migrations

From the backend directory:

```bash
railway run npm run db:migrate
```

## 🔧 Final Railway Services

Your Railway project should have **4 services**:

| Service Name | Type   | Purpose        |
| ------------ | ------ | -------------- |
| `frontend`   | Static | Vite React UI  |
| `backend`    | Docker | Express API    |
| `PostgreSQL` | Plugin | Database       |
| `Redis`      | Plugin | Cache/Sessions |

## 🛠 Local Development

### Backend Development:

```bash
cd backend
npm install
npm run dev
```

### Frontend Development:

```bash
cd frontend
npm install
npm run dev
```

## 📝 Important Notes

- ✅ Frontend and backend are now completely separate services
- ✅ Each has its own `package.json` and dependencies
- ✅ CORS is configured to allow frontend → backend communication
- ✅ Environment variables are properly separated
- ⚠️ Update the URLs in environment files after deployment
- ⚠️ Make sure to set all required environment variables in Railway dashboard

## 🚨 Post-Deployment Checklist

- [ ] Backend health check works: `https://your-backend.up.railway.app/health`
- [ ] Frontend loads correctly: `https://your-frontend.up.railway.app`
- [ ] API calls work from frontend to backend
- [ ] Database migrations completed successfully
- [ ] CORS is properly configured
- [ ] Environment variables are set in Railway dashboard
