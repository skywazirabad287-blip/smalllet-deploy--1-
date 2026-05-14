# Deploy SmallLet to Vercel

## Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

## Step 2: Login
```bash
vercel login
```
Opens browser → Click **Continue**

## Step 3: Go to Project
```bash
cd smalllet
```

## Step 4: Deploy
```bash
vercel --prod
```
Press **Enter** for all defaults.

## Step 5: Add Database
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your project → **Storage** → **Create Postgres**
3. Click **Connect**

## Step 6: Add Environment Variables
In Vercel Dashboard → your project → **Settings** → **Environment Variables**:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | (copy from Postgres connection string) |
| `NEXTAUTH_SECRET` | `type-any-32-random-characters` |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` |

## Step 7: Run Migrations
```bash
vercel env pull .env.local
npx prisma migrate deploy
npx prisma db seed
```

## Step 8: Redeploy
```bash
vercel --prod
```

**Done!** Your app is live.

## All Commands in Order
```bash
npm install -g vercel
vercel login
cd smalllet
vercel --prod
# Add database on vercel.com
# Add env vars on vercel.com
vercel env pull .env.local
npx prisma migrate deploy
npx prisma db seed
vercel --prod
```
