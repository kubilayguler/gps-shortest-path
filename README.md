# 🚚 GPS Shortest Path - Delivery Route Optimization System

A full-stack web application for optimizing delivery routes using advanced Traveling Salesman Problem (TSP) algorithms. The system calculates the most efficient routes for delivery drivers, reducing travel time and fuel costs while providing real-time tracking and management.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-14%2B-blue.svg)

## Quick Start - Demo Users

After running the application with Docker, you can login with these pre-configured demo accounts:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
|  **Admin** | `admin@demo.com` | `demo123` | Full system access, manage all companies and users |
|  **Manager** | `manager@demo.com` | `demo123` | Company-level management, orders and employees |
|  **Employee** | `employee@demo.com` | `demo123` | Create and manage warehouse orders |
|  **Driver** | `driver@demo.com` | `demo123` | View assigned orders and calculate routes |

**Demo Company**: Demo Delivery Company (Konya, Turkey)  
**Demo Warehouse**: Central Warehouse (Meram, Konya)

## Features

### Route Optimization
- **Advanced TSP Algorithm**: Multi-start approach combining Nearest Neighbor, Farthest Insertion, and 2-Opt optimization
- **Smart Routing**: Eliminates unnecessary back-and-forth travel
- **Multi-Stop Planning**: Efficiently handle routes with dozens of delivery points
- **Real-time Calculation**: Fast route computation using OSRM (Open Source Routing Machine)

### Delivery Management
- **Delivery Grouping**: Organize orders into delivery batches (Delivery 1, Delivery 2, etc.)
- **Status Tracking**: Monitor orders through their lifecycle (Pending → Assigned → In Transit → Delivered)
- **Driver Assignment**: Assign specific drivers to orders and track their progress
- **Progress Monitoring**: Real-time updates on delivery completion

### Interactive Maps
- **Dynamic Centering**: Map automatically focuses on current delivery location
- **Route Visualization**: Clear display of optimized paths with waypoints
- **Progress Indicators**: Visual representation of completed vs remaining stops
- **Warehouse Markers**: Clearly marked starting points

### Role-Based Access Control
- **Admin**: Full system access, user and company management
- **Manager**: Company-level order management and analytics
- **Employee**: Warehouse-specific order creation
- **Driver**: Personal delivery tracking and route access

### Multi-tenant Support
- **Company Management**: Support for multiple delivery companies
- **Warehouse Coordination**: Multiple warehouses per company
- **Isolated Data**: Company-specific data separation

## Tech Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT + Cookie-based sessions
- **Routing Engine**: OSRM (OpenStreetMap Routing Machine)
- **API Design**: RESTful with JSON responses

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Maps**: Leaflet with React-Leaflet
- **State Management**: React Hooks + Context API
- **HTTP Client**: Fetch API with custom wrappers

### DevOps
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL in Docker
- **Environment**: .env configuration
- **Version Control**: Git

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14 or higher
- **npm**: v9.0.0 or higher (or yarn/pnpm)
- **Docker**: Optional, for containerized deployment

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/kubilayguler/gps-shortest-path.git
cd gps-shortest-path
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

**Backend .env Configuration:**
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=gps_shortest_path
DB_USER=postgres
DB_PASSWORD=your_password

CORS_ORIGIN=http://localhost:3000

JWT_SECRET=your_jwt_secret_change_in_production
SESSION_SECRET=your_session_secret_change_in_production
```

### 3. Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE gps_shortest_path;"

### 4. Frontend Setup

```bash
cd ../frontend
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local
nano .env.local
```

**Frontend .env.local Configuration:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NODE_ENV=development
```

### 5. Start Development Servers

```bash
# Terminal 1 - Start Backend
cd backend
npm start

# Terminal 2 - Start Frontend
cd frontend
npm run dev
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Manual Docker Build

```bash
# Build backend
cd backend
docker build -t gps-backend .

# Build frontend
cd ../frontend
docker build -t gps-frontend .

# Run PostgreSQL
docker run -d \
  --name gps-postgres \
  -e POSTGRES_DB=gps_shortest_path \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:14

# Run backend
docker run -d \
  --name gps-backend \
  --link gps-postgres:postgres \
  -p 5000:5000 \
  gps-backend

# Run frontend
docker run -d \
  --name gps-frontend \
  --link gps-backend:backend \
  -p 3000:3000 \
  gps-frontend
