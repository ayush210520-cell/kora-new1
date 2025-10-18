# API Integration Setup Guide

## Backend Setup

### 1. Install Dependencies
```bash
cd Backend
npm install
```

### 2. Environment Variables
Create a `.env` file in the Backend directory with:
```env
# Database
DATABASE_URL="your_database_connection_string"
JWT_SECRET="your_jwt_secret_key"

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# Razorpay (for payments)
RAZORPAY_KEY_ID="your_razorpay_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"
RAZORPAY_WEBHOOK_SECRET="your_razorpay_webhook_secret"

# Shiprocket (for shipping)
SHIPROCKET_EMAIL="your_shiprocket_email"
SHIPROCKET_PASSWORD="your_shiprocket_password"
SHIPROCKET_PICKUP_LOCATION="your_warehouse_location"

# Server
PORT=3001
NODE_ENV=development
```

### 3. Database Setup
```bash
# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### 4. Start Backend Server
```bash
npm start
# or
node server.js
```

## Frontend Setup

### 1. Install Dependencies
```bash
cd Code
npm install
# or
yarn install
# or
pnpm install
```

### 2. Environment Variables
Create a `.env.local` file in the Code directory with:
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 3. Start Frontend Development Server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `PUT /api/auth/update` - Update user profile
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/admin/logout` - Admin logout

### Products
- `GET /api/products` - Get all products (with pagination, filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)
- `GET /api/products/categories` - Get all categories
- `POST /api/products/categories` - Create category (admin only)
- `PUT /api/products/categories/:id` - Update category (admin only)

### Addresses
- `GET /api/addresses` - Get user addresses (authenticated)
- `POST /api/addresses` - Create address (authenticated)
- `PUT /api/addresses/:id` - Update address (authenticated)
- `DELETE /api/addresses/:id` - Delete address (authenticated)

### Orders
- `POST /api/orders` - Create order (authenticated)
- `GET /api/orders/:id` - Get order details (authenticated)
- `PUT /api/orders/:id/status` - Update order status (admin only)
- `POST /api/orders/webhook/razorpay` - Razorpay webhook
- `POST /api/orders/webhook/shiprocket` - Shiprocket webhook

## Authentication Flow

1. **User Registration/Login**: User provides credentials, receives JWT token
2. **Token Storage**: Token is stored in localStorage
3. **API Calls**: All authenticated requests include `Authorization: Bearer <token>` header
4. **Route Protection**: Cart and checkout pages are protected with `ProtectedRoute` component
5. **Token Validation**: Backend validates JWT token on each protected request
6. **Logout**: Token is blacklisted on backend, removed from localStorage

## Features Implemented

### Backend
- ✅ JWT-based authentication with token blacklisting
- ✅ Role-based access control (user/admin)
- ✅ Input validation with express-validator
- ✅ File upload handling with multer
- ✅ RESTful API design following standards
- ✅ Comprehensive error handling
- ✅ Database integration with Prisma
- ✅ Payment integration (Razorpay)
- ✅ Shipping integration (Shiprocket)

### Frontend
- ✅ Authentication context with React hooks
- ✅ Protected routes for cart and checkout
- ✅ API service layer with TypeScript interfaces
- ✅ Token management and automatic header injection
- ✅ Responsive design with Tailwind CSS
- ✅ Form validation and error handling
- ✅ Loading states and user feedback

## Security Features

- JWT tokens with expiration
- Token blacklisting on logout
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Environment variable protection
- Secure password hashing (bcrypt)

## Testing the Integration

1. Start both backend and frontend servers
2. Register a new user account
3. Browse products (public access)
4. Add items to cart
5. Proceed to checkout (requires authentication)
6. Complete order with address and payment method
7. View order details and tracking

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS is properly configured
2. **Authentication Failures**: Check JWT_SECRET in backend .env
3. **Database Connection**: Verify DATABASE_URL in backend .env
4. **File Uploads**: Ensure Cloudinary credentials are correct
5. **Payment Issues**: Verify Razorpay credentials

### Debug Mode

Set `NODE_ENV=development` in backend .env for detailed error messages.

## Next Steps

- Add user profile management
- Implement order history
- Add admin dashboard
- Implement search and filtering
- Add product reviews and ratings
- Implement wishlist functionality
- Add email notifications
- Implement real-time order tracking
