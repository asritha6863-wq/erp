require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const path     = require('path');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

connectDB();

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS — allow localhost + Vercel + Render + any env-set URL
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Postman / mobile / server-to-server
    const allowed = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL,
    ].filter(Boolean);
    const patterns = [/\.vercel\.app$/, /\.onrender\.com$/, /\.railway\.app$/];
    if (
      allowed.includes(origin) ||
      patterns.some((p) => p.test(origin))
    ) return callback(null, true);
    return callback(null, true); // allow all in free-tier for simplicity
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',             require('./routes/authRoutes'));
app.use('/api/users',            require('./routes/userRoutes'));
app.use('/api/departments',      require('./routes/departmentRoutes'));
app.use('/api/payment-requests', require('./routes/paymentRequestRoutes'));
app.use('/api/approvals',        require('./routes/approvalRoutes'));
app.use('/api/payments',         require('./routes/paymentRoutes'));
app.use('/api/dashboard',        require('./routes/dashboardRoutes'));
app.use('/api/audit-logs',       require('./routes/auditLogRoutes'));
app.use('/api/notifications',    require('./routes/notificationRoutes'));

// Health check — used by Render to confirm the service is alive
app.get('/api/health', (_req, res) =>
  res.json({ status: 'OK', message: 'ERP Payment API Running', env: process.env.NODE_ENV })
);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = app;
