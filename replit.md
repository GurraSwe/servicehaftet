# CarLog - Vehicle Maintenance Tracker

## Overview

CarLog is a vehicle maintenance management application that helps users track their cars, service history, and maintenance reminders. Users can log service records, set recurring reminders for upcoming maintenance, and view spending trends. The application uses Replit Auth for authentication and PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style variant)
- **Build Tool**: Vite with hot module replacement

The frontend follows a pages-based architecture with custom hooks for data fetching. Protected routes redirect unauthenticated users to the landing page. The UI uses a custom automotive-themed color palette with display and body font families (Outfit and Plus Jakarta Sans).

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Replit Auth via OpenID Connect with Passport.js
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

API routes are defined declaratively in `shared/routes.ts` with Zod schemas for input validation. The storage layer (`server/storage.ts`) implements a repository pattern with a `DatabaseStorage` class handling all CRUD operations.

### Data Model
- **Users**: Managed by Replit Auth, stored in `users` table
- **Vehicles**: User-owned vehicles with make, model, year, mileage, and service intervals
- **Services**: Service records linked to vehicles with date, mileage, type, and cost
- **Reminders**: Maintenance reminders with due dates, mileage thresholds, and recurrence options

All database tables use cascading deletes where appropriate (services and reminders delete when parent vehicle is removed).

### Build System
- Development: Vite dev server with Express backend via `tsx`
- Production: esbuild bundles server code, Vite builds client assets to `dist/public`
- Database migrations: Drizzle Kit with `db:push` command

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries with schema defined in `shared/schema.ts`

### Authentication
- **Replit Auth**: OpenID Connect integration requiring `REPL_ID`, `ISSUER_URL`, and `SESSION_SECRET` environment variables
- Session data stored in PostgreSQL `sessions` table

### UI Components
- **shadcn/ui**: Radix UI primitives with Tailwind styling
- **Recharts**: Data visualization for mileage and cost trends
- **Lucide React**: Icon library
- **date-fns**: Date formatting with Swedish locale support

### Development Tools
- **TypeScript**: Strict mode enabled across client, server, and shared code
- **Replit Vite plugins**: Runtime error overlay, cartographer, and dev banner for Replit environment