```

## API Documentation

### Authentication Endpoints

#### `POST /api/auth/register`
Register a new user account.

**Request:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role_id": 4,
  "company_id": "uuid-here",
  "warehouse_id": "uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "username": "john_doe",
      "email": "john@example.com",
      "role_id": 4
    }
  }
}
```

#### `POST /api/auth/login`
Authenticate user and create session.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "username": "john_doe",
      "email": "john@example.com",
      "role": 4,
      "company_id": "uuid",
      "warehouse_id": "uuid"
    }
  }
}
```

**Sets Cookie:** `authToken` (HttpOnly, Secure in production)

#### `POST /api/auth/logout`
End user session and clear cookies.

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### `GET /api/auth/me`
Get currently authenticated user information.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "john_doe",
      "email": "john@example.com",
      "role": 4,
      "company_id": "uuid",
      "warehouse_id": "uuid"
    }
  }
}
```

---

### User Management

#### `GET /api/users`
Get all users with optional filtering.

**Authentication:** Required (Admin/Manager)

**Query Parameters:**
- `company_id` (optional): Filter by company
- `role_id` (optional): Filter by role

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "username": "john_doe",
      "email": "john@example.com",
      "role_id": 4,
      "company_id": "uuid",
      "warehouse_id": "uuid",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

#### `GET /api/users/:id`
Get specific user by ID.

**Authentication:** Required

#### `POST /api/users`
Create a new user.

**Authentication:** Required (Admin/Manager)

**Request:**
```json
{
  "username": "jane_smith",
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "role_id": 3,
  "company_id": "uuid",
  "warehouse_id": "uuid"
}
```

#### `PUT /api/users/:id`
Update user information.

**Authentication:** Required

#### `DELETE /api/users/:id`
Delete user account.

**Authentication:** Required (Admin only)

---

### Company Management

#### `GET /api/companies`
Get all companies.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Fast Delivery Co",
      "address": "123 Main St, City",
      "phone": "+90 555 123 4567",
      "email": "info@fastdelivery.com",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

#### `POST /api/companies`
Create new company.

**Authentication:** Required (Admin only)

**Request:**
```json
{
  "name": "Fast Delivery Co",
  "address": "123 Main St, City",
  "phone": "+90 555 123 4567",
  "email": "info@fastdelivery.com"
}
```

#### `PUT /api/companies/:id`
Update company information.

**Authentication:** Required (Admin only)

#### `DELETE /api/companies/:id`
Delete company.

**Authentication:** Required (Admin only)

---

### Warehouse Management

#### `GET /api/warehouses`
Get warehouses with optional company filtering.

**Authentication:** Required

**Query Parameters:**
- `company_id` (optional): Filter by company

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Central Warehouse",
      "address": "456 Storage Ave, City",
      "latitude": 37.8557,
      "longitude": 32.5085,
      "company_id": "uuid",
      "createdAt": "2025-01-05T00:00:00Z"
    }
  ]
}
```

#### `POST /api/warehouses`
Create new warehouse (geocoding automatic).

**Authentication:** Required (Admin/Manager)

**Request:**
```json
{
  "name": "Central Warehouse",
  "address": "456 Storage Ave, Konya, Turkey",
  "company_id": "uuid"
}
```

**Note:** Latitude and longitude are automatically geocoded from the address.

#### `PUT /api/warehouses/:id`
Update warehouse information.

**Authentication:** Required (Admin/Manager)

#### `DELETE /api/warehouses/:id`
Delete warehouse.

**Authentication:** Required (Admin only)

---

### Order Management

#### `GET /api/orders`
Get orders with filtering.

**Authentication:** Required

**Query Parameters:**
- `company_id`: Company ID (required for non-admins)
- `warehouse_id` (optional): Filter by warehouse
- `driver_id` (optional): Filter by driver
- `status` (optional): pending, assigned, in_transit, delivered, cancelled

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "cargo_name": "Package #12345",
      "delivery_address": "789 Customer St, City",
      "latitude": 37.8600,
      "longitude": 32.5100,
      "status": "assigned",
      "driver_id": "uuid",
      "warehouse_id": "uuid",
      "company_id": "uuid",
      "delivery_group_id": null,
      "delivery_group_name": null,
      "createdAt": "2025-01-20T08:00:00Z"
    }
  ]
}
```

