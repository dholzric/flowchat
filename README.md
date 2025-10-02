# FlowChat

A next-generation team collaboration platform - A better Slack alternative.

## Features

### Core Features
- 🔐 User authentication (Email/Password + OAuth)
- 🏢 Workspace management
- 💬 Real-time messaging
- 📺 Public and private channels
- 💌 Direct messages (1-on-1 and group)
- 🧵 Message threading
- 📎 File attachments
- 😀 Reactions and emojis
- 🔍 Full-text search
- 🔔 Real-time notifications
- 👀 User presence and typing indicators

### Advanced Features (Better than Slack)
- 🤖 AI-powered message summarization
- 📊 Analytics dashboard
- ✅ Built-in task management
- 🎯 Custom workflows and automations
- 📞 Voice/video calls (WebRTC)
- 📝 Advanced markdown and code snippets
- 🗳️ Polls and voting

## Technology Stack

### Backend
- Node.js + TypeScript
- Express.js
- Socket.IO (WebSockets)
- PostgreSQL + Redis
- Prisma ORM
- JWT Authentication

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS + Radix UI
- Zustand + React Query
- Socket.IO client

### DevOps
- Docker + Docker Compose
- GitHub Actions
- Jest/Vitest + Playwright

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Docker (optional)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/flowchat.git
cd flowchat
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd frontend
npm install
```

4. Set up environment variables (see `.env.example`)

5. Run database migrations
```bash
cd backend
npm run migrate
```

6. Start development servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Project Structure

```
flowchat/
├── backend/          # Node.js backend
├── frontend/         # React frontend
├── docker-compose.yml
└── README.md
```

## Development Roadmap

- [x] Project setup
- [ ] Authentication system
- [ ] Workspace management
- [ ] Real-time messaging
- [ ] Channels and DMs
- [ ] File uploads
- [ ] Search functionality
- [ ] Notifications
- [ ] Advanced features

## Contributing

Contributions are welcome! Please read our contributing guidelines.

## License

MIT

---

🤖 Built with Claude Code
