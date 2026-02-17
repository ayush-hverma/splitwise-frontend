# Frontend

This is a tiny static frontend. To run:

Option A (quick, no server):
- Open `frontend/index.html` in your browser (CORS only applies to some browsers when using file://).

Option B (recommended):

```bash
cd frontend
npx http-server -p 3000
# then open http://localhost:3000
```

The frontend expects the backend at `http://localhost:5000` when run locally.
