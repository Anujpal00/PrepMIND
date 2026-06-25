import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

const EXAMS = ["SSC CGL", "SSC CHSL", "UPSC", "DSSSB", "Banking", "Railway", "State PCS"];
const SUBJECTS = ["General Awareness", "History", "Geography", "Polity", "Economics", "Science", "Current Affairs", "Quantitative Aptitude", "English", "General Intelligence"];

export default function QuestionGen() {
  const [materials, setMaterials] = useState([]);
  const [form, setForm] = useState({
    material_id: "",
    exam: "SSC CGL",
    subject: "General Awareness",
    topic: "",
    question_type: "mcq",
    difficulty: "medium",
    count: 10,
    language: "en",
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [revealed, setRevealed] = useState({});

  useEffect(() => {
    api.get("/materials").then(({ data }) => setMaterials(data.filter(m => m.status === "ready")));
  }, []);

  const generate = async () => {
    setBusy(true);
    setResult(null);
    setRevealed({});
    try {
      const payload = { ...form };
      if (!payload.material_id) delete payload.material_id;
      const { data } = await api.post("/questions/generate", payload);
      setResult(data);
      toast.success(`Generated ${data.count} questions!`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Generation failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6" data-testid="questions-page">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] font-bold text-orange-600">AI Question Generator</div>
        <h1 className="text-3xl md:text-4xl font-bold font-heading mt-1">Generate exam-pattern questions</h1>
        <p className="text-muted-foreground mt-1 text-sm">From your uploaded material or directly from exam patterns.</p>
      </div>

      <Card className="p-6 grid md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label>Source material (optional)</Label>
          <Select value={form.material_id || "none"} onValueChange={(v) => setForm({ ...form, material_id: v === "none" ? "" : v })}>
            <SelectTrigger data-testid="qgen-material-select"><SelectValue placeholder="Generic exam questions" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (generic exam pattern)</SelectItem>
              {materials.map(m => <SelectItem key={m.id} value={m.id}>{m.filename}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Exam</Label>
          <Select value={form.exam} onValueChange={(v) => setForm({ ...form, exam: v })}>
            <SelectTrigger data-testid="qgen-exam-select"><SelectValue /></SelectTrigger>
            <SelectContent>{EXAMS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Subject</Label>
          <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
            <SelectTrigger data-testid="qgen-subject-select"><SelectValue /></SelectTrigger>
            <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Question type</Label>
          <Select value={form.question_type} onValueChange={(v) => setForm({ ...form, question_type: v })}>
            <SelectTrigger data-testid="qgen-type-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mcq">MCQ (4 options)</SelectItem>
              <SelectItem value="true_false">True / False</SelectItem>
              <SelectItem value="assertion_reason">Assertion-Reason</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Difficulty</Label>
          <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
            <SelectTrigger data-testid="qgen-diff-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Language</Label>
          <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
            <SelectTrigger data-testid="qgen-lang-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिन्दी</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 space-y-2">
          <div className="flex justify-between"><Label>Number of questions</Label><span className="text-sm font-semibold">{form.count}</span></div>
          <Slider value={[form.count]} onValueChange={([v]) => setForm({ ...form, count: v })} min={5} max={30} step={1} data-testid="qgen-count-slider" />
        </div>
        <div className="md:col-span-2">
          <Button onClick={generate} disabled={busy} className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white" data-testid="qgen-generate-btn">
            {busy ? <><Loader2 className="size-4 mr-2 animate-spin" /> Generating with AI…</> : <><Sparkles className="size-4 mr-2" /> Generate questions</>}
          </Button>
        </div>
      </Card>

      {result && (
        <div className="space-y-4" data-testid="qgen-results">
          <h2 className="text-2xl font-bold font-heading">{result.count} questions generated</h2>
          {result.questions.map((q, i) => (
            <Card key={q.id} className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-semibold leading-relaxed">{i + 1}. {q.question}</h3>
              </div>
              <div className="space-y-2">
                {q.options.map((opt, idx) => {
                  const show = revealed[q.id];
                  const isCorrect = idx === q.correct_index;
                  return (
                    <div key={idx} className={`px-4 py-2.5 rounded-md border text-sm flex items-center justify-between ${show && isCorrect ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-border"}`}>
                      <span>{String.fromCharCode(65 + idx)}. {opt}</span>
                      {show && isCorrect && <CheckCircle2 className="size-4 text-emerald-600" />}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Button size="sm" variant="ghost" onClick={() => setRevealed(r => ({ ...r, [q.id]: !r[q.id] }))} data-testid={`qgen-reveal-${i}`}>
                  {revealed[q.id] ? "Hide" : "Show"} answer
                </Button>
                {revealed[q.id] && q.explanation && (
                  <p className="text-xs text-muted-foreground italic max-w-md text-right">{q.explanation}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
