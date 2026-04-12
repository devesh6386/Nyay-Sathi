export interface FIRData {
  complainantName: string;
  fatherName: string;
  age: string;
  idDetails: string;
  phone: string;
  address: string;
  suspect: string;
  stolen: string;
  location: string;
  time: string;
  sections: string;
  evidence: string;
  draft: string;
  generatedFileName: string;
}

export function printFIR(data: FIRData) {
  const win = window.open("", "_blank", "width=800,height=1000");
  if (!win) {
    alert("Pop-up blocked. Please allow pop-ups for this page and try again.");
    return;
  }

  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const dateStr = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
  const year = new Date().getFullYear().toString();

  // Handle line breaks in draft text gracefully
  const formattedDraft = data.draft.replace(/\n/g, '<br/>');

  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>FIR Draft - ${data.generatedFileName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Hindi&family=Inter:wght@400;600;700&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      /* Inter for English, Tiro Devanagari Hindi for Hindi */
      font-family: 'Inter', 'Tiro Devanagari Hindi', system-ui, sans-serif;
      background: #fff;
      color: #111;
      padding: 40px;
    }

    .cert {
      max-width: 720px;
      margin: 0 auto;
      border: 2px solid #111;
      border-radius: 4px;
      padding: 40px;
      background: #fff;
    }

    .form-no {
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 20px;
    }

    .header-text {
      text-align: center;
      margin-bottom: 40px;
    }

    .header-text h1 {
      font-size: 22px;
      font-weight: 700;
      text-decoration: underline;
      margin-bottom: 8px;
    }

    .header-text h3 {
      font-size: 12px;
      font-weight: 400;
      color: #444;
    }

    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      font-size: 13px;
    }

    .row-item {
      display: flex;
      gap: 8px;
    }

    .row-item strong {
      font-weight: 700;
    }

    .section {
      margin-bottom: 24px;
      font-size: 13px;
      line-height: 1.6;
    }

    .section strong.title {
      display: block;
      margin-bottom: 8px;
      font-weight: 700;
      font-size: 14px;
    }

    .sub-section {
      padding-left: 20px;
      margin-bottom: 12px;
    }
    
    .sub-section span.label {
      font-weight: 600;
      color: #333;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 20px;
    }
    
    table, th, td {
      border: 1px solid #ccc;
    }
    
    td {
      padding: 8px 12px;
      vertical-align: top;
      font-size: 13px;
    }

    td.label-col {
      width: 40%;
      font-weight: 600;
      color: #333;
      background: #fafafa;
    }

    .draft-box {
      border: 1px solid #e2e2e2;
      padding: 20px;
      background: #fdfdfd;
      font-size: 14px;
      line-height: 1.8;
      border-radius: 4px;
    }

    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 80px;
      padding-top: 20px;
    }

    .sig-line {
      width: 250px;
      text-align: center;
      font-size: 12px;
      color: #333;
      border-top: 1px dashed #777;
      padding-top: 8px;
    }

    @media print {
      body { padding: 0; }
      .cert { border: none; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="cert">
    <div class="form-no">FORM NO. 1</div>
    
    <div class="header-text">
      <h1>FIRST INFORMATION REPORT</h1>
      <h3>(Under Section 173 BNSS / 154 Cr.P.C.)</h3>
    </div>

    <div class="row">
      <div class="row-item"><strong>1. District:</strong> Delhi</div>
      <div class="row-item"><strong>P.S.:</strong> Pending Assign.</div>
      <div class="row-item"><strong>Year:</strong> ${year}</div>
      <div class="row-item"><strong>Date:</strong> ${dateStr}</div>
    </div>

    <div class="section">
      <strong class="title">2. Acts &amp; Sections:</strong>
      ${data.sections || "---"}
    </div>

    <div class="section">
      <strong class="title">3. Occurrence of Offence:</strong>
      <div class="sub-section">
        <span class="label">(a) Date/Time:</span> ${data.time || "---"}
      </div>
      <div class="sub-section">
        <span class="label">(b) Information received at P.S.:</span> ${dateStr} at ${new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}
      </div>
    </div>

    <div class="section">
      <strong class="title">4. Type of Information:</strong> Written / Digital
    </div>

    <div class="section">
      <strong class="title">5. Place of Occurrence:</strong>
      <div class="sub-section">
        <span class="label">Address:</span> ${data.location || "---"}
      </div>
    </div>

    <div class="section">
      <strong class="title">6. Complainant / Informant Details:</strong>
      <table>
        <tr><td class="label-col">(a) Name</td><td>${data.complainantName || "---"}</td></tr>
        <tr><td class="label-col">(b) Father's / Husband's Name</td><td>${data.fatherName || "---"}</td></tr>
        <tr><td class="label-col">(c) Nationality / Age</td><td>Indian / ${data.age || "---"}</td></tr>
        <tr><td class="label-col">(d) ID Details</td><td>${data.idDetails || "None"}</td></tr>
        <tr><td class="label-col">(e) Phone / Contact</td><td>${data.phone || "---"}</td></tr>
        <tr><td class="label-col">(f) Address</td><td>${data.address || "---"}</td></tr>
      </table>
    </div>

    <div class="section">
      <strong class="title">7. Details of suspected accused:</strong>
      ${data.suspect || "---"}
    </div>

    <div class="section">
      <strong class="title">8. Particulars of properties stolen:</strong>
      ${data.stolen || "---"}
    </div>

    <div class="section">
      <strong class="title">9. Attached Digital Evidence:</strong>
      ${data.evidence || "None Attached"}
    </div>

    <div class="section" style="margin-top: 40px;">
      <strong class="title" style="border-bottom: 2px solid #ccc; padding-bottom: 8px; margin-bottom: 16px;">12. F.I.R. Contents (Statement / Complaint Details):</strong>
      <div class="draft-box">
        ${formattedDraft}
      </div>
    </div>

    <div class="signatures">
      <div class="sig-line">
        Signature / Thumb Impression of<br/>Complainant / Informant
      </div>
      <div class="sig-line">
        Signature of Officer-in-Charge<br/>Police Station
      </div>
    </div>
  </div>

  <div class="no-print" style="text-align:center; margin-top:30px; margin-bottom: 50px;">
    <button onclick="window.print()" style="
      background: linear-gradient(135deg, #0b1120, #1a2740);
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
    // Automatically trigger print dialog after rendering
    window.onload = () => setTimeout(() => window.print(), 500);
  </script>
</body>
</html>`);
  win.document.close();
}
