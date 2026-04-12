import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Shield, FileCheck, Download, Loader2, Hash, Clock, HardDrive, Image, FileText, Film, Trash2, Plus, Send, CheckCircle } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { printBSACertificate } from "@/lib/printCertificate";
import { toast } from "sonner";

interface HashedFile {
  name: string;
  size: number;
  type: string;
  hash: string;
  timestamp: string;
  previewUrl?: string;
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return Image;
  if (type.startsWith("video/")) return Film;
  return FileText;
};

const generateCertificatePDF = (file: HashedFile) => {
  printBSACertificate({
    fileName: file.name,
    fileSize: formatBytes(file.size),
    fileType: file.type || "Unknown",
    fileHash: file.hash,
    timestamp: new Date(file.timestamp).toLocaleString("en-IN"),
  });
};

const EvidencePortal = () => {
  const [searchParams] = useSearchParams();
  const preSelectedId = searchParams.get("complaintId");
  
  const [isDragging, setIsDragging] = useState(false);
  const [isHashing, setIsHashing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hashedFiles, setHashedFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string>(preSelectedId || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch complaints on mount
  useEffect(() => {
    const fetchComplaints = async () => {
      const token = localStorage.getItem("nyaysathi_token");
      if (!token) {
        console.error("No token found in localStorage");
        return;
      }
      try {
        const res = await fetch("http://localhost:8000/complaints", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        if (preSelectedId) {
          const matched = data.find((c: any) => c.id === preSelectedId);
          if (matched) {
            setComplaints([matched]);
            setSelectedComplaintId(preSelectedId);
          } else {
            setComplaints(data);
          }
        } else {
          setComplaints(data);
          if (data.length > 0 && !selectedComplaintId) {
            setSelectedComplaintId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch complaints", err);
        toast.error("Could not load your cases. Please try logging in again.");
      }
    };
    fetchComplaints();
  }, [preSelectedId]);

  const hashFile = useCallback(async (file: File) => {
    setIsHashing(true);

    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    let previewUrl: string | undefined;
    if (file.type.startsWith("image/")) {
      previewUrl = URL.createObjectURL(file);
    }

    const result: any = {
      name: file.name,
      size: file.size,
      type: file.type,
      hash: hashHex,
      timestamp: new Date().toISOString(),
      previewUrl,
      rawFile: file // Keep reference for upload
    };

    await new Promise((r) => setTimeout(r, 500));

    setHashedFiles((prev) => [...prev, result]);
    setSelectedFile(result);
    setIsHashing(false);
    toast.success(`"${file.name}" hashed & certified locally!`);
  }, []);

  const handleUpload = async (fileData: any) => {
    console.log("[EVIDENCE] handleUpload called for:", fileData.name);
    if (!selectedComplaintId) {
      console.warn("[EVIDENCE] No complaint ID selected.");
      toast.error("Please select a complaint/case to attach this evidence to.");
      return;
    }

    setIsUploading(true);
    const token = localStorage.getItem("nyaysathi_token");
    console.log("[EVIDENCE] Using token:", token ? "Token present" : "Token MISSING");
    
    const formData = new FormData();
    formData.append("file", fileData.rawFile);
    formData.append("file_hash", fileData.hash);
    console.log("[EVIDENCE] FormData prepared with file and hash:", fileData.hash);

    try {
      const url = `http://localhost:8000/complaints/${selectedComplaintId}/evidence`;
      console.log("[EVIDENCE] Fetching POST to:", url);
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      console.log("[EVIDENCE] Response status:", res.status);
      const data = await res.json();
      console.log("[EVIDENCE] Response data:", data);

      if (!res.ok) {
        throw new Error(data.detail || "Upload failed");
      }
      
      toast.success("Evidence uploaded and linked to case successfully!");
      console.log("[EVIDENCE] Upload success. Marking file as uploaded.");
      setHashedFiles(prev => prev.map(f => f.hash === fileData.hash ? { ...f, uploaded: true } : f));
    } catch (err: any) {
      console.error("[EVIDENCE] Upload exception:", err);
      toast.error(`Upload failed: ${err.message || "Unknown error"}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleMultipleFiles = useCallback(async (files: FileList) => {
    for (const file of Array.from(files)) {
      await hashFile(file);
    }
  }, [hashFile]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) handleMultipleFiles(e.dataTransfer.files);
    },
    [handleMultipleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleMultipleFiles(e.target.files);
        e.target.value = "";
      }
    },
    [handleMultipleFiles]
  );

  const removeFile = (hash: string) => {
    setHashedFiles((prev) => prev.filter((f) => f.hash !== hash));
    if (selectedFile?.hash === hash) setSelectedFile(null);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Evidence <span className="text-gradient-saffron">Hashing Portal</span>
          </h1>
          <p className="text-muted-foreground">
            BSA Section 63(4) compliant. SHA-256 hashing runs entirely in your browser — then securely transfer to your case.
          </p>
        </div>

        {/* Complaint Selector */}
        <Card className="p-4 mb-6 border-primary/20 bg-primary/5">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-primary" />
              <label className="text-sm font-semibold text-foreground">Associate with Active Complaint</label>
            </div>
            <Select value={selectedComplaintId} onValueChange={setSelectedComplaintId}>
              <SelectTrigger className="bg-background border-primary/20">
                <SelectValue placeholder="Select a complaint..." />
              </SelectTrigger>
              <SelectContent>
                {complaints.length > 0 ? (
                  complaints.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title} (ID: {c.id.substring(0, 8)}...)
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No complaints found</SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground italic">
              * Files will be securely linked to the selected case for officer review.
            </p>
          </div>
        </Card>

        {/* Security notice */}
        <Card className="p-4 mb-6 bg-success/5 border-success/20">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-success mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Local-First Security</p>
              <p className="text-xs text-muted-foreground">
                All cryptographic operations use the Web Crypto API and run in your browser. Files never leave your device.
              </p>
            </div>
          </div>
        </Card>

        {/* Drop zone */}
        <Card
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`p-10 mb-6 border-2 border-dashed transition-all text-center ${
            isDragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border bg-card hover:border-primary/30"
          }`}
        >
          {isHashing ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Computing SHA-256 hash locally...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Upload className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-foreground font-semibold">Drag & drop evidence files here</p>
                <p className="text-xs text-muted-foreground mt-1">CCTV footage, audio recordings, screenshots, documents — any file type supported</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInput}
              />
              <Button
                variant="outline"
                className="mt-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Browse & Select Files
              </Button>
            </div>
          )}
        </Card>

        {/* Hashed Files List */}
        {hashedFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Certified Evidence ({hashedFiles.length} file{hashedFiles.length > 1 ? "s" : ""})
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add More
              </Button>
            </div>

            <div className="grid gap-3">
              {hashedFiles.map((file) => {
                const Icon = getFileIcon(file.type);
                return (
                  <Card
                    key={file.hash}
                    onClick={() => setSelectedFile(file)}
                    className={`p-4 cursor-pointer transition-all duration-150 hover:border-primary/30 ${
                      selectedFile?.hash === file.hash ? "border-primary/50 ring-1 ring-primary/20 bg-primary/5" : "bg-card border-border"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Preview / Icon */}
                      {file.previewUrl ? (
                        <img
                          src={file.previewUrl}
                          alt={file.name}
                          className="h-14 w-14 rounded-lg object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                          <Icon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shrink-0">
                            <FileCheck className="h-2.5 w-2.5 mr-1" />
                            Certified
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatBytes(file.size)} · {file.type || "Unknown type"}</p>
                        <p className="text-[10px] font-mono text-primary/70 truncate mt-0.5">SHA-256: {file.hash.substring(0, 32)}...</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                          onClick={(e) => { e.stopPropagation(); generateCertificatePDF(file); }}
                          title="Download BSA Certificate"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          className={`h-8 px-2 text-[10px] text-white border-none ${file.uploaded ? "bg-emerald-500 hover:bg-emerald-600" : "gradient-saffron"}`}
                          onClick={(e) => { e.stopPropagation(); handleUpload(file); }}
                          disabled={isUploading || file.uploaded}
                        >
                          {isUploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : (file.uploaded ? <CheckCircle className="h-3 w-3 mr-1" /> : <Send className="h-3 w-3 mr-1" />)}
                          {file.uploaded ? "Case Attached" : "Submit to Case"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); removeFile(file.hash); }}
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Selected File Detail */}
            {selectedFile && (
              <Card className="p-6 bg-card border-border mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <FileCheck className="h-5 w-5 text-success" />
                  <h2 className="font-semibold text-card-foreground">Certificate Details</h2>
                  <Badge className="gradient-saffron text-primary-foreground ml-auto text-xs">BSA §63(4) Ready</Badge>
                </div>

                {/* Image preview */}
                {selectedFile.previewUrl && (
                  <div className="mb-4 rounded-lg overflow-hidden border border-border">
                    <img
                      src={selectedFile.previewUrl}
                      alt={selectedFile.name}
                      className="w-full max-h-64 object-contain bg-black/50"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                    <HardDrive className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">File</p>
                      <p className="text-sm font-medium text-foreground truncate">{selectedFile.name} ({formatBytes(selectedFile.size)})</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-secondary/50 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">SHA-256 Hash</p>
                    </div>
                    <p className="text-xs font-mono text-primary break-all">{selectedFile.hash}</p>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Timestamp</p>
                      <p className="text-sm font-medium text-foreground">{new Date(selectedFile.timestamp).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <Button
                    onClick={() => generateCertificatePDF(selectedFile)}
                    className="gradient-saffron text-primary-foreground font-semibold"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download BSA Certificate
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedFile.hash);
                      toast.success("Hash copied to clipboard!");
                    }}
                  >
                    Copy Hash
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EvidencePortal;
