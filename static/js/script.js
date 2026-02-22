// Navbar Hamburger Menu
const hamburger = document.querySelector(".hamburger");
const navItems = document.querySelector(".nav-items");
const navbar = document.querySelector(".navbar");

if (hamburger && navItems && navbar) {
  hamburger.addEventListener("click", () => {
    navItems.classList.toggle("active");
    hamburger.textContent = navItems.classList.contains("active") ? "✕" : "☰";
  });

  document.addEventListener("click", (e) => {
    if (!navbar.contains(e.target) && navItems.classList.contains("active")) {
      navItems.classList.remove("active");
      hamburger.textContent = "☰";
    }
  });
}

// Upload Modal Logic
const uploadBtn = document.getElementById("upload-btn");
const uploadModal = document.getElementById("upload-modal");
const uploadCloseBtn = uploadModal
  ? uploadModal.querySelector(".close-btn")
  : null;
const driveBtn = document.getElementById("drive-btn");
const cameraBtn = document.getElementById("camera-btn");
const frontUploadBtn = document.getElementById("front-upload-btn");
const backUploadBtn = document.getElementById("back-upload-btn");
const fileInput = document.getElementById("file-input");
const uploadedImageSection = document.getElementById("uploaded-image");
const frontImg = document.getElementById("front-img");
const backImg = document.getElementById("back-img");
const extractBtn = document.getElementById("extract-btn");
const extractedDataSection = document.getElementById("extracted-data");
const idCardSection = document.getElementById("id-card-section");
const downloadBtn = document.getElementById("download-btn");
const shareWhatsappBtn = document.getElementById("share-whatsapp-btn");
const shareEmailBtn = document.getElementById("share-email-btn");
const passwordModal = document.getElementById("password-modal");
const passwordModalClose = document.getElementById("password-modal-close");
const sharePasswordInput = document.getElementById("share-password-input");
const sharePasswordSubmit = document.getElementById("share-password-submit");

let frontFile = null;
let backFile = null;
let personImage = null;
let shareMethod = null;

if (uploadBtn && uploadModal && uploadCloseBtn) {
  uploadBtn.addEventListener("click", () => {
    uploadModal.style.display = "block";
    frontUploadBtn.style.display = "block";
    backUploadBtn.style.display = "none";
  });

  uploadCloseBtn.addEventListener("click", () => {
    uploadModal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === uploadModal) {
      uploadModal.style.display = "none";
    }
  });
}

if (driveBtn) {
  driveBtn.addEventListener("click", () => {
    alert("Google Drive integration coming soon!");
    uploadModal.style.display = "none";
  });
}

if (frontUploadBtn && fileInput) {
  frontUploadBtn.addEventListener("click", () => {
    console.log("Opening file input for front side");
    fileInput.click();
  });

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!frontFile) {
        frontFile = file;
        processFile(frontFile, frontImg);
        console.log("Front side uploaded:", frontFile);
        frontUploadBtn.style.display = "none";
        backUploadBtn.style.display = "block";
      } else if (!backFile) {
        backFile = file;
        processFile(backFile, backImg);
        console.log("Back side uploaded:", backFile);
        displayUploadedImages();
        uploadModal.style.display = "none";
      }
      fileInput.value = "";
    }
  });
}

if (backUploadBtn) {
  backUploadBtn.addEventListener("click", () => {
    console.log("Opening file input for back side");
    fileInput.click();
  });
}

// Camera Scanner Modal Logic
const cameraModal = document.getElementById("camera-modal");
const cameraCloseBtn = cameraModal
  ? cameraModal.querySelector(".camera-close-btn")
  : null;
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("capture-btn");
const cameraInstruction = document.getElementById("camera-instruction");
let stream;

