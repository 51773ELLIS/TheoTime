# TheoTime

A self-hosted, offline-first web application designed to help families (especially Jehovah's Witnesses) organize their weekly Family Worship, assign and review homework, track spiritual goals, and optionally use an AI assistant to generate personalized plans and suggestions.

## Features

- 🔐 **User Management**: Secure login with role-based access (Parent/Admin, Child/User)
- 📅 **Worship Calendar**: Weekly recurring Family Worship Night with interactive calendar
- 🧒 **Children Profiles**: Track spiritual goals, interests, and progress
- 📋 **Worship Planner**: Create and manage worship sessions with templates
- 📝 **Homework/Assignments**: Assign and track spiritual homework
- 🤖 **AI Assistant**: Optional OpenAI integration for personalized suggestions
- ⚙️ **Settings Panel**: Comprehensive configuration and data management
- 📊 **Dashboard**: Overview of upcoming events and progress

## Tech Stack

- **Backend**: Node.js + Express + SQLite
- **Frontend**: Vue 3 (Composition API) + TailwindCSS + Pinia
- **Authentication**: JWT-based
- **Database**: SQLite (local, file-based)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install:all
   ```
3. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```
4. Start development servers:
   ```bash
   npm run dev
   ```

## Development

- Backend runs on `http://localhost:3000`
- Frontend runs on `http://localhost:5173` (Vite default)

## Production Deployment

See `docker/` directory for Docker setup.

## Security & Privacy

- All data is stored locally
- No cloud data unless user sets up encrypted backup
- JW.org content only linked (never scraped)
- Passwords are hashed using bcrypt
- Role-based permissions enforced

## License

MIT
