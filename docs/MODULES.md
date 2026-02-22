# Cognitive e-KYC — Module-Level Description

This document describes each logical module and its corresponding files and responsibilities.

---

## 1. Frontend Layer

**Purpose:** User interface, document upload, camera capture, ID card preview, and PDF request.

| Artifact | Role |
|----------|------|
| `templates/index.html` | Main dashboard: upload/camera triggers, modals, extracted data display, ID card preview, download/share buttons. Loads Tesseract.js and html2canvas from CDN. |
| `templates/login.html` | Login form (e.g. mobile/username, password). |
| `templates/register.html` | Registration (name, mobile, email, password). |
| `templates/about.html` | About and feature description. |
| `static/js/script.js` | All client logic: navbar, upload/camera modals, file handling, Tesseract workers, preprocessing, parsing, display, edit, PDF request (Django), WhatsApp/Email share. |
| `static/style.css` | Global and dashboard styles. |
| `static/navbar.css` | Navigation and hamburger menu. |
| `static/auth.css` | Login/register styling. |

**Key functions in `script.js`:**
- `waitForTesseract()` — Ensure Tesseract.js is loaded.
- `preprocessImage(file)` — Image preprocessing for OCR.
- `preprocessOcrText(text)` — Post-OCR text correction.
- `parseAadhaarData(frontText, backText)` — Regex-based extraction of all Aadhaar fields.
- `displayExtractedData(data)` — Populate UI and ID card; attach edit and download/share handlers.
- `generatePersonalPassword(name, dob)` — Default password rule (4 letters + year).

---

## 2. OCR Layer

**Purpose:** Extract text from front and back of ID document using Tesseract.js with dual workers and structured parsing.

| Location | Role |
|----------|------|
| `static/js/script.js` | Creates front and back Tesseract workers; runs `recognize()` on preprocessed images; merges text; calls `preprocessOcrText` and `parseAadhaarData`. |
| Tesseract CDN | `tesseract.min.js`, worker, core WASM (jsDelivr). |

**Data flow:** File/Blob → `preprocessImage` → Worker.recognize → raw text → `preprocessOcrText` → `parseAadhaarData` → structured object (name, dob, gender, aadhaar, father, address, government).

**Config:** `PSM.AUTO`, `preserve_interword_spaces`, lang `eng`, tessdata `4.0.0_fast`.

---

## 3. Biometric / Face Layer

**Purpose:** Capture live or uploaded face image for ID card and optional verification.

| Location | Role |
|----------|------|
| `static/js/script.js` | `getUserMedia` for camera; capture/upload of person image; display in ID card preview. |
| `ML Algorithms/Verification.ipynb` | DeepFace-based face verification (embeddings, cosine similarity), OpenCV/MTCNN; used for experiments and integration design. |

**Current product flow:** User provides one face image (camera or file); it is shown on the generated ID card. Verification against document photo is implemented in the ML notebook and can be wired to backend later.

---

## 4. Fraud / Validation Layer

**Purpose:** Validate consistency of extracted data and support fraud/tamper detection.

| Location | Role |
|----------|------|
| `ML Algorithms/Verification.ipynb` | Random Forest model for name/DOB/address consistency; metrics and decision logic. |

**Integration:** Designed to be callable from backend (or optional API) after OCR; high confidence → approve, low → manual review. Not yet wired in Django views.

---

## 5. Authentication Layer

**Purpose:** User login/registration and optional UIDAI Aadhaar verification.

| Location | Role |
|----------|------|
| `ekyc/views.py` | `login`, `register` — Django auth (username/password). |
| `E_KYC/settings.py` | `INSTALLED_APPS`, `AUTH`, session, CSRF. |
| UIDAI | Designed as external HTTPS API (demographic/biometric/OTP); not yet implemented in codebase. |

---

## 6. Backend Layer

**Purpose:** Serve pages, auth, and PDF generation with encryption.

| Artifact | Role |
|----------|------|
| `E_KYC/urls.py` | Root URL routing. |
| `ekyc/urls.py` | App routes: index, login, register, about, `generate-pdf/`. |
| `ekyc/views.py` | `index`, `about`, `register`, `login`, `generate_pdf` (ReportLab + PyPDF2, 128-bit encryption). |
| `node_backend/server.js` | Optional microservice: POST `/encrypt-pdf` with base64 PDF and password; returns AES-128 encrypted PDF (pdf-lib). |

**PDF flow (Django):** JSON (name, dob, gender, aadhaar, father, address, imgData, password) → ReportLab canvas → PDF buffer → PyPDF2 encrypt → HttpResponse PDF.

---

## 7. Data Layer

**Purpose:** Persist users and application data.

| Artifact | Role |
|----------|------|
| `E_KYC/settings.py` | `DATABASES` (default SQLite3). |
| `ekyc/models.py` | Django models (if any beyond default User). |
| `ekyc/admin.py` | Admin registration for models. |
| `db.sqlite3` | Default SQLite database file. |

---

## 8. External Integrations (Current / Planned)

| Integration | Status | Purpose |
|-------------|--------|---------|
| Tesseract (CDN) | Active | OCR. |
| html2canvas (CDN) | Active | ID card DOM → image for PDF. |
| Django auth | Active | Login/register. |
| Node encrypt service | Optional | Alternative PDF encryption. |
| UIDAI Aadhaar API | Planned | Official Aadhaar verification. |
| WhatsApp / Email | Active | Share link + password (client-side). |

---

## 9. Cross-Module Dependencies

```
Frontend → OCR (Tesseract in script.js)
Frontend → Backend (Django: auth, generate-pdf)
Frontend → (optional) Node (encrypt-pdf)
Backend → Data (Django ORM, SQLite)
ML (notebook) → Biometric (DeepFace), Fraud (Random Forest)
```

For architecture diagrams and high-level flow, see [../ARCHITECTURE.md](../ARCHITECTURE.md). For algorithms and APIs, see [TECHNICAL_OVERVIEW.md](TECHNICAL_OVERVIEW.md).