#### `GET /api/orders/my-orders`
Get driver's assigned orders (grouped by delivery).

**Authentication:** Required (Driver only)

**Response:**
```json
{
  "success": true,
  "data": {
    "grouped": {
      "uuid-delivery-group-1": [
        {
          "id": "uuid",
          "cargo_name": "Package #001",
          "delivery_address": "123 St",
          "status": "in_transit",
          "delivery_group_id": "uuid-delivery-group-1",
          "delivery_group_name": "Delivery 1"
        }
      ]
    },
    "ungrouped": [
      {
        "id": "uuid",
        "cargo_name": "Package #999",
        "delivery_address": "456 Ave",
        "status": "assigned"
      }
    ]
  }
}
```

#### `POST /api/orders`
Create new order (geocoding automatic).

**Authentication:** Required (Admin/Manager/Employee)

**Request:**
```json
{
  "cargo_name": "Package #12345",
  "delivery_address": "789 Customer St, Konya, Turkey",
  "warehouse_id": "uuid",
  "company_id": "uuid",
  "driver_id": "uuid"
}
```

#### `PUT /api/orders/:id`
Update order details.

**Authentication:** Required

**Request:**
```json
{
  "cargo_name": "Updated Package Name",
  "delivery_address": "New Address",
  "driver_id": "uuid",
  "warehouse_id": "uuid"
}
```

#### `DELETE /api/orders/:id`
Delete order.

**Authentication:** Required (Admin/Manager)

#### `POST /api/orders/start-delivery`
Create delivery group and optimize route.

**Authentication:** Required (Driver)

**Request:**
```json
{
  "orderIds": ["uuid1", "uuid2", "uuid3", "uuid4"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Delivery started successfully",
  "data": {
    "deliveryGroupId": "uuid",
    "deliveryGroupName": "Delivery 3",
    "orders": [...]
  }
}
```

**Note:** Automatically generates sequential delivery names (Delivery 1, Delivery 2, etc.)

#### `PUT /api/orders/:id/status`
Update order delivery status.

**Authentication:** Required (Driver)

**Request:**
```json
{
  "status": "delivered"
}
```

**Valid Status Values:**
- `pending`: Order created, not assigned
- `assigned`: Assigned to driver
- `in_transit`: Driver en route
- `delivered`: Successfully delivered
- `cancelled`: Order cancelled

---

### Routing Endpoints

#### `POST /api/route`
Calculate single route between two points.

**Authentication:** Not required

**Request:**
```json
{
  "start": { "lat": 37.8557, "lng": 32.5085 },
  "end": { "lat": 37.8700, "lng": 32.5200 }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "distance": 5234.5,
    "duration": 420.5,
    "geometry": "encoded_polyline_string",
    "path": [
      [32.5085, 37.8557],
      [32.5090, 37.8560],
      ...
    ]
  }
}
```

#### `POST /api/multi-stop-routing`
Calculate optimized multi-stop route (TSP algorithm).

**Authentication:** Not required

**Request:**
```json
{
  "stops": [
    { "lat": 37.8557, "lng": 32.5085, "name": "Warehouse" },
    { "lat": 37.8600, "lng": 32.5100, "name": "Stop 1" },
    { "lat": 37.8650, "lng": 32.5150, "name": "Stop 2" },
    { "lat": 37.8700, "lng": 32.5200, "name": "Stop 3" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Multi-stop routing processed",
  "data": {
    "route": [
      { "lat": 37.8557, "lng": 32.5085, "name": "Warehouse" },
      { "lat": 37.8600, "lng": 32.5100, "name": "Stop 1" },
      { "lat": 37.8650, "lng": 32.5150, "name": "Stop 2" },
      { "lat": 37.8700, "lng": 32.5200, "name": "Stop 3" }
    ],
    "distances": [2.3, 3.1, 2.8],
    "totalDistance": 8.2
  }
}
```

**Algorithm Details:**
- Multi-start approach (tries up to 6 different starting points)
- Combines Nearest Neighbor and Farthest Insertion heuristics
- Applies 2-Opt improvement to remove route crossings
- Returns the best (shortest) route found
- Prioritizes warehouse (stops[0]) as starting point

---

## Authentication & Authorization

### Authentication Flow
1. User logs in via `/api/auth/login`
2. Server creates JWT token and sets HttpOnly cookie
3. All subsequent requests include cookie automatically
4. Server validates token on protected routes

