# Data Sampling & Analysis Platform

A modern web application for data sampling, exploration, and analysis built with React, TypeScript, and Vite.

## Features

### 📊 Dataset Management
- Upload and manage multiple datasets with versioning support
- View dataset metadata, statistics, and sample data
- Tag-based organization and filtering
- Support for multiple file formats

### 🔍 Data Exploration
- Interactive data preview with column-wise analysis
- Data type detection and statistics
- Null value analysis and distribution
- Column metadata visualization

### 📈 Advanced Sampling Methods
- **Random Sampling**: Simple random selection with optional seed
- **Stratified Sampling**: Proportional sampling across multiple strata
- **Systematic Sampling**: Select every nth row with configurable start
- **Cluster Sampling**: Sample entire clusters or within clusters
- **Custom Sampling**: SQL-like WHERE clause filtering

### 🎯 Key Capabilities
- Real-time column filtering by data type and null percentage
- Dynamic row filtering with type-aware operators
- Pagination support for large datasets
- Export sampling results
- Multi-round sampling workflows

## Tech Stack

- **Frontend Framework**: React 19.1.0 with TypeScript
- **Build Tool**: Vite 6.3.5
- **Styling**: Tailwind CSS 4.1.6 with Shadcn UI components
- **Routing**: Tanstack Router
- **State Management**: Tanstack Query + React Context
- **Forms**: React Hook Form with Zod validation
- **Authentication**: JWT with refresh tokens
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Charts**: Recharts

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API server (see API documentation)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shadcn-dsa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your API URL:
   ```
   VITE_API_BASE_URL=http://localhost:8000/api
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Base UI components (Shadcn)
│   ├── auth/           # Authentication components
│   ├── sampling/       # Sampling feature components
│   ├── exploration/    # Data exploration components
│   └── shared/         # Shared/common components
├── features/           # Feature modules (vertical slices)
│   ├── auth/          # Authentication feature
│   ├── datasets/      # Dataset management
│   ├── exploration/   # Data exploration
│   └── sampling/      # Data sampling
├── hooks/             # Custom React hooks
├── lib/               # Utilities and configurations
│   ├── api/          # API client and types
│   └── query/        # React Query utilities
├── routes/            # Page components and routing
├── services/          # Business logic services
├── contexts/          # React contexts
└── types/            # TypeScript type definitions
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

The project uses ESLint with TypeScript support. Configuration can be found in `eslint.config.js`.

### Path Aliases

The project uses path aliases for cleaner imports:
- `@/*` - Maps to `src/*`

Example:
```typescript
import { Button } from '@/components/ui/button'
```

## Authentication

The application uses JWT-based authentication with refresh tokens. Protected routes require authentication and will redirect to the login page if not authenticated.

## API Integration

The application expects a backend API with the following endpoints:
- `/users/token` - Authentication
- `/datasets` - Dataset management
- `/sampling` - Sampling operations
- `/explore` - Data exploration

See the API client configuration in `src/lib/api/` for detailed endpoint definitions.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.