# Market Motors - Auto Dealership Platform

A modern, full-stack auto dealership management system built with React, TypeScript, Express.js, and PostgreSQL.

## 🚀 Tech Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Router** for client-side routing
- **React Query** for server state management

### Backend

- **Express.js** with TypeScript
- **PostgreSQL** database
- **Drizzle ORM** for database management
- **JWT** for authentication
- **bcryptjs** for password hashing

### Infrastructure

- **Docker Compose** for local development
- **Redis** for caching (optional)

## 📁 Project Structure

```
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── utils/             # Utility functions
│   └── main.tsx           # React app entry point
├── server/                # Backend Express.js application
│   ├── routes/            # API route handlers
│   ├── middleware/        # Express middleware
│   └── index.ts           # Server entry point
├── lib/                   # Shared utilities and database
│   └── db/                # Database schema and connection
│       ├── schema.ts      # Drizzle database schema
│       └── index.ts       # Database connection
├── docker-compose.yml     # Docker services configuration
├── drizzle.config.ts      # Drizzle ORM configuration
└── .env.example           # Environment variables template
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL (or use Docker)

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd market-motors-vite
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# DATABASE_URL=postgresql://postgres:password@localhost:5432/market_motors
# JWT_SECRET=your-super-secret-jwt-key-here
```

### 3. Database Setup

```bash
# Start PostgreSQL and Redis with Docker
npm run docker:up

# Generate database migrations
npm run db:generate

# Apply migrations to database
npm run db:push

# (Optional) Open Drizzle Studio for database management
npm run db:studio
```

### 4. Development

```bash
# Start both frontend and backend in development mode
npm run dev:all

# Or start them separately:
npm run dev          # Frontend only (http://localhost:5173)
npm run dev:server   # Backend only (http://localhost:3001)
```

## 📚 Available Scripts

### Development

- `npm run dev` - Start Vite dev server
- `npm run dev:server` - Start Express server with nodemon
- `npm run dev:all` - Start both frontend and backend concurrently

### Database

- `npm run db:generate` - Generate database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio

### Docker

- `npm run docker:up` - Start PostgreSQL and Redis containers
- `npm run docker:down` - Stop and remove containers

### Build & Production

- `npm run build` - Build frontend for production
- `npm run build:server` - Build backend for production
- `npm run start:server` - Start production server

## 🗄️ Database Schema

### Users Table

- Authentication and authorization
- Role-based access (user, admin, super_admin)
- JWT session management

### Cars Table

- Vehicle inventory management
- Rich metadata (make, model, year, price, etc.)
- Image storage and features
- Stock and featured status

### Sessions Table

- JWT token management
- Refresh token support
- Automatic cleanup

## 🔒 Authentication & Authorization

The system implements a role-based authentication system:

- **User**: Can view cars and contact information
- **Admin**: Can manage car inventory
- **Super Admin**: Full system access including user management

## 🎯 Features

### Public Features

- Browse car inventory with filtering and search
- Responsive design for all devices
- Car detail pages with image galleries
- Contact information display

### Admin Features

- Car inventory management (CRUD operations)
- Image upload and management
- Bulk operations for multiple cars
- Dashboard with analytics

### Super Admin Features

- User management
- System configuration
- Full administrative access

## 🚀 Deployment

The application is designed to be deployed on Railway or similar platforms:

1. Set up environment variables
2. Configure PostgreSQL database
3. Build and deploy both frontend and backend
4. Run database migrations

## 📝 License

This project is licensed under the MIT License.
