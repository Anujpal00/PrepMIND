import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Brain } from "lucide-react";
import { toast } from "sonner";

const EXAMS = ["SSC CGL", "SSC CHSL", "UPSC", "Banking", "Railway", "DSSSB", "CPO", "State PCS"];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", target_exam: "SSC CGL" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register(form.name, form.email, form.password, form.target_exam);
      toast.success("Account created!");
      navigate("/app");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Registration failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative bg-slate-900 text-white p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <img src="https://images.pexels.com/photos/16504588/pexels-photo-16504588.jpeg" alt="" className="w-full h-full object-cover" />
        </div>
        <Link to="/" className="relative flex items-center gap-2 z-10">
          <div className="size-9 rounded-md bg-orange-600 flex items-center justify-center">
            <Brain className="size-5 text-white" />
          </div>
          <span className="font-heading font-bold text-xl">PrepMind AI</span>
        </Link>
        <div className="relative z-10">
          <h2 className="text-3xl font-heading font-bold">Start your prep.</h2>
          <p className="mt-3 text-slate-300">Upload one PDF and unlock AI tutoring, mock tests, and analytics for free.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-12">
        <form onSubmit={submit} className="w-full max-w-md space-y-5" data-testid="register-form">
          <div>
            <h1 className="text-3xl font-bold font-heading">Create account</h1>
            <p className="text-muted-foreground mt-1 text-sm">Have one? <Link to="/auth/login" className="text-orange-600 font-semibold hover:underline" data-testid="register-to-login-link">Sign in</Link></p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="register-name-input" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="register-email-input" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password (min 6 chars)</Label>
            <Input id="password" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="register-password-input" />
          </div>
          <div className="space-y-2">
            <Label>Target exam</Label>
            <Select value={form.target_exam} onValueChange={(v) => setForm({ ...form, target_exam: v })}>
              <SelectTrigger data-testid="register-exam-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXAMS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={busy} className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white" data-testid="register-submit-btn">
            {busy ? "Creating…" : "Create account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
