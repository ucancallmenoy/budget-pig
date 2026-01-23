# Budget Planner

A comprehensive budget management application built with Next.js 15, MongoDB, and TypeScript.

## Features

- **Monthly Dashboard**: Track income, expenses, bills, debts, and savings
- **Annual Overview**: View yearly financial summaries and trends
- **Bills Management**: Track and manage recurring bills with due dates
- **Debt Tracking**: Monitor debts with payment progress
- **Savings Goals**: Set and track savings targets
- **Authentication**: Secure user authentication with NextAuth
- **Responsive Design**: Works seamlessly on desktop and mobile

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB (local or MongoDB Atlas)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd budget-planner
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/budget-planner
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── shared/           # Shared components
│   └── layout/           # Layout components
├── hooks/                # React Query hooks
├── lib/                  # Libraries and utilities
│   ├── auth/            # Authentication logic
│   ├── db/              # Database models
│   └── validations/     # Zod schemas
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── view/                # View components
```

## Features in Detail

### Monthly Dashboard
- View income, expenses, and savings at a glance
- Quick access to bills, debts, and savings management
- Edit monthly income
- Navigate between months

### Bills Management
- Add, edit, and delete bills
- Track payment status
- View overdue bills
- Categorize bills (utilities, rent, insurance, etc.)

### Debt Tracking
- Monitor multiple debts
- Track balances and minimum payments
- Visual progress indicators
- Categorize by debt type

### Savings Goals
- Set savings targets
- Track progress toward goals
- Visual completion indicators
- Multiple savings goals per month

### Annual Overview
- Yearly income and expense summaries
- Monthly breakdown table
- Savings rate calculation
- Year selection dropdown

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.