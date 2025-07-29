#!/bin/bash

# ExamTech Installation Script
echo "🚀 Installing ExamTech - Live Online Examination Platform"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. Please install MongoDB 6+ or use Docker."
    echo "   You can install MongoDB from: https://docs.mongodb.com/manual/installation/"
    echo "   Or use Docker: docker run -d -p 27017:27017 --name mongodb mongo:6.0"
fi

# Create environment files
echo "📝 Creating environment files..."

if [ ! -f .env ]; then
    cp env.example .env
    echo "✅ Created .env file"
else
    echo "⚠️  .env file already exists"
fi

if [ ! -f backend/.env ]; then
    cp backend/env.example backend/.env
    echo "✅ Created backend/.env file"
else
    echo "⚠️  backend/.env file already exists"
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

cd ..

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p backend/uploads

# Check if MongoDB is running
echo "🔍 Checking MongoDB connection..."
if command -v mongod &> /dev/null; then
    if pgrep -x "mongod" > /dev/null; then
        echo "✅ MongoDB is running"
    else
        echo "⚠️  MongoDB is not running. Please start MongoDB:"
        echo "   sudo systemctl start mongod"
        echo "   or"
        echo "   mongod"
    fi
else
    echo "⚠️  MongoDB not found. Please install MongoDB or use Docker."
fi

echo ""
echo "🎉 Installation completed!"
echo ""
echo "📋 Next steps:"
echo "1. Configure environment variables in .env and backend/.env"
echo "2. Start MongoDB (if not using Docker)"
echo "3. Start the backend: cd backend && npm run dev"
echo "4. Start the frontend: npm run dev"
echo "5. Access the application at http://localhost:3000"
echo ""
echo "🐳 Alternative: Use Docker Compose"
echo "   docker-compose up -d"
echo ""
echo "📚 For more information, see README.md" 