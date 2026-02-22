# Cognitive e-KYC — System Architecture

This document describes the **modular layered architecture** of the Cognitive e-KYC system and uses **Mermaid** diagrams for visualization (supported on GitHub, GitLab, and most Markdown viewers).

---

## 1. High-Level System Flow

End-to-end flow from document upload to encrypted ID card and sharing.

```mermaid
flowchart LR
    subgraph Input
        A[ID Document Upload]
        B[Camera / Scan]
    end
    subgraph Client
        C[OCR Layer<br/>Tesseract.js]
        D[Face Capture]
        E[Parsing & UI]
    end
    subgraph Backend
        F[Django API]
        G[PDF + Encrypt]
    end
    subgraph External
        H[UIDAI API]
        I[Share: WhatsApp / Email]
    end
    A --> C
    B --> C
    C --> E
    D --> E
    E --> F
    F --> G
    F -.-> H
    G --> I
```

---

## 2. Layered Architecture

```mermaid
flowchart TB
    subgraph Frontend["Frontend Layer"]
        HTML[HTML5]
        CSS[CSS3 / Tailwind-style]
        JS[JavaScript]
        CAM[getUserMedia]
        H2C[html2canvas]
    end

    subgraph OCR["OCR Layer"]
        TESS[Tesseract.js]
        FW[Front Worker]
        BW[Back Worker]
        PRE[Preprocessing]
        REGEX[Regex Parsing]
    end

    subgraph Biometric["Biometric Layer"]
        FACE[Face Capture]
        DEEP[DeepFace - ML]
        LIV[Liveness-ready]
    end

    subgraph Fraud["Fraud / Validation Layer"]
        ML[Random Forest]
        TAMPER[Tamper Detection]
    end

    subgraph Auth["Authentication Layer"]
        DJ_AUTH[Django Auth]
        OTP[OTP]
        UIDAI[UIDAI API]
    end

    subgraph Backend["Backend Layer"]
        DJ[Django]
        API[API / Views]
        PDF[ReportLab]
        ENC[PyPDF2 / Node pdf-lib]
    end

    subgraph Data["Data Layer"]
        DB[(SQLite / DB)]
        JSON[JSON structures]
    end

    Frontend --> OCR
    Frontend --> Biometric
    OCR --> Backend
    Biometric --> Fraud
    Fraud --> Auth
    Auth --> Backend
    Backend --> Data
    Backend -.-> UIDAI
```

---

## 3. Component Diagram

```mermaid
flowchart TB
    subgraph Frontend["Frontend Components"]
        UI[Web UI - HTML/CSS/JS]
        OCR_C[Tesseract.js - OCR]
        H2C[html2canvas - Capture]
    end

    subgraph Backend["Backend Components"]
        DJ[Django App]
        RL[ReportLab - PDF]
        ENC[PyPDF2 / pdf-lib - AES-128]
    end

    subgraph ML["ML / Verification"]
        DF[DeepFace]
        RF[Random Forest]
    end

    UI --> OCR_C
    UI --> H2C
    UI -->|HTTP POST| DJ
    DJ --> RL
    DJ --> ENC
    ML -.->|Optional API| DJ
```

---

## 4. Sequence: Upload → Extract → PDF

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Tesseract
    participant Django
    participant PyPDF2

    User->>Browser: Upload front + back images
    Browser->>Tesseract: recognize(front) + recognize(back)
    Tesseract-->>Browser: Raw text
    Browser->>Browser: Preprocess + parse (regex)
    Browser->>User: Show extracted data + ID preview
    User->>Browser: Confirm / Edit, request PDF
    Browser->>Browser: html2canvas(idCard)
    Browser->>Django: POST /generate-pdf/ (JSON + imgData)
    Django->>Django: ReportLab → PDF buffer
    Django->>PyPDF2: encrypt(user_pwd, 128bit)
    PyPDF2-->>Django: Encrypted PDF
    Django-->>Browser: application/pdf
    Browser->>User: Download / Share (WhatsApp/Email)
```

---

## 5. OCR Pipeline (Dual Workers)

```mermaid
flowchart LR
    subgraph Input
        F[Front Image]
        B[Back Image]
    end
    subgraph Preprocess
        P1[Grayscale / Threshold]
        P2[Noise correction]
    end
    subgraph Workers
        W1[Front Worker]
        W2[Back Worker]
    end
    subgraph Parse
        R[Regex: Aadhaar, Name, DOB, Gender, Father, Address]
    end
    F --> P1
    B --> P2
    P1 --> W1
    P2 --> W2
    W1 --> R
    W2 --> R
    R --> Display[Display + Edit]
```

---

## 6. Security & Data Flow

```mermaid
flowchart TB
    subgraph Client
        PII[Extracted PII]
        PASS[Password: name + year / user]
    end
    subgraph Transport
        HTTPS[HTTPS]
        CSRF[CSRF Token]
    end
    subgraph Server
        PDF_RAW[PDF Generated]
        AES[AES-128 Encrypt]
        STORE[No password stored]
    end
    subgraph Share
        WA[WhatsApp]
        EM[Email]
        PASS_SEP[Password sent separately]
    end
    PII --> HTTPS
    PASS --> HTTPS
    HTTPS --> CSRF
    CSRF --> PDF_RAW
    PDF_RAW --> AES
    AES --> STORE
    STORE --> WA
    STORE --> EM
    PASS_SEP --> WA
    PASS_SEP --> EM
```

---

## 7. Deployment View (Hybrid)

```mermaid
flowchart TB
    subgraph Client["Client"]
        Browser[Browser]
    end

    subgraph DjangoServer["Django Server"]
        Django[Django]
        ReportLab[ReportLab]
        PyPDF2[PyPDF2]
    end

    subgraph NodeServer["Node Server (Optional)"]
        Express[Express]
        PdfLib[pdf-lib]
    end

    subgraph Database["Database"]
        SQLite[(SQLite)]
    end

    Browser -->|HTTPS| Django
    Django --> SQLite
    Browser -.->|encrypt-pdf optional| NodeServer
```

---

## 8. Module Summary

| Layer | Responsibility | Key artifacts |
|-------|----------------|----------------|
| **Frontend** | UI, upload, camera, capture | `templates/*.html`, `static/js/script.js`, `static/*.css` |
| **OCR** | Extract text from front/back | Tesseract.js workers, `preprocessOcrText`, `parseAadhaarData` |
| **Biometric** | Face capture; verification in ML | `getUserMedia`, `ML Algorithms/Verification.ipynb` |
| **Fraud / Validation** | Consistency, tamper hints | Random Forest in `ML Algorithms/` |
| **Authentication** | Login, session; UIDAI (roadmap) | `ekyc/views.py`, Django auth |
| **Backend** | API, PDF, encryption | `ekyc/views.py`, `node_backend/server.js` |
| **Data** | User and session data | Django DB, SQLite |

---

## 9. Diagram Conventions

- **Solid arrows:** Synchronous or direct dependency.
- **Dashed arrows:** Optional or external integration (e.g. UIDAI, Node service).
- **Mermaid:** Render on [GitHub](https://github.com), [GitLab](https://gitlab.com), or [Mermaid Live](https://mermaid.live) for best compatibility. If a diagram does not render, paste its code block into Mermaid Live to view it.

For file-level and technical details, see [docs/TECHNICAL_OVERVIEW.md](docs/TECHNICAL_OVERVIEW.md) and [docs/MODULES.md](docs/MODULES.md).
