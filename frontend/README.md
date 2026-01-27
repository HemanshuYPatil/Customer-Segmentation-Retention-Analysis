# Customer Segmentation SaaS Frontend

Next.js 14 App Router frontend for the FastAPI backend. Provides an enterprise dark-mode dashboard with onboarding, predictions, and model management views.

## Stack
- Next.js 14 (TypeScript, App Router)
- Tailwind CSS
- Shadcn-style UI components (local)
- TanStack Query
- Recharts
- Lucide icons

## Environment
Create `.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## Run Locally
```bash
cd frontend
npm install
npm run dev
```

## Run with Backend
Terminal 1 (backend):
```bash
python src/train_pipeline.py
uvicorn app.main:app --reload
```

Terminal 2 (frontend):
```bash
cd frontend
npm install
npm run dev
```

## Codespaces Notes
- Use forwarded ports for `3000` (Next.js) and `8000` (FastAPI).
- Set `NEXT_PUBLIC_API_BASE_URL` to the forwarded FastAPI URL.

## API Endpoints Used
The UI expects the following endpoints:
- `GET /health`
- `POST /predict`
- `GET /metrics` (for model metrics)
- `GET /segments` (for segment summary)
- `POST /retrain` (for retraining trigger)

Only `/health` and `/predict` exist in the current FastAPI app. Add the remaining endpoints if you want live metrics and retrain from the UI.
