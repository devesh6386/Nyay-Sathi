import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Upload, FileText, CheckCircle, Loader2, Mic, MicOff, Square, User, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExtractedData {
  translatedText: string;
  entities: { label: string; value: string }[];
  bnsSections: { section: string; title: string; confidence: number }[];
  firDraft: string;
}

interface ComplainantDetails {
  fullName: string;
  fatherName: string;
  age: string;
  gender: string;
  phone: string;
  address: string;
  idType: string;
  idNumber: string;
}

const initialDetails: ComplainantDetails = {
  fullName: "",
  fatherName: "",
  age: "",
  gender: "",
  phone: "",
  address: "",
  idType: "",
  idNumber: "",
};

const CitizenComplaint = () => {
  const [complaint, setComplaint] = useState("");
  const [details, setDetails] = useState<ComplainantDetails>(initialDetails);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ExtractedData | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<{name: string, hash: string, rawFile: File}[]>([]);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const updateDetail = (key: keyof ComplainantDetails, value: string) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Recording started — speak your complaint");
    } catch (err) {
      console.error("Mic access error:", err);
      toast.error("Could not access microphone. Please allow mic permission.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sarvam-stt`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Transcription failed");
      }

      const data = await response.json();
      const transcript = data.transcript || "";
      if (transcript) {
        setComplaint((prev) => (prev ? prev + " " + transcript : transcript));
        toast.success("Transcription complete!");
      } else {
        toast.warning("No speech detected. Please try again.");
      }
    } catch (err) {
      console.error("Transcription error:", err);
      toast.error(err instanceof Error ? err.message : "Transcription failed");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSubmit = async () => {
    if (!complaint.trim()) return;
    if (!details.fullName.trim()) {
      toast.error("Please enter your full name before submitting.");
      return;
    }
    setIsProcessing(true);
    try {
      const response = await fetch(
        "http://localhost:8000/analyze-complaint",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("nyaysathi_token")}`
          },
          body: JSON.stringify({ complaint, complainant: details }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Analysis failed");
      }

      const data: ExtractedData = await response.json();
      setResult(data);
      toast.success("AI analysis complete!");
    } catch (err) {
      console.error("Analysis error:", err);
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result) return;
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage([600, 842]); // A4
      const { width, height } = page.getSize();
      
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const margin = 40;
      let yOffset = height - margin;

      const drawBorder = (p: any) => {
        p.drawRectangle({
          x: margin - 10,
          y: margin - 10,
          width: width - 2 * margin + 20,
          height: height - 2 * margin + 20,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });
      };
      
      drawBorder(page);

      page.drawText('FORM NO. 1', { x: margin, y: yOffset, size: 10, font: boldFont });
      yOffset -= 20;

      // Header
      page.drawText('FIRST INFORMATION REPORT', {
        x: width / 2 - 120,
        y: yOffset,
        size: 16,
        font: boldFont,
      });
      yOffset -= 15;

      page.drawText('(Under Section 173 BNSS / 154 Cr.P.C.)', {
        x: width / 2 - 95,
        y: yOffset,
        size: 10,
        font: font,
      });
      yOffset -= 30;

      const getEntity = (lbl: string) => result.entities.find(e => e.label.toLowerCase().includes(lbl.toLowerCase()))?.value || '---';
      const loc = getEntity('location');
      const time = getEntity('time');
      const suspect = getEntity('suspect');
      const stolen = getEntity('stolen');

      const drawRow = (label: string, value: string) => {
        page.drawText(label, { x: margin, y: yOffset, size: 10, font: boldFont });
        // Handle long values in rows roughly
        if (value.length > 60) {
            page.drawText(value.substring(0, 60) + '...', { x: margin + 170, y: yOffset, size: 10, font });
        } else {
            page.drawText(value, { x: margin + 170, y: yOffset, size: 10, font });
        }
      };

      const dateStr = new Date().toLocaleDateString();
      const timeStr = new Date().toLocaleTimeString();
      const sectionsStr = result.bnsSections.map(s => s.section).join(', ') || '---';

      // 1. District, PS, Year
      page.drawText('1. District:', { x: margin, y: yOffset, size: 10, font: boldFont });
      page.drawText('Delhi', { x: margin + 60, y: yOffset, size: 10, font });
      page.drawText('P.S.:', { x: 180, y: yOffset, size: 10, font: boldFont });
      page.drawText('Pending Assign.', { x: 210, y: yOffset, size: 10, font });
      page.drawText('Year:', { x: 330, y: yOffset, size: 10, font: boldFont });
      page.drawText(new Date().getFullYear().toString(), { x: 360, y: yOffset, size: 10, font });
      page.drawText('Date:', { x: 420, y: yOffset, size: 10, font: boldFont });
      page.drawText(dateStr, { x: 455, y: yOffset, size: 10, font });
      yOffset -= 20;

      drawRow('2. Acts & Sections:', sectionsStr);
      yOffset -= 20;

      drawRow('3. (a) Occurrence of Offence:', '');
      yOffset -= 15;
      drawRow('   Date/Time:', time);
      yOffset -= 15;
      drawRow('   (b) Information received at P.S.:', `${dateStr} at ${timeStr}`);
      yOffset -= 20;

      drawRow('4. Type of Information:', 'Written / Digital');
      yOffset -= 20;

      drawRow('5. Place of Occurrence:', '');
      yOffset -= 15;
      drawRow('   Address:', loc);
      yOffset -= 20;

      drawRow('6. Complainant / Informant:', '');
      yOffset -= 15;
      drawRow('   (a) Name:', details.fullName || '---');
      yOffset -= 15;
      drawRow('   (b) Father\'s/Husband\'s Name:', details.fatherName || '---');
      yOffset -= 15;
      drawRow('   (c) Nationality / Age:', `Indian / ${details.age || '---'}`);
      yOffset -= 15;
      drawRow('   (d) ID Details:', `${details.idType || 'None'}: ${details.idNumber || 'None'}`);
      yOffset -= 15;
      drawRow('   (e) Phone / Contact:', details.phone || '---');
      yOffset -= 15;
      drawRow('   (f) Address:', details.address || '---');
      yOffset -= 20;

      drawRow('7. Details of suspected accused:', suspect);
      yOffset -= 20;

      drawRow('8. Particulars of properties stolen:', stolen);
      yOffset -= 20;

      const evidenceStr = evidenceFiles.length > 0 
           ? evidenceFiles.map(e => `${e.name} (SHA-256: ${e.hash.substring(0,8)}...)`).join(', ') 
           : 'None Attached';
      drawRow('9. Attached Digital Evidence:', '');
      yOffset -= 15;
      drawRow('   Hashes & Files:', evidenceStr);
      yOffset -= 20;

      // Draw Separator
      page.drawLine({
        start: { x: margin, y: yOffset },
        end: { x: width - margin, y: yOffset },
        thickness: 1,
      });
      yOffset -= 20;

      page.drawText('12. F.I.R. Contents (Statement / Complaint Details):', { x: margin, y: yOffset, size: 11, font: boldFont });
      yOffset -= 20;
      
      const lines = result.firDraft.split('\n');
      for (const line of lines) {
        const words = line.split(' ');
        let currentLine = '';
        for (const word of words) {
          const testLine = currentLine ? currentLine + ' ' + word : word;
          const textWidth = font.widthOfTextAtSize(testLine, 10);
          if (textWidth > width - 2 * margin) {
            page.drawText(currentLine, { x: margin, y: yOffset, size: 10, font });
            yOffset -= 14;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) {
          page.drawText(currentLine, { x: margin, y: yOffset, size: 10, font });
          yOffset -= 14;
        }
        
        if (yOffset < margin + 60) {
          page = pdfDoc.addPage([600, 842]);
          drawBorder(page);
          yOffset = height - margin - 20;
        }
      }

      yOffset -= 40;
      if (yOffset < margin + 40) {
          page = pdfDoc.addPage([600, 842]);
          drawBorder(page);
          yOffset = height - margin - 40;
      }

      page.drawText('Signature / Thumb Impression of', { x: margin, y: yOffset, size: 10, font: font });
      page.drawText('Signature of Officer-in-Charge, Police Station', { x: width - margin - 220, y: yOffset, size: 10, font: font });
      yOffset -= 15;
      page.drawText('Complainant / Informant', { x: margin, y: yOffset, size: 10, font: font });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FIR_Draft_${details.fullName ? details.fullName.replace(/\s+/g, '_') : 'NyayaSathi'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to generate official PDF document');
    }
  };

  const handleSubmitToOfficer = async () => {
    try {
      toast.loading("Submitting complaint to the nodal police station...");
      const token = localStorage.getItem("nyaysathi_token");
      if (!token) {
        toast.error("You must be logged in to file a complaint.");
        return;
      }
      
      const title = result?.entities.find(e => e.label.toLowerCase() === 'suspect')?.value || "Pending Assignment";
      const description = result?.firDraft || complaint;
      
      const res = await fetch(`http://localhost:8000/complaints?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`, {
          method: "POST",
          headers: {
              "Authorization": `Bearer ${token}`
          }
      });

      if (!res.ok) {
          throw new Error("Failed to submit complaint to server");
      }

      const newComplaint = await res.json();
      const complaintId = newComplaint.id;

      // Upload each evidence file to the backend and link it to this complaint
      if (evidenceFiles.length > 0 && complaintId) {
        toast.loading(`Uploading ${evidenceFiles.length} evidence file(s)...`);
        let uploadedCount = 0;
        for (const ev of evidenceFiles) {
          try {
            const formData = new FormData();
            formData.append("file", ev.rawFile);
            formData.append("file_hash", ev.hash);
            const uploadRes = await fetch(`http://localhost:8000/complaints/${complaintId}/evidence`, {
              method: "POST",
              headers: { "Authorization": `Bearer ${token}` },
              body: formData,
            });
            if (uploadRes.ok) uploadedCount++;
            else console.error(`[EVIDENCE] Upload failed for ${ev.name}:`, await uploadRes.text());
          } catch (uploadErr) {
            console.error(`[EVIDENCE] Exception uploading ${ev.name}:`, uploadErr);
          }
        }
        toast.dismiss();
        if (uploadedCount === evidenceFiles.length) {
          toast.success(`Complaint filed & ${uploadedCount} evidence file(s) uploaded successfully.`);
        } else {
          toast.warning(`Complaint filed. ${uploadedCount}/${evidenceFiles.length} evidence file(s) uploaded.`);
        }
      } else {
        toast.dismiss();
        toast.success("Complaint successfully filed. The nearest police station will review it shortly.");
      }
      
    } catch (err: any) {
      console.error(err);
      toast.dismiss();
      toast.error(err.message || "Failed to submit complaint. Please try again.");
    }
  };

  const handleEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    toast.info("Computing secure BSA hashes...");
    const files = Array.from(e.target.files);
    
    try {
      const hashed = await Promise.all(
        files.map(async (file) => {
          const buffer = await file.arrayBuffer();
          const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
          return { name: file.name, hash: hashHex, rawFile: file };
        })
      );
      
      setEvidenceFiles((prev) => [...prev, ...hashed]);
      toast.success(`${hashed.length} evidence file(s) securely attached and hashed.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to hash evidence.");
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            File a <span className="text-gradient-saffron">Complaint</span>
          </h1>
          <p className="text-muted-foreground">
            Describe your grievance in any language. Our AI will extract facts, identify legal sections, and generate a formal FIR draft.
          </p>
        </div>

        {/* Complainant Details */}
        <Card className="p-6 mb-6 bg-card border-border">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-card-foreground">Complainant Details</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input id="fullName" placeholder="e.g. Rajesh Kumar" value={details.fullName} onChange={(e) => updateDetail("fullName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fatherName">Father's / Spouse's Name</Label>
              <Input id="fatherName" placeholder="e.g. Shri Ramesh Kumar" value={details.fatherName} onChange={(e) => updateDetail("fatherName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" placeholder="e.g. 32" value={details.age} onChange={(e) => updateDetail("age", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gender">Gender</Label>
              <Select value={details.gender} onValueChange={(v) => updateDetail("gender", v)}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="e.g. 9876543210" value={details.phone} onChange={(e) => updateDetail("phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="idType">ID Type</Label>
              <Select value={details.idType} onValueChange={(v) => updateDetail("idType", v)}>
                <SelectTrigger id="idType">
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aadhaar">Aadhaar</SelectItem>
                  <SelectItem value="PAN">PAN</SelectItem>
                  <SelectItem value="Voter ID">Voter ID</SelectItem>
                  <SelectItem value="Passport">Passport</SelectItem>
                  <SelectItem value="Driving License">Driving License</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="idNumber">ID Number</Label>
              <Input id="idNumber" placeholder="e.g. XXXX-XXXX-1234" value={details.idNumber} onChange={(e) => updateDetail("idNumber", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" placeholder="e.g. 45, Rajpur Road, New Delhi - 110001" value={details.address} onChange={(e) => updateDetail("address", e.target.value)} />
            </div>
          </div>
        </Card>

        {/* Complaint Input */}
        <Card className="p-6 mb-6 bg-card border-border">
          <label className="text-sm font-medium text-card-foreground mb-2 block">
            Your Complaint (Hindi, English, or mixed)
          </label>
          <Textarea
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            placeholder="उदाहरण: कल रात करीब 8:30 बजे Connaught Place के पास एक अनजान व्यक्ति ने मेरा phone छीन लिया। वो DL-5S-AB-1234 नंबर की bike पर भाग गया। मेरा iPhone 15 था, करीब ₹79,900 का..."
            className="min-h-[120px] bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground"
          />

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!complaint.trim() || isProcessing}
              className="gradient-saffron text-primary-foreground font-semibold"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing with AI...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Analyze & Generate FIR
                </>
              )}
            </Button>

            {isRecording ? (
              <Button variant="destructive" onClick={stopRecording} className="animate-pulse">
                <Square className="mr-2 h-4 w-4" />
                Stop Recording
              </Button>
            ) : (
              <Button variant="outline" onClick={startRecording} disabled={isTranscribing}>
                {isTranscribing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Speak Complaint
                  </>
                )}
              </Button>
            )}

            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleEvidenceUpload}
              />
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors cursor-pointer">
                <Upload className="h-4 w-4" />
                {evidenceFiles.length > 0 ? `${evidenceFiles.length} File(s) Attached` : "Upload Evidence"}
              </span>
            </label>
          </div>
          
          {evidenceFiles.length > 0 && (
            <div className="mt-4 p-3 bg-secondary/50 rounded-lg border border-border">
              <p className="text-xs font-semibold text-foreground mb-2">Securely Hashed & Attached:</p>
              <div className="flex flex-wrap gap-2">
                {evidenceFiles.map(e => (
                  <Badge key={e.hash} variant="outline" className="text-xs font-mono bg-background">
                    {e.name} ({e.hash.substring(0, 8)}...)
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-fade-up">
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <h2 className="font-semibold text-card-foreground">Translated & Normalized</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.translatedText}</p>
            </Card>

            <Card className="p-6 bg-card border-border">
              <h2 className="font-semibold text-card-foreground mb-4">Extracted Entities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {result.entities.map((e) => (
                  <div key={e.label} className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground">{e.label}</p>
                    <p className="text-sm font-medium text-foreground">{e.value}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-card border-border">
              <h2 className="font-semibold text-card-foreground mb-4">Matched BNS Sections</h2>
              <div className="space-y-3">
                {result.bnsSections.map((s) => (
                  <div key={s.section} className="flex items-center justify-between rounded-lg bg-secondary/50 p-4">
                    <div>
                      <p className="font-medium text-foreground">{s.section}</p>
                      <p className="text-sm text-muted-foreground">{s.title}</p>
                    </div>
                    <Badge
                      variant={s.confidence > 90 ? "default" : "secondary"}
                      className={s.confidence > 90 ? "gradient-saffron text-primary-foreground" : ""}
                    >
                      {s.confidence}% match
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-card border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-card-foreground">Generated FIR Draft</h2>
                </div>
                <Badge variant="outline" className="border-primary/30 text-primary">AI Generated</Badge>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground bg-secondary/30 rounded-lg p-4 font-sans leading-relaxed">
                {result.firDraft}
              </pre>
              <div className="mt-4 flex gap-3">
                <Button className="gradient-saffron text-primary-foreground font-semibold" onClick={handleSubmitToOfficer}>Submit to Officer</Button>
                <Button variant="outline" onClick={handleDownloadPDF}>Download PDF</Button>
              </div>
            </Card>

            {/* Explain My Rights Section */}
            <Card className="p-6 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-2 mb-4">
                <Info className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-primary">Explain My Rights</h2>
              </div>
              <div className="space-y-4">
                <div className="bg-background rounded-lg p-4 border border-border/50">
                  <h3 className="font-medium text-sm text-foreground mb-1">What are your rights?</h3>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>You have the right to get a free copy of this FIR immediately.</li>
                    <li>If police refuse to file, you can send the complaint to the SP via post under BNSS.</li>
                    <li>For non-cognizable offenses, police will give you an NCR (Non-Cognizable Report).</li>
                  </ul>
                </div>
                <div className="bg-background rounded-lg p-4 border border-border/50">
                  <h3 className="font-medium text-sm text-foreground mb-1">What will police do next?</h3>
                  <p className="text-sm text-muted-foreground">
                    After you submit, an IO (Investigating Officer) will be assigned. They may visit the crime scene (Location: {result.entities.find(e => e.label.toLowerCase() === 'location')?.value || 'As mentioned'}), collect digital evidence (which you can hash securely in our Evidence Portal), and record statements.
                  </p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-border/50">
                  <h3 className="font-medium text-sm text-foreground mb-1">Expected Timeline</h3>
                  <p className="text-sm text-muted-foreground">
                    Under new laws, police must inform you about the progress of the investigation within 90 days. For serious crimes, action begins immediately upon FIR registration.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenComplaint;
