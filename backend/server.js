require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const path      = require('path');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { startReminderCron }      = require('./utils/reminderCron');

connectDB();

const app = express();

// ── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Feature 12 — Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again after 15 minutes' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' },
});
app.use('/api/', limiter);
app.use('/api/auth/login',           authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed  = ['http://localhost:3000','http://localhost:3001', process.env.FRONTEND_URL].filter(Boolean);
    const patterns = [/\.vercel\.app$/, /\.onrender\.com$/, /\.railway\.app$/];
    if (allowed.includes(origin) || patterns.some((p) => p.test(origin))) return callback(null, true);
    return callback(null, true); // open for free-tier demo
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Existing Routes ───────────────────────────────────────────────────────────
app.use('/api/auth',             require('./routes/authRoutes'));
app.use('/api/auth',             require('./routes/passwordResetRoutes')); // forgot/reset password
app.use('/api/users',            require('./routes/userRoutes'));
app.use('/api/departments',      require('./routes/departmentRoutes'));
app.use('/api/payment-requests', require('./routes/paymentRequestRoutes'));
app.use('/api/approvals',        require('./routes/approvalRoutes'));
app.use('/api/payments',         require('./routes/paymentRoutes'));
app.use('/api/dashboard',        require('./routes/dashboardRoutes'));
app.use('/api/audit-logs',       require('./routes/auditLogRoutes'));
app.use('/api/notifications',    require('./routes/notificationRoutes'));

// ── New Feature Routes ────────────────────────────────────────────────────────
app.use('/api/pdf',    require('./routes/pdfRoutes'));    // Feature 2: PDF
app.use('/api/search', require('./routes/searchRoutes')); // Feature 3: Search
app.use('/api/export', require('./routes/exportRoutes')); // Feature 8: Excel export

// Feature 9: Comments — nested under payment-requests/:id/comments
app.use('/api/payment-requests/:id/comments', require('./routes/commentRoutes'));

// Health check
app.get('/api/health', (_req, res) =>
  res.json({ status: 'OK', message: 'ERP Payment API Running', env: process.env.NODE_ENV, version: '2.0.0' })
);

app.use(notFound);
app.use(errorHandler);

// Feature 11 — Start deadline reminder cron
if (process.env.NODE_ENV === 'production') startReminderCron();

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = app;
