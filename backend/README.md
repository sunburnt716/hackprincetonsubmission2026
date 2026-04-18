# Kinovo Backend

FastAPI backend for the Kinovo triage dashboard.

## Prerequisites

- Python 3.12+
- PostgreSQL 18 (installer available at https://www.postgresql.org/download/)

> **Password note:** When setting your Postgres password, avoid special characters like `@`, `/`, `#`, or `?` — they break connection string parsing. Stick to letters and numbers (e.g. `Myuser1234`).

---

## 1. Create the database

Open psql. On Windows with Postgres 18, the default port is **5433**:

```bash
psql -U postgres -p 5433
```

Then create the database:

```sql
CREATE DATABASE kinovo;
\q
```

---

## 2. Set up the Python environment

From the `backend/` directory:

```bash
python -m venv venv
```

Activate the venv:

- **Windows:** `venv\Scripts\activate`
- **macOS/Linux:** `source venv/bin/activate`

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@127.0.0.1:5433/kinovo
SECRET_KEY=any-long-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
```

> Use `127.0.0.1` instead of `localhost` — asyncpg on Windows can fail to resolve the `localhost` hostname.

---

## 4. Run database migrations

```bash
alembic upgrade head
```

This creates the `users`, `patients`, and `wearable_devices` tables.

---

## 5. Start the development server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.  
Interactive docs: `http://127.0.0.1:8000/docs`

---

## Project structure

```
backend/
├── app/
│   ├── main.py          # FastAPI entrypoint
│   ├── config.py        # Settings (reads from .env)
│   ├── database.py      # Async SQLAlchemy engine
│   ├── models/
│   │   ├── base.py      # Shared UUID + timestamp mixins
│   │   ├── user.py      # User (staff) and Patient models
│   │   └── wearable.py  # WearableDevice model
│   └── schemas/
│       ├── user.py      # Pydantic request/response schemas
│       └── wearable.py
├── alembic/             # Database migrations
├── requirements.txt
└── .env.example
```
