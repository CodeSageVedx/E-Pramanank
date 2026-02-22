const express = require('express');
const { PDFDocument } = require('pdf-lib');
const app = express();
const port = 3000;

// Middleware to parse JSON and handle CORS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Endpoint to encrypt the PDF
app.post('/encrypt-pdf', async (req, res) => {
    try {
        const { pdfData, password } = req.body;

        // Decode the base64 PDF data
        const pdfBytes = Buffer.from(pdfData, 'base64');

        // Load the PDF with pdf-lib
        const pdfDoc = await PDFDocument.load(pdfBytes);

        // Encrypt the PDF with the provided password using AES-128
        pdfDoc.encrypt({
            userPassword: password,
            ownerPassword: password,
            permissions: {
                printing: 'highResolution',
                modifying: false,
                copying: false,
                annotating: false,
                fillingForms: false,
                contentAccessibility: false,
                documentAssembly: false,
            },
            encryptionAlgorithm: 'aes128', // Use AES-128 for compatibility with Microsoft Edge
        });

        // Serialize the encrypted PDF to bytes
        const encryptedPdfBytes = await pdfDoc.save();

        // Send the encrypted PDF back as base64
        const encryptedPdfBase64 = Buffer.from(encryptedPdfBytes).toString('base64');
        res.json({ encryptedPdf: encryptedPdfBase64 });
    } catch (error) {
        console.error('Error encrypting PDF:', error);
        res.status(500).json({ error: 'Failed to encrypt PDF' });
    }
});

app.listen(port, () => {
    console.log(`Node.js server running on http://localhost:${port}`);
});