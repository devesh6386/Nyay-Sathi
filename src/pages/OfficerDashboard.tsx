import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Clock, CheckCircle, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  dispatched: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  resolved: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const statusLabels: Record<string, string> = {
  pending: "Pending Review",
  dispatched: "Dispatched",
  resolved: "Resolved",
};

interface FIR {
  id: string;
  citizen: string;
  section: string;
  location: string;
  date: string;
  status: string;
  summary: string;
  confidence: number;
  fullDraft: string;
}

const OfficerDashboard = () => {
  const [firs, setFirs] = useState<FIR[]>([]);
  const [selectedFIR, setSelectedFIR] = useState<FIR | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchFirs = async (quiet = false) => {
    if (!quiet) setLoading(true);
    const token = localStorage.getItem("nyaysathi_token");
    if (!token) { setLoading(false); return; }

    try {
      const res = await fetch("http://localhost:8000/complaints", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();

      const mapped: FIR[] = data.map((item: any) => ({
        id: item.id,
        citizen: item.citizen_name || "Unknown Citizen",
        section: "BNS Auto-assigned",
        location: item.title || "Not specified",
        date: new Date(item.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        status: item.status || "pending",
        summary: (item.description || "").substring(0, 160) + "...",
        confidence: 90,
        fullDraft: item.description || "",
      }));

      setFirs(mapped);
      setSelectedFIR(prev => {
        if (!prev) return mapped[0] ?? null;
        const stillExists = mapped.find(m => m.id === prev.id);
        return stillExists ?? (mapped[0] ?? null);
      });
    } catch {
      if (!quiet) toast.error("Failed to load complaints from server.");
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    fetchFirs();
    const interval = setInterval(() => fetchFirs(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDispatch = async () => {
    if (!selectedFIR) return;
    setIsDispatching(true);
    try {
      const token = localStorage.getItem("nyaysathi_token");
      const res = await fetch(`http://localhost:8000/complaints/${selectedFIR.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: "dispatched" })
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("FIR dispatched to the regional precinct.");
      const updatedFirs = firs.map(f => f.id === selectedFIR.id ? { ...f, status: "dispatched" } : f);
      setFirs(updatedFirs);
      setSelectedFIR({ ...selectedFIR, status: "dispatched" });
    } catch (err: any) {
      toast.error("Failed to dispatch FIR.");
    } finally {
      setIsDispatching(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedFIR) return;
    try {
      const token = localStorage.getItem("nyaysathi_token");
      const res = await fetch(`http://localhost:8000/complaints/${selectedFIR.id}?description=${encodeURIComponent(draftText)}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Draft saved successfully.");
      const updatedFirs = firs.map(f => f.id === selectedFIR.id ? { ...f, fullDraft: draftText, summary: draftText.substring(0, 160) + "..." } : f);
      setFirs(updatedFirs);
      setSelectedFIR({ ...selectedFIR, fullDraft: draftText, summary: draftText.substring(0, 160) + "..." });
      setIsEditing(false);
    } catch {
      toast.error("Failed to save draft.");
    }
  };

  const totalFIRs = firs.length;
  const pendingCount = firs.filter(f => f.status === "pending").length;
  const dispatchedCount = firs.filter(f => f.status === "dispatched").length;
  const resolvedCount = firs.filter(f => f.status === "resolved").length;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1">
            Officer <span className="text-gradient-saffron">Dashboard</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Review AI-generated FIR drafts, approve or edit, and dispatch to the relevant precinct.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total FIRs", value: totalFIRs, icon: FileText, color: "text-primary" },
            { label: "Pending", value: pendingCount, icon: Clock, color: "text-amber-400" },
            { label: "Dispatched", value: dispatchedCount, icon: CheckCircle, color: "text-emerald-400" },
            { label: "Resolved", value: resolvedCount, icon: Shield, color: "text-blue-400" },
          ].map((stat) => (
            <Card key={stat.label} className="p-4 bg-card border-border">
              <div className="flex items-center gap-3">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading complaints...</span>
          </div>
        ) : firs.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold text-foreground">No Complaints Yet</p>
            <p className="text-sm text-muted-foreground mt-1">Citizen complaints will appear here once they are submitted.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-6">
            {/* FIR List */}
            <div className="lg:col-span-2 space-y-2 max-h-[620px] overflow-y-auto pr-1">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent FIR Drafts</h2>
              {firs.map((fir) => (
                <Card
                  key={fir.id}
                  onClick={() => { setSelectedFIR(fir); setIsEditing(false); }}
                  className={`p-4 bg-card border-border cursor-pointer transition-all duration-150 hover:border-primary/40 ${selectedFIR?.id === fir.id ? "border-primary/60 ring-1 ring-primary/20 bg-primary/5" : ""}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-semibold text-card-foreground truncate pr-2">
                      {fir.id.substring(0, 8).toUpperCase()}
                    </p>
                    <Badge variant="outline" className={`text-xs shrink-0 ${statusStyles[fir.status] || statusStyles.pending}`}>
                      {statusLabels[fir.status] || "Pending"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{fir.citizen} · {fir.date}</p>
                  <p className="text-xs text-primary font-medium">{fir.section}</p>
                </Card>
              ))}
            </div>

            {/* FIR Detail */}
            {selectedFIR && (
              <div className="lg:col-span-3">
                <Card className="p-6 bg-card border-border">
                  {/* FIR Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h2 className="text-lg font-bold text-card-foreground">
                        {selectedFIR.id.toUpperCase()}
                      </h2>
                      <p className="text-sm text-muted-foreground">Filed by {selectedFIR.citizen}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs ${statusStyles[selectedFIR.status] || statusStyles.pending}`}>
                      {statusLabels[selectedFIR.status] || "Pending"}
                    </Badge>
                  </div>

                  {/* Meta Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground mb-1">BNS Section</p>
                      <p className="text-sm font-medium text-foreground">{selectedFIR.section}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground mb-1">AI Confidence</p>
                      <p className="text-sm font-semibold text-primary">{selectedFIR.confidence}%</p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground mb-1">Location / Title</p>
                      <p className="text-sm font-medium text-foreground truncate">{selectedFIR.location}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground mb-1">Date Reported</p>
                      <p className="text-sm font-medium text-foreground">{selectedFIR.date}</p>
                    </div>
                  </div>

                  {/* Draft / Description */}
                  <div className="mb-5">
                    <p className="text-xs text-muted-foreground mb-2">Detailed FIR Draft / Summary</p>
                    {isEditing ? (
                      <Textarea
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        className="min-h-[180px] text-sm bg-secondary/30 font-mono"
                      />
                    ) : (
                      <div className="bg-secondary/30 rounded-lg p-4 max-h-[240px] overflow-y-auto">
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                          {selectedFIR.fullDraft || selectedFIR.summary || "No description available."}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      className="gradient-saffron text-primary-foreground font-semibold"
                      disabled={isDispatching || selectedFIR.status === "dispatched"}
                      onClick={handleDispatch}
                    >
                      {isDispatching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {selectedFIR.status === "dispatched" ? "Already Dispatched" : "Approve & Dispatch"}
                    </Button>

                    {isEditing ? (
                      <>
                        <Button variant="outline" className="border-primary text-primary" onClick={handleSaveDraft}>
                          Save Draft
                        </Button>
                        <Button variant="ghost" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" onClick={() => {
                        setDraftText(selectedFIR.fullDraft || selectedFIR.summary);
                        setIsEditing(true);
                      }}>
                        Edit Draft
                      </Button>
                    )}

                    <Button variant="outline" asChild>
                      <a href="/evidence">
                        <Shield className="mr-2 h-4 w-4" />
                        Certify Evidence
                      </a>
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficerDashboard;