### Role-Based Permissions

| Feature | Admin | Manager | Employee | Driver |
|---------|-------|---------|----------|--------|
| View all companies | ✅ | ❌ | ❌ | ❌ |
| Manage companies | ✅ | ❌ | ❌ | ❌ |
| View company users | ✅ | ✅ | ❌ | ❌ |
| Create users | ✅ | ✅ | ❌ | ❌ |
| Manage warehouses | ✅ | ✅ | ❌ | ❌ |
| View all orders | ✅ | ✅* | ❌ | ❌ |
| Create orders | ✅ | ✅ | ✅ | ❌ |
| Assign drivers | ✅ | ✅ | ❌ | ❌ |
| View my orders | ✅ | ✅ | ✅ | ✅ |
| Start delivery | ✅ | ✅ | ✅ | ✅ |
| Update order status | ✅ | ✅ | ✅ | ✅ |

*Managers can only view/manage orders within their company

### Middleware Protection
```javascript
// Example: Admin-only route
router.get('/api/companies', 
  authMiddleware, 
  roleMiddleware([1]), // 1 = Admin
  CompanyController.getAll
);

// Example: Manager or Admin route
router.post('/api/orders',
  authMiddleware,
  roleMiddleware([1, 2]), // 1 = Admin, 2 = Manager
  OrderController.create
);
```

---

## 📊 Database Schema

### Core Tables

#### `users`
```sql
id              UUID PRIMARY KEY
username        VARCHAR(255) NOT NULL
email           VARCHAR(255) UNIQUE NOT NULL
password        VARCHAR(255) NOT NULL (hashed)
role_id         INTEGER REFERENCES roles(id)
company_id      UUID REFERENCES companies(id)
warehouse_id    UUID REFERENCES warehouses(id)
created_at      TIMESTAMP
updated_at      TIMESTAMP
deleted_at      TIMESTAMP (soft delete)
```

#### `companies`
```sql
id              UUID PRIMARY KEY
name            VARCHAR(255) NOT NULL
address         TEXT
phone           VARCHAR(50)
email           VARCHAR(255)
created_at      TIMESTAMP
updated_at      TIMESTAMP
deleted_at      TIMESTAMP
```

#### `warehouses`
```sql
id              UUID PRIMARY KEY
name            VARCHAR(255) NOT NULL
address         TEXT NOT NULL
latitude        DECIMAL(10, 8)
longitude       DECIMAL(11, 8)
company_id      UUID REFERENCES companies(id)
created_at      TIMESTAMP
updated_at      TIMESTAMP
deleted_at      TIMESTAMP
```

#### `orders`
```sql
id                      UUID PRIMARY KEY
cargo_name              VARCHAR(255) NOT NULL
delivery_address        TEXT NOT NULL
latitude                DECIMAL(10, 8)
longitude               DECIMAL(11, 8)
status                  VARCHAR(50) DEFAULT 'pending'
driver_id               UUID REFERENCES users(id)
warehouse_id            UUID REFERENCES warehouses(id)
company_id              UUID REFERENCES companies(id)
delivery_group_id       UUID
delivery_group_name     VARCHAR(255)
created_at              TIMESTAMP
updated_at              TIMESTAMP
deleted_at              TIMESTAMP
```

#### `roles`
```sql
id              INTEGER PRIMARY KEY
name            VARCHAR(50) NOT NULL
description     TEXT
```

**Role Values:**
- 1: Admin
- 2: Manager
- 3: Employee
- 4: Driver

### Indexes
```sql
-- Performance indexes
CREATE INDEX idx_orders_driver ON orders(driver_id);
CREATE INDEX idx_orders_warehouse ON orders(warehouse_id);
CREATE INDEX idx_orders_company ON orders(company_id);
CREATE INDEX idx_orders_delivery_group ON orders(delivery_group_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_driver_group ON orders(driver_id, delivery_group_name);
```

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Kubilay Güler** - [@kubilayguler](https://github.com/kubilayguler)

## Acknowledgments

- **OpenStreetMap** - Map data and routing
- **OSRM Project** - Open-source routing engine
- **Leaflet** - Interactive maps
- **Next.js and React** - Amazing frameworks

---

**⭐ If you find this project useful, please consider giving it a star on GitHub!**

