import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Trophy, CheckCircle2, XCircle, Minus, Timer, ArrowLeft, Loader2 } from "lucide-react";

export default function TestResult() {
  const { resultId } = useParams();
  const [r, setR] = useState(null);
  useEffect(() => { api.get(`/tests/result/${resultId}`).then(({ data }) => setR(data)); }, [resultId]);
  if (!r) return <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-orange-600" /></div>;

  const subjectData = Object.entries(r.by_subject || {}).map(([k, v]) => ({
    subject: k.length > 14 ? k.slice(0, 14) + "…" : k,
    accuracy: v.total ? Math.round(v.correct / v.total * 100) : 0,
    correct: v.correct, incorrect: v.incorrect, skipped: v.skipped,
  }));

  const detailsByQid = {};
  (r.answer_details || []).forEach(d => { detailsByQid[d.question_id] = d; });

  return (
    <div className="space-y-6" data-testid="result-page">
      <Link to="/app/tests"><Button variant="ghost" size="sm" data-testid="result-back-btn"><ArrowLeft className="size-4 mr-1" /> Back to tests</Button></Link>

      <Card className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-100 dark:to-slate-300 text-white dark:text-slate-900">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="size-6 text-orange-400" />
          <h1 className="text-2xl md:text-3xl font-bold font-heading">{r.test_title}</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <Stat label="Score" value={`${r.percent_score}%`} sub={`${r.score} / ${r.max_marks}`} />
          <Stat label="Accuracy" value={`${r.accuracy}%`} sub={`${r.correct}/${r.total_questions}`} />
          <Stat label="Correct" value={r.correct} icon={CheckCircle2} color="text-emerald-400" />
          <Stat label="Incorrect" value={r.incorrect} icon={XCircle} color="text-red-400" />
          <Stat label="Time" value={`${Math.floor((r.time_taken_seconds || 0) / 60)}m`} icon={Timer} />
        </div>
      </Card>

      <Tabs defaultValue="breakdown">
        <TabsList>
          <TabsTrigger value="breakdown" data-testid="result-tab-breakdown">Section breakdown</TabsTrigger>
          <TabsTrigger value="review" data-testid="result-tab-review">Question review</TabsTrigger>
        </TabsList>
        <TabsContent value="breakdown">
          <Card className="p-6">
            <h3 className="font-heading font-semibold mb-4">Accuracy by subject</h3>
            {subjectData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subject data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subjectData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="accuracy" fill="#EA580C" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className="grid md:grid-cols-2 gap-3 mt-6">
              {Object.entries(r.by_subject || {}).map(([k, v]) => (
                <Card key={k} className="p-4 border">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{k}</div>
                      <div className="text-xs text-muted-foreground mt-1">{v.total} questions</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">{v.total ? Math.round(v.correct / v.total * 100) : 0}%</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 text-xs">
                    <Badge className="bg-emerald-600 text-white">✓ {v.correct}</Badge>
                    <Badge variant="destructive">✗ {v.incorrect}</Badge>
                    <Badge variant="secondary">— {v.skipped}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="review">
          <div className="space-y-3">
            {(r.questions || []).map((q, i) => {
              const d = detailsByQid[q.id];
              const result = d?.result || "skipped";
              const Icon = result === "correct" ? CheckCircle2 : result === "incorrect" ? XCircle : Minus;
              const color = result === "correct" ? "text-emerald-600" : result === "incorrect" ? "text-red-600" : "text-slate-500";
              return (
                <Card key={q.id} className="p-5" data-testid={`review-q-${i}`}>
                  <div className="flex items-start gap-3">
                    <Icon className={`size-5 mt-0.5 ${color} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold leading-relaxed">{i + 1}. {q.question}</p>
                      <div className="mt-3 space-y-1.5 text-sm">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className={`px-3 py-2 rounded border ${oi === q.correct_index ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : oi === d?.selected ? "border-red-500 bg-red-50 dark:bg-red-900/20" : "border-border"}`}>
                            <span className="font-semibold mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
                            {oi === q.correct_index && <span className="ml-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">✓ Correct</span>}
                            {oi === d?.selected && oi !== q.correct_index && <span className="ml-2 text-xs text-red-700 font-semibold">Your answer</span>}
                          </div>
                        ))}
                      </div>
                      {q.explanation && <p className="text-xs italic text-muted-foreground mt-3 p-3 bg-slate-50 dark:bg-slate-900 rounded">{q.explanation}</p>}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value, sub, icon: Icon, color }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] opacity-70 font-bold">{label}</div>
      <div className={`text-3xl font-bold font-heading mt-1 flex items-center gap-2 ${color || ""}`}>
        {Icon && <Icon className="size-5" />} {value}
      </div>
      {sub && <div className="text-xs opacity-70 mt-0.5">{sub}</div>}
    </div>
  );
}
