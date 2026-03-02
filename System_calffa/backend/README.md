# Farmers Registration — backend

This directory contains the Node/Express backend for the Farmers app (API endpoints, predictions proxy, database access).

Configuration
- The backend defaults to PORT=5000.
- The backend calls the Python ML service via the environment variable `ML_API_URL`. Default is `http://127.0.0.1:5001`.
- Keep your frontend origin in `FRONTEND_ORIGIN` for CORS (e.g. `http://localhost:5173`).

Quick start (PowerShell):

```powershell
cd backend
# optional: point to an ML service running on a different port
$env:ML_API_URL = 'http://localhost:5001'
npm run start
```

Notes
-- The route `/api/predict` proxies to the prediction service and will persist returned predictions to the `predictions` table when the prediction API returns a result.
-- The default prediction API port has been set to 5001 to avoid a default port conflict with the backend.
# Farmer Registration Backend

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database

Create or update the `.env` file in the `backend` directory with your MySQL database credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_PORT=3306
DB_NAME=your_database_name
```

**Important:** Make sure `DB_NAME` is set to the name of your database where the `farmers` table exists.

### 3. Test Database Connection

Run the test script to verify your database connection:

```bash
node test-connection.js
```

This will:
- Check if your `.env` file is configured correctly
- Test the database connection
- Verify that the `farmers` table exists

### 4. Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## API Endpoints

- **POST** `/api/farmers/register` - Register a new farmer
- **POST** `/api/farmers/login` - Login a farmer
- **GET** `/api/farmers` - Get all farmers (for admin dashboard)

## Troubleshooting

### Database Connection Failed
- Make sure MySQL is running (XAMPP Control Panel)
- Check your `.env` file has correct credentials
- Verify the database exists
- Run `node test-connection.js` to diagnose issues

### DB_NAME not set
- Add `DB_NAME=your_database_name` to your `.env` file
- Make sure the database exists in MySQL

### Port Already in Use
- Change the PORT in `server.js` if port 5000 is already in use
- Or stop the application using port 5000

