# GPS Shortest Path

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### GET `/routing`
Calculate shortest path between two coordinates.

**Parameters:**
- `start`: Starting coordinates (format: `lat,lng`)
- `end`: Ending coordinates (format: `lat,lng`)
- `profile`: Routing profile (optional, default: `driving`)

**Example Request:**
```bash
GET /api/routing?start=39.9208,32.8541&end=39.9334,32.8597&profile=driving
```

**Response:**
```json
{
  "success": true,
  "source": "OSRM",
  "weight": 200,
  "duration": 200,
  "distance": 2516.3,
  "path": [
    [32.854104, 39.92086],
    [32.853909, 39.920869],
    // ... more coordinates
  ],
  "steps": [
    {
      "name": "Kızılay Myd.",
      "distance": 16.7,
      "duration": 8.7,
      "maneuver": {
        "type": "depart",
        "modifier": "left",
        "location": [32.854104, 39.92086]
      }
    }
    // ... more steps
  ]
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Route not found",
  "errorType": "NO_PATH_FOUND"
}
```

## Installation & Setup

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the server:**
```bash
npm start
```

The backend will be running on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

The frontend will be running on `http://localhost:3000`

## Environment Variables

### Backend
```env
PORT=5000
```

### Frontend
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Acknowledgments

- [OpenStreetMap](https://www.openstreetmap.org/) for map data
- [OSRM](http://project-osrm.org/) for routing engine
- [Leaflet](https://leafletjs.com/) for interactive maps
- [Next.js](https://nextjs.org/) for React framework
