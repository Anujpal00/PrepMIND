import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Timer, Flag, ChevronLeft, ChevronRight, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function TestEngine() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [visited, setVisited] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => {
    api.get(`/tests/${testId}`).then(({ data }) => {
      setTest(data);
      setSecondsLeft(data.duration_minutes * 60);
      setVisited({ [data.questions[0].id]: true });
    }).catch(() => {
      toast.error("Test not found");
      navigate("/app/tests");
    });
  }, [testId]);

  useEffect(() => {
    if (!test) return;
    const t = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(t); submit(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [test]);

  if (!test) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="size-8 animate-spin text-orange-600" /></div>;

  const q = test.questions[idx];
  const totalQ = test.questions.length;
  const answeredCount = Object.keys(answers).filter(k => answers[k] !== null && answers[k] !== undefined).length;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const select = (oi) => setAnswers(a => ({ ...a, [q.id]: oi }));
  const goto = (i) => {
    setIdx(i);
    setVisited(v => ({ ...v, [test.questions[i].id]: true }));
  };
  const toggleMark = () => setMarked(m => ({ ...m, [q.id]: !m[q.id] }));

  const submit = async (auto = false) => {
    if (!auto && !confirmSubmit) { setConfirmSubmit(true); return; }
    setSubmitting(true);
    try {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      const { data } = await api.post("/tests/submit", { test_id: testId, answers, time_taken_seconds: elapsed });
      navigate(`/app/result/${data.id}`, { replace: true });
    } catch (err) {
      toast.error("Submit failed");
      setSubmitting(false);
    }
  };

  const paletteStatus = (qid) => {
    if (answers[qid] !== undefined && answers[qid] !== null) return marked[qid] ? "answered-marked" : "answered";
    if (visited[qid]) return marked[qid] ? "marked" : "unanswered";
    return "not-visited";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="test-engine">
      {/* Top bar */}
      <header className="border-b border-border bg-card sticky top-0 z-30">
        <div className="px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="font-semibold truncate text-sm md:text-base">{test.title}</h1>
            <div className="text-xs text-muted-foreground">{answeredCount}/{totalQ} answered · Negative: -{test.negative_marks}</div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-md font-mono text-lg font-bold ${secondsLeft < 300 ? "bg-red-600 text-white animate-pulse" : "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"}`} data-testid="test-timer">
            <Timer className="size-4" /> {mm}:{ss}
          </div>
        </div>
      </header>

      <div className="flex-1 grid lg:grid-cols-[1fr_320px]">
        {/* Question */}
        <main className="p-4 md:p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline" className="text-xs">{q.section} · Q{idx + 1} of {totalQ}</Badge>
              <Button size="sm" variant={marked[q.id] ? "default" : "outline"} onClick={toggleMark} className={marked[q.id] ? "bg-orange-600 hover:bg-orange-700" : ""} data-testid="test-mark-btn">
                <Flag className="size-3.5 mr-1" /> {marked[q.id] ? "Marked" : "Mark for review"}
              </Button>
            </div>
            <Card className="p-6 md:p-8 mb-4">
              <h2 className="font-semibold text-lg leading-relaxed mb-6">{q.question}</h2>
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <button
                    key={oi}
                    onClick={() => select(oi)}
                    className={`w-full text-left px-4 py-3.5 rounded-md border-2 transition-all ${answers[q.id] === oi ? "border-orange-600 bg-orange-50 dark:bg-orange-900/20" : "border-border hover:border-slate-400"}`}
                    data-testid={`test-option-${oi}`}
                  >
                    <span className="font-semibold mr-3">{String.fromCharCode(65 + oi)}.</span> {opt}
                  </button>
                ))}
              </div>
            </Card>
            <div className="flex flex-wrap gap-2 justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => goto(Math.max(0, idx - 1))} disabled={idx === 0} data-testid="test-prev-btn">
                  <ChevronLeft className="size-4 mr-1" /> Previous
                </Button>
                <Button variant="ghost" onClick={() => setAnswers(a => { const c = { ...a }; delete c[q.id]; return c; })} data-testid="test-clear-btn">Clear</Button>
              </div>
              {idx < totalQ - 1 ? (
                <Button onClick={() => goto(idx + 1)} className="bg-slate-900 hover:bg-slate-800 text-white" data-testid="test-next-btn">
                  Next <ChevronRight className="size-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={() => submit(false)} className="bg-orange-600 hover:bg-orange-700 text-white" data-testid="test-submit-btn">
                  Submit test
                </Button>
              )}
            </div>
          </div>
        </main>

        {/* Palette */}
        <aside className="border-l border-border bg-card p-4 lg:max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground mb-3">Question palette</div>
          <div className="grid grid-cols-6 lg:grid-cols-5 gap-2">
            {test.questions.map((qq, i) => {
              const st = paletteStatus(qq.id);
              const cls = {
                "answered": "bg-emerald-500 text-white border-emerald-500",
                "answered-marked": "bg-purple-500 text-white border-purple-500",
                "marked": "bg-orange-500 text-white border-orange-500",
                "unanswered": "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700",
                "not-visited": "bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800",
              }[st];
              return (
                <button
                  key={qq.id}
                  onClick={() => goto(i)}
                  className={`size-9 rounded-md border-2 text-xs font-semibold transition-all ${cls} ${i === idx ? "ring-2 ring-offset-2 ring-orange-500 dark:ring-offset-slate-900" : ""}`}
                  data-testid={`palette-${i}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-5 space-y-1.5 text-xs">
            <Legend color="bg-emerald-500" label="Answered" />
            <Legend color="bg-orange-500" label="Marked for review" />
            <Legend color="bg-purple-500" label="Answered + marked" />
            <Legend color="bg-white border border-slate-300" label="Visited, not answered" />
            <Legend color="bg-slate-100 border border-slate-200" label="Not visited" />
          </div>
          <Button onClick={() => submit(false)} className="w-full mt-5 bg-orange-600 hover:bg-orange-700 text-white" data-testid="palette-submit-btn">
            Submit test
          </Button>
        </aside>
      </div>

      <Dialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="size-5 text-orange-600" /> Submit test?</DialogTitle>
            <DialogDescription>
              You've answered <strong>{answeredCount}/{totalQ}</strong> questions.
              {answeredCount < totalQ && ` ${totalQ - answeredCount} unanswered will be marked skipped.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSubmit(false)} data-testid="submit-cancel-btn">Continue test</Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => { setConfirmSubmit(false); submit(true); }} disabled={submitting} data-testid="submit-confirm-btn">
              {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <CheckCircle2 className="size-4 mr-2" />}
              Submit now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`size-4 rounded ${color}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
