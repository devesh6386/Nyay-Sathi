import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Clock, CheckCircle, AlertCircle, Loader2, FileText } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending Review", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
  dispatched: { label: "Dispatched", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle },
  resolved: { label: "Resolved", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: CheckCircle },
};

const steps = [
  { key: "pending", label: "Filed", desc: "Complaint received and queued for review" },
  { key: "dispatched", label: "Dispatched", desc: "Sent to the regional precinct for investigation" },
  { key: "resolved", label: "Resolved", desc: "Case closed or resolved by the officer" },
];

export default function TrackComplaint() {
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState<any[] | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("nyaysathi_token");
    if (!token) {
      toast.error("You must be logged in to track your complaints.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/complaints", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch complaints");
      const data = await res.json();
      setComplaints(data);
      if (data.length === 0) {
        toast.info("No complaints found for your account.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch complaints.");
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status: string) => steps.findIndex(s => s.key === status);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-background">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <Search className="h-3.5 w-3.5" />
            Live Tracking
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Track Your <span className="text-gradient-saffron">Complaint</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            View the real-time status of all complaints filed from your account.
          </p>
        </div>

        {/* Fetch Button */}
        <form onSubmit={handleTrack} className="mb-10">
          <div className="flex gap-3 justify-center">
            <Button
              type="submit"
              className="gradient-saffron text-primary-foreground font-semibold px-8 h-11"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              {loading ? "Loading..." : "Load My Complaints"}
            </Button>
          </div>
        </form>

        {/* Results */}
        {complaints !== null && (
          <div className="space-y-6">
            {complaints.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold text-foreground">No Complaints Found</p>
                <p className="text-sm text-muted-foreground mt-1">You haven't filed any complaints yet. Go to File Complaint to get started.</p>
              </div>
            ) : (
              complaints.map((item: any) => {
                const config = statusConfig[item.status] || statusConfig.pending;
                const Icon = config.icon;
                const stepIndex = getStepIndex(item.status);

                return (
                  <Card key={item.id} className="p-6 bg-card border-border">
                    {/* Top Row */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Complaint ID</p>
                        <p className="font-mono text-sm font-semibold text-foreground">{item.id.toUpperCase()}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs ${config.color}`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>

                    {/* Meta */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="bg-secondary/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Filed On</p>
                        <p className="text-sm font-medium text-foreground">
                          {new Date(item.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="bg-secondary/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Title / Suspect</p>
                        <p className="text-sm font-medium text-foreground truncate">{item.title || "Not specified"}</p>
                      </div>
                    </div>

                    {/* Progress Tracker */}
                    <div className="mb-5">
                      <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Progress</p>
                      <div className="relative flex items-start gap-0">
                        {steps.map((step, idx) => {
                          const isCompleted = idx <= stepIndex;
                          const isActive = idx === stepIndex;
                          return (
                            <div key={step.key} className="flex-1 flex flex-col items-center relative">
                              {/* Connector line */}
                              {idx < steps.length - 1 && (
                                <div className={`absolute top-3 left-1/2 w-full h-0.5 ${isCompleted && idx < stepIndex ? "bg-primary" : "bg-border"}`} />
                              )}
                              {/* Dot */}
                              <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
                                isActive ? "border-primary bg-primary scale-110" :
                                isCompleted ? "border-primary bg-primary/20" :
                                "border-border bg-background"
                              }`}>
                                {isCompleted ? (
                                  <div className={`h-2 w-2 rounded-full ${isActive ? "bg-white" : "bg-primary"}`} />
                                ) : null}
                              </div>
                              <p className={`text-xs font-semibold mt-2 text-center ${isCompleted ? "text-primary" : "text-muted-foreground"}`}>
                                {step.label}
                              </p>
                              <p className="text-[10px] text-muted-foreground text-center mt-0.5 leading-tight px-1 hidden sm:block">
                                {step.desc}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Description */}
                    {item.description && (
                      <div className="bg-secondary/30 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">FIR Contents (Summary)</p>
                        <p className="text-sm text-foreground leading-relaxed line-clamp-3">{item.description}</p>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
