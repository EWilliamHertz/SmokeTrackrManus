# SmokeTrackr 🚬

A comprehensive personal tracking application for monitoring tobacco and nicotine product consumption, managing inventory, and analyzing spending patterns. Built with modern web technologies to help users gain insights into their consumption habits and make informed decisions.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Routes](#api-routes)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Dashboard & Analytics
- **Real-time Dashboard**: View monthly budget status, consumption insights, and product breakdown
- **Time Period Filtering**: Analyze data by day, week, month, or all-time
- **Consumption Insights**: Track total items consumed and average consumption per day
- **Monthly Budget Tracking**: Set budget limits and monitor spending with visual progress bars

### Cost Analytics
- **Comprehensive Cost Metrics**: Cost per day, cost per item, total consumed value
- **Time Period Comparison**: Dynamic filtering (1/3/7/10/14 days, All-Time)
- **Comparative Analytics**: Period-over-period percentage changes with trend indicators
- **Cost Projections**: Monthly spending forecasts based on current consumption rate
- **Budget Warnings**: Visual alerts when projected spending exceeds monthly budget
- **Cost Breakdown**: Pie chart visualization by product type
- **Monthly Trends**: Bar chart showing spending patterns over time
- **Top Products**: Ranked list of most expensive products by total spent

### Inventory Management
- **Product Catalog**: Track cigars, cigarillos, cigarettes, snus, and other products
- **Stock Tracking**: Real-time inventory with automatic calculations
- **Inventory Value**: Total current inventory value and per-product valuations
- **Give Away Feature**: Track products given to others with recipient notes
- **Low Stock Alerts**: Visual indicators for products running low

### Purchase Tracking
- **Purchase History**: Complete record of all product purchases
- **Price Tracking**: Monitor price per unit and total costs
- **Quick Entry**: Fast purchase logging with quantity and date
- **Cost Analysis**: Automatic calculation of average prices and spending trends

### Consumption History
- **Detailed Logs**: Complete consumption history with timestamps
- **Consumption Heatmap**: Interactive calendar showing daily consumption intensity
- **Visual Analytics**: Line and bar charts for consumption trends
- **Entry Management**: Edit or delete consumption entries
- **Pagination**: Navigate through all historical entries
- **Product Breakdown**: View consumption by product type

### Sharing & Export
- **Public Share Links**: Generate read-only links to share progress with others
- **Customizable Sharing**: Choose which sections to share (Dashboard, History, Inventory, Purchases)
- **Excel Export**: Export all data to Excel format for external analysis
- **Data Import**: Import data from Excel files for easy migration

### Settings & Preferences
- **Budget Management**: Set and adjust monthly spending limits
- **Weekly Email Reports**: Toggle automated weekly summaries (requires external scheduler)
- **Currency Support**: Configurable currency settings (default: SEK)
- **Share Link Management**: Generate, view, and revoke public share links

### User Experience
- **Mobile-First Design**: Responsive layout optimized for mobile devices
- **Dark Mode**: Modern dark theme for comfortable viewing
- **Quick Actions**: Fast consumption logging with preset quantity buttons
- **Real-time Updates**: Instant UI updates with optimistic rendering
- **Timezone Support**: Automatic local timezone handling for all timestamps

## 🛠 Tech Stack

### Frontend
- **React 19**: Modern UI library with hooks and concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Utility-first styling with custom design tokens
- **shadcn/ui**: High-quality accessible component library
- **tRPC**: End-to-end typesafe APIs
- **React Query**: Data fetching and caching
- **Recharts**: Interactive data visualizations
- **Wouter**: Lightweight routing
- **Vite**: Fast build tool and dev server

### Backend
- **Node.js 22**: JavaScript runtime
- **Express 4**: Web application framework
- **tRPC 11**: Type-safe API layer
- **Drizzle ORM**: TypeScript ORM for database operations
- **MySQL/TiDB**: Relational database
- **Superjson**: Enhanced JSON serialization

### Development Tools
- **pnpm**: Fast, disk-efficient package manager
- **ESLint**: Code linting
- **TypeScript Compiler**: Type checking
- **Drizzle Kit**: Database migrations

## 🚀 Getting Started

### Prerequisites
- Node.js 22.x or higher
- pnpm 9.x or higher
- MySQL or TiDB database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/EWilliamHertz/SmokeTrackrManus.git
   cd SmokeTrackrManus
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=mysql://user:password@host:port/database
   JWT_SECRET=your-secret-key-here
   VITE_APP_TITLE=SmokeTrackr
   VITE_APP_LOGO=https://your-logo-url.com/logo.png
   ```

4. **Run database migrations**
   ```bash
   pnpm db:push
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Access the application**
   
   Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
pnpm build
pnpm start
```

## 📁 Project Structure

```
smoketrackr/
├── client/                 # Frontend application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ui/       # shadcn/ui components
│   │   │   ├── ConsumptionHeatmap.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   └── ...
│   │   ├── pages/        # Page-level components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── CostAnalytics.tsx
│   │   │   ├── History.tsx
│   │   │   ├── Inventory.tsx
│   │   │   ├── Purchases.tsx
│   │   │   ├── Consumption.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── ...
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # Custom hooks
│   │   ├── lib/          # Utilities and configurations
│   │   │   └── trpc.ts   # tRPC client setup
│   │   ├── App.tsx       # Routes and layout
│   │   ├── main.tsx      # Application entry point
│   │   └── index.css     # Global styles
│   └── index.html
├── server/                # Backend application
│   ├── _core/            # Core server infrastructure
│   │   ├── context.ts    # tRPC context
│   │   ├── trpc.ts       # tRPC setup
│   │   ├── oauth.ts      # Authentication
│   │   └── ...
│   ├── db.ts             # Database query helpers
│   ├── routers.ts        # tRPC API routes
│   └── importExport.ts   # Data import/export logic
├── drizzle/              # Database schema and migrations
│   └── schema.ts         # Database table definitions
├── shared/               # Shared constants and types
├── storage/              # S3 storage helpers
├── package.json
├── tsconfig.json
├── vite.config.ts
└── drizzle.config.ts
```

## 🗄 Database Schema

### Core Tables

**users**
- User authentication and profile information
- Roles: `user`, `admin`

**products**
- Product catalog (cigars, cigarettes, snus, etc.)
- Product types and flavor details

**purchases**
- Purchase history with pricing
- Quantity and cost tracking

**consumption**
- Consumption logs with timestamps
- Decimal quantity support (e.g., 0.5 for half a cigar)

**giveaways**
- Track products given away
- Recipient and notes fields

**userSettings**
- Monthly budget preferences
- Share link tokens
- Weekly report preferences

## 🔌 API Routes

### Authentication
- `auth.me` - Get current user
- `auth.logout` - Logout user

### Dashboard
- `dashboard.stats` - Get dashboard statistics with date filtering

### Products
- `products.list` - List all products
- `products.create` - Create new product
- `products.update` - Update product
- `products.delete` - Delete product

### Purchases
- `purchases.list` - List all purchases
- `purchases.create` - Create new purchase
- `purchases.delete` - Delete purchase

### Consumption
- `consumption.list` - List consumption history
- `consumption.create` - Log consumption
- `consumption.update` - Update consumption entry
- `consumption.delete` - Delete consumption entry

### Giveaways
- `giveaways.list` - List giveaways
- `giveaways.create` - Record giveaway
- `giveaways.delete` - Delete giveaway

### Settings
- `settings.get` - Get user settings
- `settings.update` - Update settings
- `settings.generateShareToken` - Generate public share link
- `settings.updateSharePreferences` - Update share visibility
- `settings.revokeShareToken` - Revoke share link

### Import/Export
- `importExport.exportData` - Export all data
- `importExport.importData` - Import data from Excel

### Share
- `share.getPublicData` - Get public data via share token

## 🤝 Contributing

Contributions are welcome! Here are some ways you can help:

### Feature Requests
- Goals & Milestones tracking
- Product notes for consumption entries
- Data backup reminders
- Advanced filtering and search
- Multi-currency support
- Social features and challenges

### Bug Reports
Please open an issue with:
- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

### Development Guidelines
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with [Manus](https://manus.im) - AI-powered development platform
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)

## 📧 Contact

Ernst-William Hertz - ernst.hertz@gmail.com

Project Link: [https://github.com/EWilliamHertz/SmokeTrackrManus](https://github.com/EWilliamHertz/SmokeTrackrManus)

---

**Note**: This application is designed for personal tracking and analysis purposes. Please use responsibly and be aware of health implications related to tobacco and nicotine consumption.
