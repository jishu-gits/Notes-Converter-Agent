# AI Notes Converter Backend

FastAPI backend for uploading PDF notes, processing them with Gemini, and returning generated markdown.

## Setup

1. Create a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Copy `.env.example` to `.env` and set `GEMINI_API_KEY`.
4. Start the API:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Endpoints

- `GET /health`
- `POST /upload`
- `GET /jobs/{job_id}`
- `GET /jobs/{job_id}/markdown`
- `GET /jobs/{job_id}/download/md`
- `GET /jobs/{job_id}/download/pdf`
- `DELETE /jobs/{job_id}`
