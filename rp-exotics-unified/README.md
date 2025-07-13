# RP Exotics Unified - Car Dealership Management System

A comprehensive full-stack web application for managing car dealership operations, built with React frontend and Node.js/Express backend with MongoDB.

## 🏗️ Architecture

```
rp-exotics-unified/
├── backend/          # Node.js/Express API server
│   ├── models/       # MongoDB/Mongoose models
│   ├── routes/       # API endpoints
│   ├── middleware/   # Custom middleware
│   ├── tests/        # Test files
│   ├── scripts/      # Utility scripts
│   └── docs/         # Documentation
├── frontend/         # React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API services
│   │   └── config/      # Configuration
│   └── public/          # Static assets
└── package.json      # Root package management
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd rp-exotics-unified

# Install all dependencies (backend + frontend)
npm run install:all
```

### Environment Setup

#### Backend (.env in backend/ directory)
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
PORT=5001
```

#### Frontend (.env in frontend/ directory)
```env
REACT_APP_API_URL=http://localhost:5001/api
```

### Running the Application

#### Development (Both Frontend & Backend)
```bash
npm run dev
```

#### Individual Services
```bash
# Backend only
npm run dev:backend

# Frontend only  
npm run dev:frontend
```

#### Production
```bash
# Build frontend
npm run build

# Start backend
npm start
```

## 🔧 Available Scripts

### Root Level Commands
- `npm run install:all` - Install dependencies for both frontend and backend
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build the frontend for production
- `npm run test` - Run backend tests
- `npm run test:frontend` - Run frontend tests
- `npm run setup` - Run initial database setup
- `npm run seed` - Seed database with initial data

### Backend Scripts
- `cd backend && npm start` - Start backend server
- `cd backend && node scripts/setup.js` - Database setup
- `cd backend && node scripts/userSetup.js` - Create initial users
- `cd backend && node scripts/populate-dealers.js` - Populate dealer data

### Frontend Scripts
- `cd frontend && npm start` - Start React development server
- `cd frontend && npm run build` - Build for production
- `cd frontend && npm test` - Run tests

## 📚 Features

### Backend Features
- **Authentication System** - JWT-based user authentication
- **Deal Management** - Create, read, update, delete car deals
- **Dealer Management** - Manage dealer information and relationships
- **Sales Tracking** - Track sales performance and analytics
- **Document Management** - Handle deal-related documents
- **VIN Decoding** - Decode vehicle identification numbers
- **Back Office** - Administrative interface and reporting

### Frontend Features
- **Modern UI** - Built with React and Tailwind CSS
- **Responsive Design** - Works on desktop and mobile
- **Dark Mode** - Beautiful dark theme
- **Real-time Updates** - Live data synchronization
- **Search & Filter** - Advanced search capabilities
- **File Upload** - Document upload functionality

## 🗄️ Database Schema

### Core Models
- **User** - System users and authentication
- **Dealer** - Dealership information
- **Deal** - Car deal records
- **SalesDeal** - Sales tracking data
- **DocumentType** - Document categorization

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify authentication

### Deals
- `GET /api/deals` - Get all deals
- `POST /api/deals` - Create new deal
- `PUT /api/deals/:id` - Update deal
- `DELETE /api/deals/:id` - Delete deal

### Dealers
- `GET /api/dealers` - Get all dealers
- `GET /api/dealers/search` - Search dealers
- `POST /api/dealers` - Create dealer
- `PUT /api/dealers/:id` - Update dealer

### Sales & Analytics
- `GET /api/sales` - Get sales data
- `GET /api/backoffice/analytics` - Analytics data

## 🧪 Testing

### Backend Tests
All test files are in `backend/tests/`:
- Authentication tests
- Deal management tests
- Dealer management tests
- API endpoint tests
- Database model tests

### Frontend Tests
- Component tests
- Integration tests
- API service tests

## 🚀 Deployment

### Railway Deployment
The application is configured for Railway deployment:
- Backend: `railway.json` and `Procfile`
- Frontend: Build process for static hosting

### Environment Variables
- Production MongoDB connection
- JWT secrets
- API URLs

## 📖 Documentation

- **Backend Documentation**: `backend/README.md`
- **Detailed Docs**: `backend/docs/`
- **API Documentation**: See backend README for endpoint details

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS configuration
- Input validation and sanitization
- Secure file uploads

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is proprietary software for RP Exotics.

## 🆘 Support

For support and questions, please contact the development team. 