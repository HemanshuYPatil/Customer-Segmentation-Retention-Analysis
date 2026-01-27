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
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Run Locally
```bash
cd frontend
npm install
npm run dev
```

## Inngest (Local Queue)
Run the local Inngest dev server in another terminal:
```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```
This enables queue processing for dataset training events.

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
