# ERP Payment Entry Processing Workflow System

A complete full-stack ERP system for managing payment approvals through an 8-step workflow.

## Technology Stack

- **Frontend**: React 18, React Router 6, Bootstrap 5, Chart.js, Axios
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT, Multer

---

## Quick Start

### Prerequisites
- Node.js 16+
- MongoDB running on localhost:27017

### 1. Backend Setup

```bash
cd backend
npm install
```

Edit `.env` if needed (MongoDB URI, JWT secret).

Seed the database:
```bash
npm run seed
```

Start the server:
```bash
npm run dev
```

Backend runs on: `http://localhost:5000`

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on: `http://localhost:3000`

---

## Demo Login Credentials

All accounts use password: **Password123**

| Role                    | Email                         |
|-------------------------|-------------------------------|
| Admin                   | admin@erp.com                 |
| Employee                | john.smith@erp.com            |
| Employee (IT)           | sarah.connor@erp.com          |
| Department Head         | emily.davis@erp.com           |
| Junior Accountant (AP)  | lisa.anderson@erp.com         |
| Senior Accountant       | david.martinez@erp.com        |
| Budget Control (ICD)    | jennifer.taylor@erp.com       |
| Finance Manager         | william.brown@erp.com         |
| Treasury Officer        | patricia.jones@erp.com        |
| Filing Officer          | charles.garcia@erp.com        |

---

## 8-Step Payment Workflow

```
Employee → Dept. Head → Junior Accountant → Senior Accountant
        → Budget Control → Finance Manager → Treasury → Filing Officer → Completed
```

Each step has dedicated queue pages with role-specific action modals.
