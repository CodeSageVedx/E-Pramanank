# Contributing to Cognitive e-KYC

Thank you for your interest in contributing. Below are brief guidelines.

## Development setup

1. **Clone the repository** and open the project in your editor.
2. **Python:** Create a virtual environment, install Django, ReportLab, PyPDF2, then run `python manage.py migrate` and `python manage.py runserver`.
3. **Node (optional):** In `node_backend/`, run `npm install` and `node server.js` if you use the encryption microservice.
4. **Docs:** See [README.md](README.md), [ARCHITECTURE.md](ARCHITECTURE.md), and the [docs/](docs/) folder.

## Areas you can help

- **OCR:** Improve preprocessing or regex parsing in `static/js/script.js`.
- **Backend:** Extend `ekyc/views.py` (e.g. UIDAI integration, PII masking).
- **ML:** Experiment in `ML Algorithms/Verification.ipynb` (DeepFace, Random Forest).
- **Security:** Harden CORS, secrets, and password handling.
- **Docs:** Fix or extend README, ARCHITECTURE, TECHNICAL_OVERVIEW, MODULES.

## Code and PRs

- Follow existing style (e.g. Django and JS conventions used in the repo).
- Keep PII and secrets out of logs and version control.
- For larger changes, open an issue first and reference it in your PR.

## Contact

For questions or coordination: [vedantkanoje794@gmail.com](mailto:vedantkanoje794@gmail.com).
