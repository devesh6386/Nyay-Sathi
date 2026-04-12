/**
 * Opens a styled BSA Section 63(4) certificate in a new browser window
 * and triggers the system print dialog. The user saves it as PDF via
 * "Save as PDF" — no external libraries needed, works in every browser.
 */
export interface CertificateData {
  fileName: string;
  fileSize: string;
  fileType: string;
  fileHash: string;
  timestamp: string;
}

export function printBSACertificate(data: CertificateData) {
  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) {
    alert("Pop-up blocked. Please allow pop-ups for this page and try again.");
    return;
  }

  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>BSA Certificate - ${data.fileName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Courier+Prime&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: #fff;
      color: #111;
      padding: 40px;
    }

    .cert {
      max-width: 720px;
      margin: 0 auto;
      border: 2px solid #e2e2e2;
      border-radius: 12px;
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #0b1120 0%, #1a2740 100%);
      color: #fff;
      padding: 36px 40px 28px;
    }

    .header .badge {
      display: inline-block;
      background: rgba(255,153,51,0.15);
      border: 1px solid rgba(255,153,51,0.4);
      color: #ff9933;
      font-size: 11px;
      letter-spacing: 0.08em;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 20px;
      margin-bottom: 14px;
      text-transform: uppercase;
    }

    .header h1 {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.01em;
      margin-bottom: 4px;
    }

    .header p {
      color: rgba(255,255,255,0.5);
      font-size: 13px;
    }

    .accent-bar {
      height: 4px;
      background: linear-gradient(90deg, #ff9933, #ff6600);
    }

    .body {
      padding: 36px 40px;
    }

    .intro {
      background: #f8f9fb;
      border-left: 4px solid #ff9933;
      border-radius: 0 8px 8px 0;
      padding: 14px 18px;
      font-size: 13px;
      color: #444;
      margin-bottom: 32px;
      line-height: 1.6;
    }

    .section-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #888;
      margin-bottom: 14px;
    }

    .fields {
      display: grid;
      gap: 12px;
      margin-bottom: 32px;
    }

    .field {
      background: #f8f9fb;
      border: 1px solid #eaecef;
      border-radius: 8px;
      padding: 12px 16px;
    }

    .field label {
      display: block;
      font-size: 11px;
      color: #888;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 4px;
    }

    .field .value {
      font-size: 13px;
      color: #111;
      font-weight: 500;
      word-break: break-all;
    }

    .field.hash-field .value {
      font-family: 'Courier Prime', 'Courier New', monospace;
      font-size: 12px;
      color: #d14;
      background: #fff6f6;
      padding: 8px 10px;
      border-radius: 6px;
      margin-top: 4px;
    }

    .declaration {
      background: #fffbf5;
      border: 1px solid #fde8c0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 32px;
    }

    .declaration h3 {
      font-size: 13px;
      font-weight: 700;
      color: #b45309;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .declaration p {
      font-size: 13px;
      color: #555;
      line-height: 1.7;
    }

    .footer {
      border-top: 1px solid #eaecef;
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .footer .brand {
      font-size: 12px;
      font-weight: 700;
      color: #111;
    }

    .footer .brand span {
      color: #ff9933;
    }

    .footer .generated {
      font-size: 11px;
      color: #aaa;
    }

    @media print {
      body { padding: 0; }
      .cert { border: none; border-radius: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="cert">
    <div class="header">
      <div class="badge">BSA Section 63(4) Compliant</div>
      <h1>Certificate of Digital Evidence</h1>
      <p>Bharatiya Sakshya Adhiniyam, 2023 &mdash; Electronic Record Admissibility</p>
    </div>
    <div class="accent-bar"></div>
    <div class="body">

      <p class="intro">
        This certificate documents the cryptographic integrity of the digital evidence listed below,
        generated in compliance with <strong>BSA Section 63(4)</strong> for the admissibility of
        electronic records in Indian courts.
      </p>

      <p class="section-title">Evidence Details</p>
      <div class="fields">
        <div class="field">
          <label>File Name</label>
          <div class="value">${data.fileName}</div>
        </div>
        <div class="field">
          <label>File Size</label>
          <div class="value">${data.fileSize}</div>
        </div>
        <div class="field">
          <label>File Type</label>
          <div class="value">${data.fileType}</div>
        </div>
        <div class="field hash-field">
          <label>SHA-256 Hash (Integrity Fingerprint)</label>
          <div class="value">${data.fileHash}</div>
        </div>
        <div class="field">
          <label>Timestamp of Hashing</label>
          <div class="value">${data.timestamp}</div>
        </div>
        <div class="field">
          <label>Hashing Method</label>
          <div class="value">SHA-256 via Web Crypto API (client-side)</div>
        </div>
      </div>

      <div class="declaration">
        <h3>&#9670; Legal Declaration</h3>
        <p>
          I hereby certify that the above electronic record has been processed in accordance with
          the provisions of BSA Section 63(4). The SHA-256 hash was computed locally within the
          user's web browser using the Web Crypto API. At no point was the file uploaded to any
          external server prior to hashing. The integrity of this hash can be independently
          verified by recomputing the SHA-256 digest of the original file.
        </p>
      </div>

      <div class="footer">
        <div class="brand">Nyaya<span>Sathi</span></div>
        <div class="generated">Generated: ${now}</div>
      </div>

    </div>
  </div>

  <div class="no-print" style="text-align:center; margin-top:24px;">
    <button onclick="window.print()" style="
      background: linear-gradient(135deg, #ff9933, #ff6600);
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    ">Save as PDF (Print)</button>
  </div>

  <script>
    window.onload = () => setTimeout(() => window.print(), 500);
  </script>
</body>
</html>`);
  win.document.close();
}
