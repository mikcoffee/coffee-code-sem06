# Study Group Finder

A full-stack web application to list, search, create, edit, and delete study groups. 
- **Backend:** FastAPI (Python)
- **Frontend:** Vanilla HTML, CSS, and JavaScript

## Prerequisites
- Python 3.10 or higher

## How to Run the API (Backend)
Open a terminal and run:
```bash
cd api
python -m venv .venv
# Activate the virtual environment:
# macOS/Linux: source .venv/bin/activate
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
fastapi dev main.py
```
The API will be available at `http://127.0.0.1:8000` (Swagger docs at `/docs`).

## How to Run the Frontend
Open a **second terminal** and run:
```bash
cd frontend
python -m http.server 5500 --bind 127.0.0.1
```
Open your browser and go to `http://127.0.0.1:5500`.

## CORS & Origins
Because the frontend and backend run on different ports, they are treated as different origins. CORS is configured in the API (`api/main.py`) to allow communication:
- **Frontend Origin:** `http://127.0.0.1:5500` (and `http://localhost:5500`)
- **API Origin:** `http://127.0.0.1:8000`
- **Allowed Methods:** `GET`, `POST`, `PATCH`, `DELETE`
- **Exposed Headers:** `X-Total-Count` (Required so the frontend can read the total number of groups for pagination).

## Project Structure
```text
├── README.md
├── api/
│   ├── main.py          # Routes, rules, and CORS config
│   ├── data.py          # In-memory example data
│   ├── schemas.py       # Pydantic models
│   └── requirements.txt
└── frontend/
    ├── index.html       # Page structure
    ├── styles.css       # Styling
    ├── api.js           # Fetch logic and API communication
    ├── ui.js            # DOM manipulation
    └── app.js           # App orchestration and state
```

