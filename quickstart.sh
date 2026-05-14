#!/bin/bash

echo "🚀 SmallLet Quick Start"
echo "======================="
echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Current: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your values before continuing"
    echo ""
    echo "Required variables:"
    echo "  - DATABASE_URL"
    echo "  - NEXTAUTH_SECRET"
    echo "  - STRIPE_SECRET_KEY (optional)"
    echo ""
    read -p "Press Enter after editing .env..."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

# Seed database
echo "🌱 Seeding database..."
npx prisma db seed

# Build
echo "🔨 Building application..."
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "Start development server:"
echo "  npm run dev"
echo ""
echo "Or deploy to Vercel:"
echo "  vercel --prod"
echo ""
echo "Demo login:"
echo "  Email: demo@smalllet.app"
echo "  Password: password123"
