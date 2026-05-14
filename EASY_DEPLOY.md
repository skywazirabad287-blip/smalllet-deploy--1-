# SmallLet — Easy Deploy (5 Steps)

## Option A: Vercel (Free — Easiest)

### Step 1: Install
```bash
npm install
```

### Step 2: Create Database
1. Go to vercel.com → Storage → Create Postgres (free)
2. Copy the connection string

### Step 3: Set Environment Variables
```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL="paste-your-vercel-postgres-url-here"
NEXTAUTH_SECRET="type-any-32-random-characters-here"
NEXTAUTH_URL="https://your-project.vercel.app"
```

### Step 4: Deploy
```bash
npm i -g vercel
vercel login
vercel --prod
```

### Step 5: Run Migrations
```bash
npx prisma migrate deploy
npx prisma db seed
```

**Done!** App live at `https://your-project.vercel.app`

---

## Option B: Your Own Server ($5/month)

```bash
# 1. Get VPS (DigitalOcean/Hetzner)
# 2. SSH into server
ssh root@your-server-ip

# 3. Install dependencies
apt update && apt install -y nodejs postgresql nginx
npm install -g pm2

# 4. Setup database
sudo -u postgres psql -c "CREATE DATABASE smalllet;"
sudo -u postgres psql -c "CREATE USER smalllet WITH PASSWORD 'password123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE smalllet TO smalllet;"

# 5. Upload code and run
cd /var/www/smalllet
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run build
pm2 start "npm start" --name smalllet

# 6. Point domain and get SSL
certbot --nginx -d yourdomain.com
```

---

## Demo Login
- **Email:** `demo@smalllet.app`
- **Password:** `password123`
