# ABS REFERZONE - Referral Platform

## Overview

ABS REFERZONE is a comprehensive referral-based earning platform built with a modern full-stack architecture. The application allows users to register, make deposits, request withdrawals, and earn commissions through referrals. It features separate user and admin interfaces, with admin capabilities for managing deposits, withdrawals, and user accounts. The system includes secure authentication, file upload functionality for transaction proofs, and email notifications for various user actions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Styling**: Tailwind CSS with CSS variables for theming and shadcn/ui component library
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation for robust form validation
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for consistent type safety across the stack
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **File Upload**: Multer middleware for handling transaction proof uploads
- **Email**: Nodemailer for transactional email notifications

### Database Design
- **Users Table**: Stores user profiles, balances, referral codes, and roles (user/admin)
- **Deposits Table**: Tracks deposit requests with amounts, transaction IDs, proof files, and approval status
- **Withdrawals Table**: Manages withdrawal requests with payment method details and processing status
- **Transactions Table**: Records all financial transactions for audit trails
- **Settings Table**: Configurable application settings for admin management

### Security and Authentication
- **JWT Tokens**: Secure token-based authentication with 7-day expiration
- **Role-based Access**: Separate user and admin authentication flows
- **Password Security**: Bcrypt hashing for secure password storage
- **File Validation**: Image-only uploads with size limits for transaction proofs
- **Input Validation**: Zod schemas for comprehensive input validation on both client and server

### API Design
- **RESTful Architecture**: Clean REST endpoints for user and admin operations
- **Middleware Stack**: Authentication, file upload, and error handling middleware
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Request Logging**: Comprehensive API request logging for monitoring

## External Dependencies

### Database and Infrastructure
- **Neon Database**: PostgreSQL hosting service for production database
- **Drizzle Kit**: Database migration and schema management tool

### UI and Component Libraries
- **Radix UI**: Accessible component primitives for complex UI elements
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Utility for managing component variants

### Development and Build Tools
- **ESBuild**: Fast bundling for server-side code in production
- **PostCSS & Autoprefixer**: CSS processing for cross-browser compatibility
- **TSX**: TypeScript execution for development server

### Email and File Handling
- **Nodemailer**: SMTP email delivery for user notifications
- **Multer**: File upload middleware for transaction proof handling
- **Node.js File System**: Local file storage for uploaded documents

### Authentication and Security
- **jsonwebtoken**: JWT token generation and verification
- **bcrypt**: Password hashing and verification
- **Zod**: Runtime type validation and schema validation