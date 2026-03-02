// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const farmerRoutes = require('./routes/farmers');
const blockchainRoutes = require('./routes/blockchain');
const barangayRoutes = require('./routes/barangays');
const activityLogsRoutes = require('./routes/activity-logs');
const contributionsRoutes = require('./routes/contributions');
const loansRoutes = require('./routes/loans');
const loanPaymentsRoutes = require('./routes/loan-payments');
const machineryRoutes = require('./routes/machinery');
const machineryFinancialRoutes = require('./routes/machinery-financial');
const notificationsRoutes = require('./routes/notifications');
const farmerIncomeRoutes = require('./routes/farmer-income');
const { startNotificationScheduler } = require('./scheduler/notification-scheduler');


const app = express();
app.use(bodyParser.json());

// Configure CORS more securely: allow specific origin in production via FRONTEND_ORIGIN.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';
app.use(cors({ origin: FRONTEND_ORIGIN }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Use farmer routes
app.use('/api/farmers', farmerRoutes);
// Blockchain routes
app.use('/api/blockchain', blockchainRoutes);
// Barangay routes
app.use('/api/barangays', barangayRoutes);
// Activity logs routes
app.use('/api/activity-logs', activityLogsRoutes);
// Financial routes
app.use('/api/contributions', contributionsRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/loan-payments', loanPaymentsRoutes);
// Machinery routes
app.use('/api/machinery', machineryRoutes);
app.use('/api/machinery-financial', machineryFinancialRoutes);
// Notification routes
app.use('/api/notifications', notificationsRoutes);
// Farmer income routes
app.use('/api/farmer-income', farmerIncomeRoutes);


const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚜 Farmer backend running on http://localhost:${PORT}`);
    console.log(`📝 Registration endpoint: http://localhost:${PORT}/api/farmers/register`);
    // Start the notification scheduler
    startNotificationScheduler();
  });
} else {
  module.exports = app;
}
