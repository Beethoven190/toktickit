# TokTickIT — IT Service Desk

TokTickIT is an IT service desk web application built using the full-stack technology:
- **Frontend**: React + TypeScript + Vite + Bootstrap
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Testing**: Vitest & Supertest

---

## Project Structure

```text
toktickit/
├── client/          # React + TypeScript + Vite + Bootstrap frontend
├── server/          # Node.js + Express + TypeScript backend
├── docs/            # Lab documentation
└── README.md        # This file
```

---

## Getting Started

### Prerequisites
- Node.js (version 18 or above recommended)
- PostgreSQL database server running locally or accessible remotely

### Installation & Configuration

#### 1. Backend Setup
1. Open a terminal and navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variables template:
   ```bash
   cp .env.example .env
   ```
4. Edit the `.env` file and set your actual PostgreSQL database credentials in `DATABASE_URL`.

#### 2. Frontend Setup
1. Open another terminal and navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variables template:
   ```bash
   cp .env.example .env
   ```

---

## Running the Application

### Development Mode

- **Start Backend Developer Server**:
  Navigate to the `server/` directory and run:
  ```bash
  npm run dev
  ```
  The API will start listening on `http://localhost:3000`.

- **Start Frontend Development Server**:
  Navigate to the `client/` directory and run:
  ```bash
  npm run dev
  ```
  The client application will start on `http://localhost:5173`.

---

## Running Tests

- **Run Server Tests**:
  Navigate to the `server/` directory and run:
  ```bash
  npm run test
  ```

- **Run Client Tests**:
  Navigate to the `client/` directory and run:
  ```bash
  npm run test
  ```
