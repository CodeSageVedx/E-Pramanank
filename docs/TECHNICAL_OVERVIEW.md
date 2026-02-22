# Cognitive e-KYC — Technical Overview

This document provides a technical deep dive into the Cognitive e-KYC system: algorithms, APIs, and implementation details.

---

## 1. OCR Pipeline

### 1.1 Technology

- **Engine:** Tesseract.js v5 (Web Workers, WASM).
- **Language:** English (`eng`); tessdata: `4.0.0_fast`.
- **Workers:** Two separate workers — one for front image, one for back image — for parallel processing and non-blocking UI.

### 1.2 Preprocessing

- **Input:** File (image) or camera-captured frame.
- **Steps (conceptual):**
  - Grayscale conversion where applicable.
  - Binary thresholding for better character contrast.
  - Noise/artifact correction.
- **Text post-processing:** Replacements such as `5/0` → `S/O`, `G0vernment` → `Government`, `D0B` → `DOB`, `Gend3r` → `Gender` to correct common OCR mistakes.

### 1.3 Extracted Fields

| Field | Source | Parsing method |
|-------|--------|----------------|
| Government | Front | Regex: `Government of India` |
| Name | Front | Line structure below "Government of India" or name-like regex |
| DOB | Front | `DOB` label or `dd/mm/yyyy` / `dd-mm-yyyy` |
| Gender | Front | Label or keywords: Male / Female / Transgender |
| Aadhaar | Front | `XXXX XXXX XXXX` or 12 consecutive digits |
| Father's name | Back | After S/o, D/o, F/o or similar; line filtering |
| Address | Back | Lines after S/o block; exclude UIDAI, Aadhaar; stop at PIN (6 digits) |

### 1.4 Accuracy

- **High-quality images:** ~87–90%.
- **Degraded / low-quality:** ~75–85%.
- Heavily degraded or skewed documents may require re-capture or manual correction.

---

## 2. Face Recognition & Liveness

### 2.1 Client-Side (Current)

- **Capture:** `navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })` for back camera (e.g. mobile).
- **Usage:** User captures or uploads a live/selfie image; this image is placed on the generated ID card and can be used for comparison in the ML pipeline.

### 2.2 ML Pipeline (Verification.ipynb)

- **Framework:** DeepFace (OpenCV, MTCNN/RetinaFace for detection).
- **Representation:** 128-dimensional facial embeddings.
- **Comparison:** Cosine similarity:
  \[
  \text{similarity} = \frac{A \cdot B}{\|A\| \|B\|}
  \]
- **Threshold:** Typically 0.8 for match/no-match.
- **Metrics (from research):** ~90% accuracy, ~4% FRR, ~1.37% FAR; processing ~2 s.

### 2.3 Liveness

- Current flow is **liveness-ready** (live capture or upload); no 3D/depth-based liveness in codebase yet.

---

## 3. PII Handling

- **Detection:** Extracted fields (Aadhaar number, address, DOB, name, father’s name) are treated as PII.
- **In UI:** Data shown in editable form; user can correct before generating PDF.
- **Storage:** Stored only as needed by Django (e.g. session); not logged in plain text.
- **Sharing:** PDF is encrypted; password is communicated separately (WhatsApp/Email), not embedded in the document.

---

## 4. Fraud Detection & Validation (ML)

- **Model:** Random Forest Classifier (see `ML Algorithms/Verification.ipynb`).
- **Inputs:** Name, DOB, address and related consistency features.
- **Output:** Validation / fraud score for decision engine.
- **Reported:** ~92.2% accuracy, ~0.8 s inference.
- **Decision logic:** High confidence → approve; suspicious → flag for manual review (when integrated into main app).

---

## 5. UIDAI Aadhaar API (Integration Design)

- **Purpose:** Verify Aadhaar against official records after OCR and optional face match.
- **Protocol:** XML over HTTPS; authentication types: demographic, biometric, OTP.
- **Security:** 256-bit AES, digital signatures, CIDR allowlisting as per UIDAI specs.
- **Latency:** Target ~1.2 s; offline fallback via cached validation where applicable.
- **Status:** Architecture and roadmap; integration in progress.

---

## 6. Encrypted Digital ID Card

### 6.1 Generation (Django)

- **Library:** ReportLab — A4 canvas, text fields, embedded ID card image (from base64).
- **Image source:** Frontend sends `imgData` (base64) from `html2canvas(idCard)`.
- **Output:** In-memory PDF buffer.

### 6.2 Password

- **Default rule:** First 4 uppercase letters of first name + 4-digit birth year (e.g. `RAJU1990`).
- **Fallback:** If name has fewer than 4 letters, name part is shortened; total length capped (e.g. 7).
- **User-defined:** Supported when sharing (user enters password in modal).

### 6.3 Encryption

- **Django:** PyPDF2 — `PdfWriter.encrypt(user_pwd=password, use_128bit=True)`.
- **Node (optional):** pdf-lib — `encryptionAlgorithm: 'aes128'`, user and owner password set.
- **Overhead:** ~1.2 s per PDF typical.

### 6.4 Sharing

- **Download:** Browser downloads encrypted PDF; password shown in alert (default) or entered by user.
- **WhatsApp:** `wa.me` link with message containing share text; password communicated in same message (user responsibility).
- **Email:** `mailto:` with subject/body; PDF as blob URL in local flow; password in body.

---

## 7. Backend APIs

### 7.1 Django

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Index (dashboard) |
| `/login/` | GET/POST | Login |
| `/register/` | GET/POST | Registration |
| `/about/` | GET | About page |
| `/generate-pdf/` | POST | JSON body: name, dob, gender, aadhaar, father, address, imgData, password → PDF response |

- **CSRF:** `X-CSRFToken` header or cookie required for POST.
- **Response:** `Content-Type: application/pdf`, `Content-Disposition: attachment`.

### 7.2 Node (Optional)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/encrypt-pdf` | POST | Body: `{ pdfData: base64, password }` → `{ encryptedPdf: base64 }` |

- **CORS:** Enabled for development (`*`); should be restricted in production.

---

## 8. Database (Django)

- **Default:** SQLite3 (`db.sqlite3`).
- **Models:** Django’s built-in `User` (and any custom models in `ekyc/models.py`) for auth and optional profile data.
- **Migrations:** `python manage.py migrate`.

---

## 9. Performance Targets

| Stage | Target |
|-------|--------|
| OCR (front + back) | ~2 s |
| Face (capture + optional ML verify) | ~2 s |
| Fraud/validation (ML) | ~0.8 s |
| UIDAI (when used) | ~1.2 s |
| PDF + encryption | ~1.2 s |
| **End-to-end** | **< 10 s** |

---

## 10. Security Checklist

- HTTPS in production.
- CSRF protection on Django forms and API.
- No storage of PDF password with the file.
- AES-128 for PDF encryption.
- PII not logged in plain text.
- Restrict CORS and ALLOWED_HOSTS in production.
- Keep `SECRET_KEY` and any API keys in environment variables, not in repo.

For module-level breakdown, see [MODULES.md](MODULES.md). For architecture and diagrams, see [../ARCHITECTURE.md](../ARCHITECTURE.md).
