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

BLE wearable identity is schema-driven. Each registered wearable uses
`wearable_devices.device_id` as the BLE worker identity and ingestion key.
No single HM10 address environment variable is required.

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

## JSON prototype backend (hackathon mode)

In addition to the database models, the backend now includes JSON-backed prototype files under:

```
backend/data/
├── users.json
├── patients.snapshot.json
├── device.snapshot.json
└── events.ndjson
```

These are exposed through prototype endpoints:

- `GET /api/v1/settings?email=staff.guest@kinovo.local`
- `PUT /api/v1/settings?email=staff.guest@kinovo.local` with body `{ "mode": "system|light|dark" }`
- `POST /api/v1/auth/staff/sign-up`
- `POST /api/v1/auth/staff/log-in`
- `POST /api/v1/auth/session/refresh`
- `PUT /api/v1/auth/me/password`
- `POST /api/v1/auth/password/forgot`
- `POST /api/v1/auth/password/reset`
- `DELETE /api/v1/auth/me`
- `GET /api/v1/dashboard/waiting-room`
- `GET /api/v1/dashboard/device-health`

Staff auth uses short-lived JWT access tokens. While the dashboard is open, the frontend refreshes the token periodically so active users stay signed in, but idle/closed sessions time out naturally.

Password recovery works in two steps:

1. The user requests a reset token from the sign-in recovery page.
2. The user copies the demo token into the reset form and chooses a new password.

Signed-in users can also change their password and delete their own account from the Settings page.

For local testing, the seeded demo password is:

`KinovoDemo123!`

The canonical user settings JSON shape is:

```json
{
  "users": {
    "email@domain.com": {
      "settings": {
        "preferences": {
          "theme_mode": "system"
        }
      },
      "name": "User Name",
      "age": 29,
      "hospital": "Hospital Name",
      "position": "RN",
      "password_hash": "<hashed password>"
    }
  }
}
```

Prototype schemas are defined in:

```
backend/app/schemas/auth_schemas.py
```

and loaded via:

```
backend/app/auth_store.py
```

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