if (
  cameraBtn &&
  cameraModal &&
  cameraCloseBtn &&
  video &&
  canvas &&
  captureBtn
) {
  cameraBtn.addEventListener("click", async () => {
    console.log("Opening camera modal");
    uploadModal.style.display = "none";
    cameraModal.style.display = "block";
    frontFile = null;
    backFile = null;
    cameraInstruction.textContent =
      "Scan Front Side (Click Capture, then scan Back Side)";

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      video.srcObject = stream;
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Unable to access camera. Please allow camera permissions.");
      cameraModal.style.display = "none";
    }
  });

  cameraCloseBtn.addEventListener("click", () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    cameraModal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === cameraModal) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      cameraModal.style.display = "none";
    }
  });

  captureBtn.addEventListener("click", () => {
    console.log("Capturing image");
    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/png");

    fetch(imageData)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File(
          [blob],
          `captured_image_${frontFile ? "back" : "front"}.png`,
          { type: "image/png" }
        );
        if (!frontFile) {
          frontFile = file;
          processFile(frontFile, frontImg);
          console.log("Front side captured:", frontFile);
          cameraInstruction.textContent =
            "Scan Back Side (Click Capture to finish)";
        } else if (!backFile) {
          backFile = file;
          processFile(backFile, backImg);
          console.log("Back side captured:", backFile);
          stream.getTracks().forEach((track) => track.stop());
          cameraModal.style.display = "none";
          displayUploadedImages();
        }
      })
      .catch((err) => console.error("Error converting image:", err));
  });
}

// Process File
function processFile(file, imgElement) {
  if (file.type === "application/pdf") {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const typedArray = new Uint8Array(e.target.result);
      try {
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        const page = await pdf.getPage(1);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });
        const tempCanvas = document.createElement("canvas");
        const context = tempCanvas.getContext("2d");
        tempCanvas.height = viewport.height;
        tempCanvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        imgElement.src = tempCanvas.toDataURL("image/png");
        console.log("PDF rendered as image");
      } catch (err) {
        console.error("Error rendering PDF:", err);
        alert("Failed to render PDF. Please try another file.");
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    const reader = new FileReader();
    reader.onload = (e) => {
      imgElement.src = e.target.result;
      console.log("FileReader result:", e.target.result);
    };
    reader.readAsDataURL(file);
  }
}

// Display Uploaded Images
function displayUploadedImages() {
  if (!uploadedImageSection || !frontImg || !backImg) {
    console.error("Uploaded image section or img elements not found");
    return;
  }
  if (frontFile && backFile) {
    uploadedImageSection.style.display = "block";
  }
}

// Wait for Tesseract to load
function waitForTesseract() {
  return new Promise((resolve, reject) => {
    if (typeof Tesseract !== "undefined") {
      console.log("Tesseract is defined and ready immediately");
      resolve();
    } else {
      console.log("Tesseract not found yet, waiting...");
      const maxAttempts = 10;
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        console.log(
          `Waiting for Tesseract, attempt ${attempts}/${maxAttempts}`
        );
        if (typeof Tesseract !== "undefined") {
          console.log("Tesseract loaded successfully after waiting");
          clearInterval(interval);
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          console.error("Tesseract failed to load within timeout");
          reject(new Error("Tesseract.js failed to load after 5 seconds"));
        }
      }, 500);
    }
  });
}

// Preprocess Image for OCR
async function preprocessImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const grayscale = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        data[i] = grayscale;
        data[i + 1] = grayscale;
        data[i + 2] = grayscale;
      }

      for (let i = 0; i < data.length; i += 4) {
        const threshold = 128;
        const value = data[i] > threshold ? 255 : 0;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
      }

      ctx.putImageData(imageData, 0, 0);
      const preprocessedImage = new Image();
      preprocessedImage.onload = () => resolve(preprocessedImage);
      preprocessedImage.onerror = reject;
      preprocessedImage.src = canvas.toDataURL("image/png");
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// Preprocess OCR Text to Fix Common Errors
function preprocessOcrText(text) {
  let correctedText = text
    .replace(/5\/0/g, "S/o")
    .replace(/<5\/0/g, "S/o")
    .replace(/5\/o/g, "S/o")
    .replace(/S\/0/g, "S/o")
    .replace(/D\/0/g, "D/o")
    .replace(/F\/0/g, "F/o")
    .replace(/G0vernment/g, "Government")
    .replace(/D0B/g, "DOB")
    .replace(/Gend3r/g, "Gender");

  console.log("Preprocessed Text:", correctedText);
  return correctedText;
}

