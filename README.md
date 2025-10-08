# CS619 Construction Materials — Monorepo

## Stack
- Backend: Django, DRF, SimpleJWT, CORS, xhtml2pdf
- Frontend: React (Vite), Axios, React Router

## Quick Start
```bash
python -m venv .venv && . .venv/Scripts/activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
# frontend
cd frontend && npm i && npm run dev
