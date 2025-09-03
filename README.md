# XMBL App Generator

A powerful, full-stack app generator platform that allows users to create, customize, and deploy web applications with a visual interface. Built with Vue.js frontend and Node.js backend, integrated with Firebase Firestore and optimized for Vercel deployment.

## 🚀 Features

### Core Platform
- **User Profiles & Authentication** - Secure user management with Firebase Auth
- **Multi-tenant Architecture** - Each user gets isolated applications with dedicated databases
- **Subdomain Management** - Automatic subdomain creation for user applications
- **Real-time Collaboration** - Multiple users can work on the same project

### Visual Builder
- **Drag & Drop Page Builder** - Create pages visually without coding
- **Component Library** - Pre-built and custom components
- **Function Editor** - Create custom JavaScript functions
- **Event Hook System** - Handle user interactions and lifecycle events
- **Live Preview** - See changes in real-time

### Code Generation
- **Auto-generated Vue.js Apps** - Clean, production-ready code
- **Custom Component Templates** - Reusable component patterns
- **API Integration** - Automatic backend API generation
- **Database Schema** - Dynamic Firestore collection management

## 🏗️ Architecture

```
xmbl-app-generator/
├── frontend/          # Vue.js application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── views/         # Page components
│   │   ├── stores/        # Pinia state management
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   ├── public/
│   └── package.json
├── backend/           # Node.js API server
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # Business logic
│   │   ├── models/        # Data models
│   │   └── utils/         # Utility functions
│   ├── config/
│   └── package.json
└── package.json       # Root package.json
```

## 🛠️ Tech Stack

### Frontend
- **Vue.js 3** - Progressive JavaScript framework
- **Vite** - Fast build tool and development server
- **Pinia** - State management
- **Vue Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Firebase SDK** - Authentication and Firestore integration

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Firebase Admin SDK** - Server-side Firebase integration
- **JWT** - JSON Web Tokens for authentication
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

### Infrastructure
- **Firebase Firestore** - NoSQL document database
- **Firebase Authentication** - User management
- **Vercel** - Deployment and hosting platform
- **GitHub Actions** - CI/CD pipeline

## 🚦 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Firebase project setup
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/xmbl/app-generator.git
   cd xmbl-app-generator
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Environment Setup**
   
   Create `.env` files in both frontend and backend directories:
   
   **Frontend (.env)**
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_API_BASE_URL=http://localhost:3000/api
   ```
   
   **Backend (.env)**
   ```env
   PORT=3000
   NODE_ENV=development
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_PRIVATE_KEY=your_private_key
   FIREBASE_CLIENT_EMAIL=your_client_email
   JWT_SECRET=your_jwt_secret
   CORS_ORIGIN=http://localhost:5173
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   This will start both frontend (http://localhost:5173) and backend (http://localhost:3000) servers.

### Firebase Setup

1. Create a new Firebase project
2. Enable Authentication with Email/Password provider
3. Create a Firestore database
4. Generate service account credentials
5. Add your domain to Firebase Auth authorized domains

## 📚 Usage

### Creating Your First App

1. **Sign Up/Login** - Create an account or login to existing one
2. **Create New App** - Click "New App" and provide basic information
3. **Design Pages** - Use the visual builder to create your app pages
4. **Add Components** - Drag and drop components from the library
5. **Configure Functions** - Add custom JavaScript functions and event handlers
6. **Preview** - Test your app in real-time preview mode
7. **Deploy** - One-click deployment to your subdomain

### Visual Builder Features

- **Page Management** - Create, edit, and delete pages
- **Component Library** - Pre-built components (buttons, forms, cards, etc.)
- **Layout System** - Responsive grid and flexbox layouts
- **Styling** - Visual CSS editor with Tailwind classes
- **Data Binding** - Connect components to data sources
- **Event Handlers** - Mouse, keyboard, and lifecycle events

## 🔧 API Reference

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### App Management
- `GET /api/apps` - List user's apps
- `POST /api/apps` - Create new app
- `GET /api/apps/:id` - Get app details
- `PUT /api/apps/:id` - Update app
- `DELETE /api/apps/:id` - Delete app

### Builder API
- `GET /api/apps/:id/pages` - Get app pages
- `POST /api/apps/:id/pages` - Create new page
- `PUT /api/apps/:id/pages/:pageId` - Update page
- `DELETE /api/apps/:id/pages/:pageId` - Delete page

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**
   ```bash
   vercel link
   ```

2. **Environment Variables**
   Add all production environment variables in Vercel dashboard

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Custom Domain Setup

1. Add custom domain in Vercel dashboard
2. Update DNS records
3. Configure SSL certificate (automatic with Vercel)

## 🧪 Testing

```bash
# Run all tests
npm run test

# Frontend tests only
npm run test:frontend

# Backend tests only
npm run test:backend
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@xmbl.dev
- 💬 Discord: [Join our community](https://discord.gg/xmbl)
- 📖 Documentation: [docs.xmbl.dev](https://docs.xmbl.dev)
- 🐛 Issues: [GitHub Issues](https://github.com/xmbl/app-generator/issues)

## 🗺️ Roadmap

- [ ] **v1.1** - Advanced component editor
- [ ] **v1.2** - Database visual designer
- [ ] **v1.3** - API builder interface
- [ ] **v1.4** - Team collaboration features
- [ ] **v2.0** - Mobile app generation
- [ ] **v2.1** - Third-party integrations
- [ ] **v2.2** - Marketplace for components and templates

---

Made with ❤️ by the XMBL Team