// Extract Text with Tesseract.js
if (extractBtn) {
  extractBtn.addEventListener("click", async () => {
    if (!frontFile || !backFile) {
      alert("Please upload both front and back images of your Aadhaar card.");
      return;
    }

    console.log("Extracting text from front and back images");
    extractBtn.textContent = "Extracting...";
    extractBtn.disabled = true;

    try {
      await waitForTesseract();

      const preprocessedFrontImage = await preprocessImage(frontFile);
      const preprocessedBackImage = await preprocessImage(backFile);

      const frontWorker = await Tesseract.createWorker("eng", 1, {
        workerPath:
          "https://cdn.jsdelivr.net/npm/tesseract.js@5.0.0/dist/worker.min.js",
        langPath: "https://tessdata.projectnaptha.com/4.0.0_fast",
        corePath:
          "https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.0/tesseract-core.wasm.js",
        logger: (m) => console.log("Front Worker Progress:", m),
      });

      await frontWorker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        preserve_interword_spaces: "1",
      });

      const frontResult = await frontWorker.recognize(preprocessedFrontImage);
      const rawFrontText = frontResult.data.text;
      const frontText = preprocessOcrText(rawFrontText);
      await frontWorker.terminate();

      const backWorker = await Tesseract.createWorker("eng", 1, {
        workerPath:
          "https://cdn.jsdelivr.net/npm/tesseract.js@5.0.0/dist/worker.min.js",
        langPath: "https://tessdata.projectnaptha.com/4.0.0_fast",
        corePath:
          "https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.0/tesseract-core.wasm.js",
        logger: (m) => console.log("Back Worker Progress:", m),
      });

      await backWorker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        preserve_interword_spaces: "1",
      });

      const backResult = await backWorker.recognize(preprocessedBackImage);
      const rawBackText = backResult.data.text;
      const backText = preprocessOcrText(rawBackText);
      await backWorker.terminate();

      console.log("Front Text:", frontText);
      console.log("Back Text:", backText);

      const extractedData = parseAadhaarData(frontText, backText);
      displayExtractedData(extractedData);
    } catch (error) {
      console.error("Error during OCR:", error);
      alert("Failed to extract text from the images. Check console for details.");
    } finally {
      extractBtn.textContent = "Extract Text";
      extractBtn.disabled = false;
    }
  });
}

// Parse Aadhaar Data
function parseAadhaarData(frontText, backText) {
  const data = {};

  data.government = frontText.match(/Government of India/i)
    ? "Government of India"
    : "N/A";

  const frontLines = frontText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);
  data.name = "N/A";
  for (let i = 0; i < frontLines.length; i++) {
    if (
      frontLines[i].match(/Government of India/i) &&
      i + 2 < frontLines.length
    ) {
      const potentialName = frontLines[i + 2]
        .replace(/^rm\s+/, "")
        .replace(/[^A-Za-z\s]/g, "")
        .trim();
      if (potentialName.match(/[A-Za-z]+\s+[A-Za-z]+/)) {
        data.name = potentialName;
        break;
      }
    }
  }
  if (data.name === "N/A") {
    const nameCandidates = frontLines.filter(
      (line) =>
        line.match(/[A-Za-z]{3,}\s+[A-Za-z]{3,}/) && !line.match(/DOB|Date|Government/i)
    );
    if (nameCandidates.length > 0)
      data.name = nameCandidates[0]
        .replace(/^rm\s+/, "")
        .replace(/[^A-Za-z\s]/g, "")
        .trim();
  }

  const dobMatch = frontText.match(/DOB\s*[:\-\s]*(\d{2}[-\/]\d{2}[-\/]\d{4})/i) ||
                   frontText.match(/(\d{2}[-\/]\d{2}[-\/]\d{4})/);
  data.dob = dobMatch ? dobMatch[1] : "N/A";

  const genderMatch = frontText.match(/(?:Gender|Sex)\s*[:\-\s]*(Male|Female|Transgender)/i) ||
                      frontText.match(/(Male|Female|Transgender)/i);
  data.gender = genderMatch ? genderMatch[1].trim() : "N/A";

  const aadhaarMatch =
    frontText.match(/\d{4}\s*\d{4}\s*\d{4}/) || frontText.match(/\d{12}/);
  data.aadhaar = aadhaarMatch ? aadhaarMatch[0].replace(/\s/g, "") : "N/A";

  let fatherMatch = backText.match(/(?:S\/o|D\/o|Father|Fathers Name|F\/o)\s*[:\-\s]*(.*?)(?=\n|$|,|\d{2,}|\bAddress\b)/i);
  data.father = "N/A";
  if (fatherMatch) {
    data.father = fatherMatch[1].replace(/[^A-Za-z\s]/g, "").trim();
  } else {
    const backLines = backText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);
    const potentialFatherLines = backLines.filter(
      (line) =>
        !line.match(/Address|Unique Identification|UIDAI|help@uidai|\d{6}/i) &&
        line.match(/[A-Za-z]{3,}\s+[A-Za-z]{3,}/)
    );
    if (potentialFatherLines.length > 0) {
      data.father = potentialFatherLines[0].replace(/[^A-Za-z\s]/g, "").trim();
    }
  }

  const backLines = backText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);
  let addressStart = -1;
  for (let i = 0; i < backLines.length; i++) {
    if (backLines[i].match(/S\s*\/\s*o|D\s*\/\s*o/i)) {
      addressStart = i;
      break;
    }
  }

  data.address = "N/A";
  if (addressStart !== -1) {
    const addressLines = backLines.slice(addressStart + 1).filter(
      (line) =>
        !line.match(/Unique Identification|UIDAI|help@uidai|vip|\d{4}\s*\d{4}\s*\d{4}|\d{12}/i) &&
        line.length > 3
    );
    const cleanedAddressLines = addressLines
      .map((line) => line.replace(/[^A-Za-z0-9\s,.-]/g, "").trim())
      .filter((line) => line.length > 3);
    let finalAddressLines = [];
    for (let line of cleanedAddressLines) {
      if (line.match(new RegExp(data.father, "i"))) continue;
      finalAddressLines.push(line);
      if (line.match(/\d{6}/)) break;
    }
    data.address = finalAddressLines.length > 0 ? finalAddressLines.join(", ") : "N/A";
  }

  console.log("Parsed Data:", data);
  return data;
}

