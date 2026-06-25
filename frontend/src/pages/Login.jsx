import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/app");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative bg-slate-900 text-white p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <img src="https://images.pexels.com/photos/18925028/pexels-photo-18925028.jpeg" alt="" className="w-full h-full object-cover" />
        </div>
        <Link to="/" className="relative flex items-center gap-2 z-10">
          <div className="size-9 rounded-md bg-orange-600 flex items-center justify-center">
            <Brain className="size-5 text-white" />
          </div>
          <span className="font-heading font-bold text-xl">PrepMind AI</span>
        </Link>
        <div className="relative z-10">
          <h2 className="text-3xl font-heading font-bold">Welcome back.</h2>
          <p className="mt-3 text-slate-300">Pick up where you left off — your weak topics, mocks, and study streak are waiting.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-12">
        <form onSubmit={submit} className="w-full max-w-md space-y-5" data-testid="login-form">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="size-9 rounded-md bg-slate-900 flex items-center justify-center">
              <Brain className="size-5 text-orange-500" />
            </div>
            <span className="font-heading font-bold text-xl">PrepMind AI</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading">Sign in</h1>
            <p className="text-muted-foreground mt-1 text-sm">New here? <Link to="/auth/register" className="text-orange-600 font-semibold hover:underline" data-testid="login-to-register-link">Create account</Link></p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="aspirant@example.com" data-testid="login-email-input" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" data-testid="login-password-input" />
          </div>
          <Button type="submit" disabled={busy} className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white" data-testid="login-submit-btn">
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
