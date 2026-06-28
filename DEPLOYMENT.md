# Deployment Guide

Remarker AI is designed for modern cloud-native deployment. The application consists of a Next.js frontend and a FastAPI backend.

## Architecture Overview

- **Frontend**: Next.js App Router. Should be deployed to a serverless platform like Vercel.
- **Backend**: FastAPI Python App. Should be deployed as a containerized service using Docker, e.g., on Render or AWS ECS.

## 1. Deploying the Backend (Render/Docker)

The backend provides the API for document parsing and AI generation.

### Using Docker (Recommended)

1. Make sure you have Docker installed.
2. Build the image:
   ```bash
   docker build -t remarker-ai-backend ./backend
   ```
3. Run the container:
   ```bash
   docker run -p 8000:8000 --env-file .env remarker-ai-backend
   ```

### Deploying to Render

1. Create a new **Web Service** on Render.
2. Connect your repository.
3. Set the **Root Directory** to `backend`.
4. Choose **Docker** as the environment.
5. Set the required Environment Variables:
   - `AI_PROVIDER`
   - `GEMINI_API_KEY`
   - `NVIDIA_NIM_API_KEY`
   - `CORS_ORIGIN` (Set to your Vercel frontend URL)

## 2. Deploying the Frontend (Vercel)

The frontend is a standard Next.js application, which Vercel handles automatically.

### Steps

1. Create a new project on Vercel and import your repository.
2. Keep the **Root Directory** as the repository root (do not change it to `backend`).
3. Set the **Framework Preset** to `Next.js`.
4. Configure Environment Variables:
   - `NEXT_PUBLIC_API_BASE_URL`: URL of your deployed backend (e.g., `https://your-backend.onrender.com`).
5. Click **Deploy**.

## Verification

Once both services are deployed:
1. Visit the frontend URL.
2. Try uploading a sample PDF.
3. Verify that the file is successfully parsed and that Markdown notes are returned.
4. Verify that you can switch providers (if both are configured) in the settings panel.