// Generate Password for Personal Use
function generatePersonalPassword(name, dob) {
  const firstName = name.split(" ")[0] || "";
  let namePart = firstName.substring(0, 4).toUpperCase();
  if (firstName.length < 4) {
    namePart = firstName.toUpperCase();
  }
  const birthYearMatch = dob.match(/\d{4}$/);
  const birthYear = birthYearMatch ? birthYearMatch[0] : "0000";
  let password = namePart + birthYear;
  if (firstName.length < 4) {
    password = (namePart + birthYear).substring(0, 7);
  }
  console.log("Generated Password for Personal Use:", password);
  return password;
}

// Display Extracted Data
function displayExtractedData(data) {
  if (!extractedDataSection || !idCardSection) {
    console.error("Extracted data section or ID card section not found");
    return;
  }

  document.getElementById("government").textContent = data.government;
  document.getElementById("name").textContent = data.name;
  document.getElementById("dob").textContent = data.dob;
  document.getElementById("gender").textContent = data.gender;
  document.getElementById("aadhaar").textContent = data.aadhaar;
  document.getElementById("father").textContent = data.father;
  document.getElementById("address").textContent = data.address;

  const personImg = document.getElementById("person-img");
  personImg.src = "https://via.placeholder.com/100x120?text=Upload+Image";

  const uploadPersonImgBtn = document.getElementById("upload-person-img-btn");
  const personImgInput = document.getElementById("person-img-input");
  if (uploadPersonImgBtn && personImgInput) {
    uploadPersonImgBtn.addEventListener("click", () => {
      personImgInput.click();
    });

    personImgInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          personImage = event.target.result;
          personImg.src = personImage;
          document.getElementById("id-person-img").src = personImage;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  extractedDataSection.style.display = "block";

  document.getElementById("id-name").textContent = data.name;
  document.getElementById("id-dob").textContent = data.dob;
  document.getElementById("id-gender").textContent = data.gender;
  document.getElementById("id-aadhaar").textContent = data.aadhaar;
  document.getElementById("id-father").textContent = data.father;
  document.getElementById("id-address").textContent = data.address;
  document.getElementById("id-person-img").src = personImage || "https://via.placeholder.com/100x120?text=Upload+Image";
  idCardSection.style.display = "flex";

  attachEditListeners();

  if (downloadBtn) {
    downloadBtn.addEventListener("click", async () => {
      const idCard = document.getElementById("id-card");
      const name = document.getElementById("id-name").textContent;
      const dob = document.getElementById("id-dob").textContent;
      const gender = document.getElementById("id-gender").textContent;
      const aadhaar = document.getElementById("id-aadhaar").textContent;
      const father = document.getElementById("id-father").textContent;
      const address = document.getElementById("id-address").textContent;
      const personImgSrc = document.getElementById("id-person-img").src;

      const password = generatePersonalPassword(name, dob);
      alert(`Your PDF is password-protected. Use this password to open it: ${password}`);

      const canvas = await html2canvas(idCard, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      try {
        const response = await fetch("/generate-pdf/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
          body: JSON.stringify({
            name,
            dob,
            gender,
            aadhaar,
            father,
            address,
            personImgSrc,
            imgData,
            password,
          }),
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "personal-identity-card.pdf";
          a.click();
          window.URL.revokeObjectURL(url);
        } else {
          console.error("Error generating PDF:", response.statusText);
          alert("Failed to download the PDF. Please try again.");
        }
      } catch (err) {
        console.error("Error sending request:", err);
        alert("Failed to download the PDF. Please try again.");
      }
    });
  }

  if (shareWhatsappBtn) {
    shareWhatsappBtn.addEventListener("click", () => {
      shareMethod = "whatsapp";
      passwordModal.style.display = "block";
    });
  }

  if (shareEmailBtn) {
    shareEmailBtn.addEventListener("click", () => {
      shareMethod = "email";
      passwordModal.style.display = "block";
    });
  }

  if (passwordModalClose) {
    passwordModalClose.addEventListener("click", () => {
      passwordModal.style.display = "none";
      sharePasswordInput.value = "";
    });
  }

  if (sharePasswordSubmit) {
    sharePasswordSubmit.addEventListener("click", async () => {
      const password = sharePasswordInput.value.trim();
      if (!password) {
        alert("Please enter a password.");
        return;
      }

      const idCard = document.getElementById("id-card");
      const name = document.getElementById("id-name").textContent;
      const dob = document.getElementById("id-dob").textContent;
      const gender = document.getElementById("id-gender").textContent;
      const aadhaar = document.getElementById("id-aadhaar").textContent;
      const father = document.getElementById("id-father").textContent;
      const address = document.getElementById("id-address").textContent;
      const personImgSrc = document.getElementById("id-person-img").src;

      const canvas = await html2canvas(idCard, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      try {
        const response = await fetch("/generate-pdf/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
          body: JSON.stringify({
            name,
            dob,
            gender,
            aadhaar,
            father,
            address,
            personImgSrc,
            imgData,
            password,
          }),
        });

        if (response.ok) {
          const blob = await response.blob();
          const pdfUrl = URL.createObjectURL(blob);

          if (shareMethod === "whatsapp") {
            const whatsappUrl = `https://wa.me/?text=Here%20is%20my%20Personal%20Identity%20Card:%20${encodeURIComponent(pdfUrl)}%20%0AThe%20password%20to%20access%20the%20PDF%20is:%20${encodeURIComponent(password)}`;
            window.open(whatsappUrl, "_blank");
          } else if (shareMethod === "email") {
            const subject = "Personal Identity Card";
            const body = `Here is my Personal Identity Card: ${pdfUrl}\nThe password to access the PDF is: ${password}`;
            const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = emailUrl;
          }

          passwordModal.style.display = "none";
          sharePasswordInput.value = "";
          shareMethod = null;
        } else {
          console.error("Error generating PDF:", response.statusText);
          alert("Failed to share the PDF. Please try again.");
        }
      } catch (err) {
        console.error("Error sending request:", err);
        alert("Failed to share the PDF. Please try again.");
      }
    });
  }
}

// Add event listeners for edit buttons
function attachEditListeners() {
  const editButtons = document.querySelectorAll('.edit-btn');
  editButtons.forEach(button => {
    if (button.id === "upload-person-img-btn" || button.hasAttribute('data-listener')) return;

    button.setAttribute('data-listener', 'true');

    button.addEventListener('click', () => {
      const field = button.getAttribute('data-field');
      const span = document.getElementById(field);
      const currentValue = span.textContent;

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'edit-input';
      input.value = currentValue;

      const saveButton = document.createElement('button');
      saveButton.textContent = 'Save';
      saveButton.className = 'save-btn';

      span.replaceWith(input);
      button.replaceWith(saveButton);

      input.focus();

      const saveData = () => {
        const newValue = input.value.trim();
        const newSpan = document.createElement('span');
        newSpan.id = field;
        newSpan.textContent = newValue;

        const newEditButton = document.createElement('button');
        newEditButton.textContent = 'Edit';
        newEditButton.className = 'edit-btn';
        newEditButton.setAttribute('data-field', field);

        input.replaceWith(newSpan);
        saveButton.replaceWith(newEditButton);

        document.getElementById(`id-${field}`).textContent = newValue;
        attachEditListeners();
      };

      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          saveData();
        }
      });

      saveButton.addEventListener('click', saveData);
    });
  });
}

// Utility function to get CSRF token
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}