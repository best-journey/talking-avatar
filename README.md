# Talking Avatar Monorepo

A full-stack application for creating and interacting with AI-powered talking avatars, built with NestJS and Vite in a monorepo structure.

## 🏗️ Architecture

This monorepo contains:

- **Backend** (`apps/backend`): NestJS API server with authentication, user management, and avatar functionality
- **Frontend** (`apps/frontend`): React + Vite application with modern UI
- **Shared** (`packages/shared`): Common types, utilities, and constants

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

```bash
# Install all dependencies
npm run install:all

# Or install dependencies for each workspace individually
npm install
```

### Development

```bash
# Start both backend and frontend in development mode
npm run dev

# Or start them individually
npm run dev:backend    # Backend on http://localhost:3000
npm run dev:frontend   # Frontend on http://localhost:5173
```

### Production

```bash
# Build all applications
npm run build

# Start production servers
npm run start:backend   # Backend production server
npm run start:frontend  # Frontend production build
```

## 📁 Project Structure

```
talking-avatar/
├── apps/
│   ├── backend/          # NestJS API server
│   │   ├── src/
│   │   │   ├── auth/     # Authentication module
│   │   │   ├── users/    # User management
│   │   │   ├── avatar/   # Avatar functionality
│   │   │   └── common/   # Shared utilities
│   │   └── package.json
│   └── frontend/         # React + Vite application
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── pages/      # Page components
│       │   ├── services/   # API services
│       │   └── hooks/      # Custom hooks
│       └── package.json
├── packages/
│   └── shared/           # Shared types and utilities
│       ├── src/
│       │   ├── types/     # TypeScript interfaces
│       │   ├── utils/     # Utility functions
│       │   └── constants/ # Application constants
│       └── package.json
├── package.json           # Root package.json
└── tsconfig.json         # Root TypeScript config
```

## 🛠️ Available Scripts

### Root Level Scripts

- `npm run dev` - Start both backend and frontend in development mode
- `npm run build` - Build all applications
- `npm run lint` - Lint all workspaces
- `npm run test` - Run tests for all workspaces
- `npm run clean` - Clean all node_modules
- `npm run install:all` - Install dependencies for all workspaces

### Backend Scripts (`apps/backend`)

- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Start production server
- `npm run build` - Build the application
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests

### Frontend Scripts (`apps/frontend`)

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues

## 🔧 Configuration

### Environment Variables

#### Backend (`apps/backend/.env`)
```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

#### Frontend (`apps/frontend/.env`)
```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Talking Avatar
```

## 📚 API Documentation

When the backend is running, API documentation is available at:
- Swagger UI: http://localhost:3000/api

## 🎨 Features

### Backend Features
- ✅ RESTful API with NestJS
- ✅ Authentication system
- ✅ User management
- ✅ Avatar CRUD operations
- ✅ Text-to-speech integration (placeholder)
- ✅ Swagger API documentation
- ✅ Input validation with class-validator
- ✅ CORS configuration

### Frontend Features
- ✅ Modern React application with TypeScript
- ✅ Responsive design with Tailwind CSS
- ✅ React Router for navigation
- ✅ Axios for API communication
- ✅ Form handling and validation
- ✅ Component-based architecture
- ✅ Hot module replacement

### Shared Features
- ✅ TypeScript interfaces and types
- ✅ Utility functions
- ✅ Application constants
- ✅ Error and success messages

## 🔮 Future Enhancements

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] JWT authentication
- [ ] Real TTS integration (ElevenLabs, OpenAI)
- [ ] Avatar image generation
- [ ] Real-time communication (WebSockets)
- [ ] File upload for avatar images
- [ ] User preferences and settings
- [ ] Avatar sharing and marketplace
- [ ] Advanced voice customization
- [ ] Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions, please open an issue on GitHub.
