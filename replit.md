# VocabMaster - Advanced English Vocabulary Generator

## Overview

VocabMaster is a full-stack web application designed to help users expand their English vocabulary through AI-generated words with pronunciations, definitions, and example sentences. The application features a modern React frontend with a Node.js/Express backend, utilizing Google's Gemini AI for vocabulary generation and providing both learning and review modes.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state and React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Storage**: Local Storage for persisting saved vocabulary words

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: Google Gemini AI for vocabulary generation
- **Development**: Hot reload with Vite integration

## Key Components

### Frontend Components
- **VocabularyCard**: Displays generated words with save/unsave functionality
- **ReviewCard**: Shows saved words with removal options
- **Header**: Navigation and mode switching between learning and review
- **ConfirmationModal**: Handles destructive actions like clearing saved words

### Backend Services
- **Gemini Service**: Interfaces with Google's Gemini AI to generate vocabulary
- **Storage Service**: In-memory storage implementation with database schema ready
- **Route Handlers**: RESTful API endpoints for vocabulary generation

### Database Schema
- **Users Table**: User authentication and management
- **Vocabulary Words Table**: Stores generated vocabulary with metadata
- **Drizzle Configuration**: PostgreSQL dialect with migration support

## Data Flow

1. **Vocabulary Generation**: User requests vocabulary → Backend calls Gemini AI → Structured response with words, pronunciations, definitions, and examples
2. **Word Management**: Users can save words to local storage for later review
3. **Mode Switching**: Toggle between learning mode (generate new words) and review mode (study saved words)
4. **Persistence**: Saved words persist across sessions using browser local storage

## External Dependencies

### AI Integration
- **Google Gemini AI**: Primary vocabulary generation service
- **API Configuration**: Requires GEMINI_API_KEY or GOOGLE_API_KEY environment variable
- **Response Format**: Structured JSON with word data including KK phonetic symbols

### UI/UX Libraries
- **Radix UI**: Accessible component primitives
- **Lucide Icons**: Consistent iconography
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Pre-built component library

### Development Tools
- **TypeScript**: Type safety across the stack
- **ESLint/Prettier**: Code quality and formatting
- **Drizzle Kit**: Database migrations and schema management

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite dev server with Express middleware
- **Environment Variables**: DATABASE_URL and GEMINI_API_KEY required
- **Development Scripts**: `npm run dev` for development, `npm run build` for production

### Production Build
- **Frontend**: Vite builds to `dist/public` directory
- **Backend**: esbuild bundles server code to `dist` directory
- **Static Serving**: Express serves built frontend assets
- **Database**: PostgreSQL with Drizzle ORM migrations

### Database Setup
- **Migration System**: Drizzle Kit manages database schema changes
- **Connection**: Neon Database serverless PostgreSQL
- **Schema Location**: `shared/schema.ts` for type-safe database operations

## Changelog

```
Changelog:
- July 01, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```