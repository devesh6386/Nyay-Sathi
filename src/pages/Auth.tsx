import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import {
  Scale, User, ShieldCheck, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2,
  XCircle,
} from "lucide-react";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";

type Role = "citizen" | "officer";

const roles: { value: Role; label: string; desc: string; icon: any }[] = [
  { value: "citizen", label: "Citizen", desc: "File & track FIRs", icon: User },
  { value: "officer", label: "Officer", desc: "Review & dispatch", icon: ShieldCheck },
];

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("citizen");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Forgot Password Flow
  const [forgotMode, setForgotMode] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: OTP, 3: New Pass
  const [resetEmail, setResetEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Google authentication failed");
      }
      const data = await res.json();
      localStorage.setItem("nyaysathi_token", data.access_token);
      localStorage.setItem("nyaysathi_role", data.role);
      setSuccess(true);
      toast.success("Welcome with Google!");
      setTimeout(() => navigate(data.role === "officer" ? "/dashboard" : "/citizen"), 700);
    } catch (err: any) {
      toast.error(err.message || "An error occurred during Google sign in.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        isLogin ? "http://localhost:8000/login" : "http://localhost:8000/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isLogin
              ? { email, password, role }
              : { email, password, full_name: fullName, role }
          ),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Authentication failed");
      }
      const data = await res.json();
      localStorage.setItem("nyaysathi_token", data.access_token);
      localStorage.setItem("nyaysathi_role", data.role);
      setSuccess(true);
      toast.success(isLogin ? "Welcome back!" : "Account created!");
      setTimeout(() => navigate(data.role === "officer" ? "/dashboard" : "/citizen"), 700);
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setEmail(""); setPassword(""); setFullName("");
    setSuccess(false); setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      const res = await fetch("http://localhost:8000/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to send OTP");
      
      toast.success("OTP sent! Check your email.");
      setResetStep(2);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      const res = await fetch("http://localhost:8000/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, otp_code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Invalid OTP");
      
      setResetStep(3);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      toast.error("Passwords do not match");
      return;
    }
    setResetLoading(true);
    try {
      const res = await fetch("http://localhost:8000/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, otp_code: otpCode, new_password: newPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Reset failed");
      
      toast.success("Password reset successfully! Please sign in.");
      setForgotMode(false);
      setResetStep(1);
      setIsLogin(true);
      setEmail(resetEmail);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1a14 60%, #0f172a 100%)" }}>
        {/* Background glows */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(circle, #f97316, transparent)" }} />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(249,115,22,0.07) 0%, transparent 70%)" }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, #f97316, #f59e0b)" }}>
            <Scale className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">
            Nyaya<span className="text-orange-400">-Sathi</span>
          </span>
        </div>

        {/* Center hero */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-orange-400">
              Digital Justice System
            </span>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Your Rights.<br />
              Digitized &<br />
              Protected.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              File FIRs, track complaints, and access legal help — all in one AI-powered secure platform.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4">
            {[
              { icon: "⚖️", title: "AI-powered FIR Drafting", desc: "Auto-generate formal FIRs from your complaint in seconds" },
              { icon: "🔒", title: "Tamper-proof Evidence", desc: "SHA-256 hashing ensures every file is court-admissible" },
              { icon: "📍", title: "Real-time Tracking", desc: "Follow your complaint from filing through dispatch" },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-base shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-slate-600 text-xs">© 2025 Nyaya-Sathi. All rights reserved.</p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex items-center justify-center bg-background px-6 pt-20 pb-8 lg:pt-8 relative overflow-hidden">
        {/* Subtle bg glow */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #f97316, transparent)" }} />

        <div
          className="w-full max-w-md transition-all duration-700 ease-out"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(24px)" }}
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Scale className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">
              Nyaya<span className="text-orange-400">-Sathi</span>
            </span>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1
              className="text-3xl font-bold text-foreground"
              key={String(isLogin)}
              style={{ animation: "fadeSlideIn 0.3s ease-out" }}
            >
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isLogin ? "Sign in to access your Nyay-Sathi account" : "Join India's AI-powered justice platform"}
            </p>
          </div>

          {/* Role selector */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Select your role
            </p>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`relative flex flex-col items-center gap-2 py-5 px-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 overflow-hidden group ${
                    role === r.value
                      ? "border-primary text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 bg-primary ${role === r.value ? "opacity-10" : "opacity-0"}`} />
                  <r.icon className={`relative h-7 w-7 transition-all duration-200 ${role === r.value ? "text-primary scale-110" : "text-muted-foreground group-hover:scale-105"}`} />
                  <span className="relative">{r.label}</span>
                  <span className="relative text-[10px] font-normal text-muted-foreground">{r.desc}</span>
                  {role === r.value && (
                    <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-primary flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name - signup only - animated */}
            <div
              className="overflow-hidden transition-all duration-300"
              style={{ maxHeight: isLogin ? "0px" : "80px", opacity: isLogin ? 0 : 1 }}
            >
              <div className="space-y-1.5 pb-1">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="e.g. Rajesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  className="h-11 bg-secondary/30 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">{role === "officer" ? "Enter Official Email ID" : "Email"}</Label>
              <div className={`relative rounded-md transition-all duration-200 ${emailFocused ? "ring-1 ring-primary/50" : ""}`}>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  required
                  className="h-11 bg-secondary/30 border-border focus-visible:ring-primary/60"
                />
                {email.includes("@") && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                )}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className={`relative rounded-md transition-all duration-200 ${passFocused ? "ring-1 ring-primary/50" : ""}`}>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                  required
                  minLength={4}
                  className="h-11 bg-secondary/30 border-border focus-visible:ring-primary/60 pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Forgot Password Link */}
              {isLogin && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => { setForgotMode(true); setResetStep(1); }}
                    className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {/* Password strength */}
              {!isLogin && password.length > 0 && (
                <div className="flex gap-1 pt-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        password.length >= i * 2
                          ? i <= 1 ? "bg-red-500" : i <= 2 ? "bg-amber-500" : i <= 3 ? "bg-yellow-400" : "bg-emerald-500"
                          : "bg-border"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || success}
              className={`w-full h-12 font-semibold text-base mt-1 group transition-all duration-300 ${
                success
                  ? "bg-emerald-500 hover:bg-emerald-500 text-white"
                  : "gradient-saffron text-primary-foreground hover:opacity-90"
              }`}
              style={!success && !loading ? { boxShadow: "0 0 20px rgba(249,115,22,0.2)" } : {}}
            >
              {success ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {isLogin ? "Signed In!" : "Account Created!"}
                </span>
              ) : loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </span>
              )}
            </Button>
          </form>

          {/* Google Auth Divider */}
          <div className="relative mt-8 mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-semibold">Or continue with</span>
            </div>
          </div>

          <div className="flex justify-center w-full">
            <GoogleLogin
               onSuccess={handleGoogleSuccess}
               onError={() => toast.error("Google Login Failed")}
               theme="filled_black"
               shape="pill"
               width="100%"
               size="large"
            />
          </div>

          {/* Toggle */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={switchMode}
              className="text-primary font-semibold hover:underline"
            >
              {isLogin ? "Sign Up Free" : "Sign In"}
            </button>
          </p>
        </div>

        {/* ── FORGOT PASSWORD OVERLAY ── */}
        {forgotMode && (
          <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <Card className="w-full max-w-sm p-8 shadow-2xl border-primary/20 bg-card/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 gradient-saffron opacity-50" />
              
              <button
                onClick={() => setForgotMode(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                title="Close"
              >
                <XCircle className="h-5 w-5" />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  {resetStep === 1 ? "Reset Password" : resetStep === 2 ? "Verify OTP" : "New Password"}
                </h2>
                <p className="text-muted-foreground text-xs mt-1">
                  {resetStep === 1 
                    ? "Enter your email to receive a recovery code." 
                    : resetStep === 2 
                    ? `Enter the 6-digit code sent to ${resetEmail}`
                    : "Create a strong new password for your account."
                  }
                </p>
              </div>

              {resetStep === 1 && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Recovery Email</Label>
                    <Input 
                      type="email" 
                      placeholder="you@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="h-11 bg-secondary/30"
                    />
                  </div>
                  <Button type="submit" disabled={resetLoading} className="w-full h-11 gradient-saffron text-primary-foreground font-semibold">
                    {resetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
                  </Button>
                </form>
              )}

              {resetStep === 2 && (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Verification Code</Label>
                    <Input 
                      type="text" 
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      required
                      className="h-12 text-center text-2xl font-bold tracking-[0.5em] bg-secondary/30"
                    />
                  </div>
                  <Button type="submit" disabled={resetLoading} className="w-full h-11 bg-primary text-primary-foreground font-semibold">
                    {resetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Continue"}
                  </Button>
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    className="w-full text-xs text-muted-foreground hover:text-primary transition-colors text-center"
                  >
                    Didn't receive code? Resend
                  </button>
                </form>
              )}

              {resetStep === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        required
                        minLength={4}
                        className="h-11 bg-secondary/30 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm Password</Label>
                    <Input 
                      type="password"
                      placeholder="••••••••"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      required
                      className="h-11 bg-secondary/30"
                    />
                  </div>
                  <Button type="submit" disabled={resetLoading} className="w-full h-11 gradient-saffron text-primary-foreground font-semibold shadow-lg shadow-orange-500/20">
                    {resetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
                  </Button>
                </form>
              )}

              <button
                type="button"
                onClick={() => setForgotMode(false)}
                className="w-full mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
              >
                Back to Sign In
              </button>
            </Card>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
