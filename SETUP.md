# FlowChat Setup Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ running
- Redis 7+ running
- Git installed

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/dholzric/flowchat.git
cd flowchat
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/flowchat?schema=public"
# REDIS_URL="redis://localhost:6379"
# JWT_SECRET=your-secret-key

# Generate Prisma client
npm run generate

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

Backend will run on http://localhost:3000

### 3. Setup Frontend

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

Frontend will run on http://localhost:5173

### 4. Using Docker (Alternative)

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Then follow steps 2 and 3 above
```

## First Time Setup

1. Open http://localhost:5173 in your browser
2. Click "Sign up" to create an account
3. After registering, create your first workspace
4. Create channels and invite team members
5. Start chatting!

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get current user
- PATCH `/api/auth/me` - Update profile

### Workspaces
- POST `/api/workspaces` - Create workspace
- GET `/api/workspaces` - List user workspaces
- GET `/api/workspaces/:id` - Get workspace details
- POST `/api/workspaces/:id/invite` - Invite user to workspace

### Channels
- POST `/api/channels/workspace/:workspaceId` - Create channel
- GET `/api/channels/workspace/:workspaceId` - List channels
- GET `/api/channels/:id` - Get channel details
- POST `/api/channels/:id/join` - Join channel
- DELETE `/api/channels/:id/leave` - Leave channel

### Messages
- GET `/api/messages/channel/:channelId` - Get messages
- GET `/api/messages/:messageId/replies` - Get thread replies
- PATCH `/api/messages/:messageId` - Update message
- DELETE `/api/messages/:messageId` - Delete message
- POST `/api/messages/:messageId/reactions` - Add reaction
- GET `/api/messages/workspace/:workspaceId/search` - Search messages

### Direct Messages
- GET `/api/dm` - List conversations
- POST `/api/dm` - Create conversation
- GET `/api/dm/:conversationId/messages` - Get DM messages

### File Upload
- POST `/api/upload` - Upload single file
- POST `/api/upload/multiple` - Upload multiple files

## WebSocket Events

### Client → Server
- `message:send` - Send a message
- `message:update` - Update a message
- `message:delete` - Delete a message
- `reaction:add` - Add reaction to message
- `reaction:remove` - Remove reaction
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator
- `channel:join` - Join channel room
- `channel:leave` - Leave channel room

### Server → Client
- `message:new` - New message received
- `message:updated` - Message was updated
- `message:deleted` - Message was deleted
- `reaction:added` - Reaction was added
- `reaction:removed` - Reaction was removed
- `typing:user` - User typing status changed
- `user:status` - User online/offline status changed

## Development Commands

### Backend
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run migrate      # Run database migrations
npm run generate     # Generate Prisma client
npm run studio       # Open Prisma Studio
npm test             # Run tests
npm run lint         # Run linter
```

### Frontend
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
npm run lint         # Run linter
```

## Production Deployment

### Environment Variables

Backend (.env):
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=your-production-database-url
REDIS_URL=your-production-redis-url
JWT_SECRET=your-secure-secret-key
CORS_ORIGIN=https://your-frontend-domain.com
```

Frontend (.env):
```env
VITE_API_URL=https://your-api-domain.com
VITE_WS_URL=https://your-api-domain.com
```

### Build and Deploy

```bash
# Backend
cd backend
npm run build
npm run start

# Frontend
cd frontend
npm run build
# Serve the 'dist' folder with your web server
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in .env
- Run migrations: `npm run migrate`

### Redis Connection Issues
- Ensure Redis is running: `redis-cli ping`
- Check REDIS_URL in .env

### Port Already in Use
- Change PORT in backend/.env
- Update VITE_API_URL in frontend/.env

### WebSocket Connection Failed
- Check CORS_ORIGIN in backend/.env
- Ensure backend server is running
- Check browser console for errors

## Support

- GitHub Issues: https://github.com/dholzric/flowchat/issues
- Documentation: See README.md

---

Built with ❤️ using Node.js, React, PostgreSQL, and Redis
