# Galyan's E-Commerce Website

A modern, responsive e-commerce platform built for Kenya's online shopping market. This project features a complete shopping experience with product categories, user authentication, shopping cart, and secure checkout with M-Pesa integration.

## Features

- **Product Catalog**: Browse products across multiple categories (Electronics, Fashion, Beauty, Home, Sports, Groceries)
- **User Authentication**: Secure login and registration system
- **Shopping Cart**: Add, remove, and manage cart items
- **Product Details**: Detailed product pages with images, reviews, and specifications
- **Search & Filtering**: Search products and filter by category
- **Responsive Design**: Mobile-first design that works on all devices
- **M-Pesa Integration**: Secure payment processing for Kenyan users
- **Admin Dashboard**: Product and order management for administrators

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Router** for navigation
- **React Query** for data fetching and caching
- **Lucide React** for icons

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** for authentication
- **bcrypt** for password hashing
- **M-Pesa API** for payments

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB database

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd galyan-shop
   ```

2. **Install dependencies**
   ```bash
   # Frontend dependencies
   npm install

   # Backend dependencies
   cd backend
   npm install
   cd ..
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env` in the backend directory
   - Configure your MongoDB connection string
   - Add your M-Pesa API credentials
   - Set JWT secret

4. **Start the development servers**
   ```bash
   # Start backend server
   cd backend
   npm run dev

   # In another terminal, start frontend
   npm run dev
   ```

5. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## Project Structure

```
galyan-shop/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions and API client
│   └── ...
├── backend/
│   ├── controllers/        # Route controllers
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   └── ...
├── public/                 # Static assets
└── ...
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

This project can be deployed to various platforms:

- **Frontend**: Vercel, Netlify, or any static hosting
- **Backend**: Heroku, Railway, or any Node.js hosting
- **Database**: MongoDB Atlas for cloud database

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
