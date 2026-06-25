import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CalendarRange, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "@/lib/markdown";

export default function PlannerPage() {
  const [plans, setPlans] = useState([]);
  const [active, setActive] = useState(null);
  const [form, setForm] = useState({ plan_type: "weekly", exam_date: "", weak_topics: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get("/ai/plans").then(({ data }) => setPlans(data)); }, []);

  const generate = async () => {
    setBusy(true);
    try {
      const payload = {
        plan_type: form.plan_type,
        exam_date: form.exam_date || null,
        weak_topics: form.weak_topics.split(",").map(s => s.trim()).filter(Boolean),
      };
      const { data } = await api.post("/ai/planner", payload);
      setPlans(p => [data, ...p]);
      setActive(data);
      toast.success("Plan generated!");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6" data-testid="planner-page">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] font-bold text-orange-600">AI Revision Planner</div>
        <h1 className="text-3xl md:text-4xl font-bold font-heading mt-1">Your personalised study plan</h1>
        <p className="text-muted-foreground mt-1 text-sm">Built from your test history and weak topics.</p>
      </div>

      <Card className="p-6 grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Plan type</Label>
          <Select value={form.plan_type} onValueChange={v => setForm({ ...form, plan_type: v })}>
            <SelectTrigger data-testid="planner-type-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Exam date</Label>
          <Input type="date" value={form.exam_date} onChange={e => setForm({ ...form, exam_date: e.target.value })} data-testid="planner-date-input" />
        </div>
        <div className="space-y-2">
          <Label>Weak topics (comma-separated)</Label>
          <Input value={form.weak_topics} onChange={e => setForm({ ...form, weak_topics: e.target.value })} placeholder="e.g. Polity, Profit & Loss" data-testid="planner-weak-input" />
        </div>
        <div className="md:col-span-3">
          <Button onClick={generate} disabled={busy} className="w-full bg-orange-600 hover:bg-orange-700 text-white h-11" data-testid="planner-generate-btn">
            {busy ? <><Loader2 className="size-4 mr-2 animate-spin" /> Building plan…</> : <><Sparkles className="size-4 mr-2" /> Generate plan</>}
          </Button>
        </div>
      </Card>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground mb-3">History</div>
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No plans yet.</p>
          ) : (
            <div className="space-y-1.5">
              {plans.map(p => (
                <button key={p.id} onClick={() => setActive(p)} className={`w-full text-left p-3 rounded-md border text-sm ${active?.id === p.id ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20" : "border-border hover:bg-slate-50 dark:hover:bg-slate-800"}`} data-testid={`plan-item-${p.id}`}>
                  <div className="font-semibold capitalize">{p.plan_type} plan</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{new Date(p.created_at).toLocaleDateString()}</div>
                </button>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-6 lg:p-8 min-h-[300px]">
          {active ? (
            <div className="prose-notes max-w-none">
              <ReactMarkdown>{active.content}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <CalendarRange className="size-12 mx-auto opacity-30 mb-3" />
              <p className="text-sm">Generate a plan above.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
