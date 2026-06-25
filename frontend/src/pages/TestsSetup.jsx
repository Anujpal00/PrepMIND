import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ClipboardList, Loader2, Trophy, PlayCircle, Sparkles, Timer } from "lucide-react";
import { toast } from "sonner";

const EXAMS = ["SSC CGL", "SSC CHSL", "UPSC", "Banking", "Railway"];
const SUBJECTS = ["General Awareness", "History", "Geography", "Polity", "Economics", "Science", "Current Affairs", "Quantitative Aptitude", "English", "General Intelligence"];

export default function TestsSetup() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("topic");
  const [busy, setBusy] = useState(false);
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [topic, setTopic] = useState({ exam: "SSC CGL", subject: "General Awareness", topic: "", count: 10, difficulty: "medium", language: "en" });
  const [mock, setMock] = useState({ exam: "SSC CGL", language: "en" });

  const load = async () => {
    const [t, r] = await Promise.all([api.get("/tests"), api.get("/tests/results/all")]);
    setTests(t.data);
    setResults(r.data);
  };

  useEffect(() => { load(); }, []);

  const startTopic = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/tests/create", { test_type: "topic", ...topic });
      toast.success("Test ready! Starting…");
      navigate(`/app/test/${data.id}`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to create test");
    } finally { setBusy(false); }
  };

  const startMock = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/tests/create", { test_type: "mock", ...mock, count: 100 });
      toast.success("Mock generated! Get ready…");
      navigate(`/app/test/${data.id}`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to create mock");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6" data-testid="tests-page">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] font-bold text-orange-600">Tests & Mocks</div>
        <h1 className="text-3xl md:text-4xl font-bold font-heading mt-1">Practice. Measure. Improve.</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList data-testid="tests-tabs">
          <TabsTrigger value="topic" data-testid="tests-tab-topic">Topic Test</TabsTrigger>
          <TabsTrigger value="mock" data-testid="tests-tab-mock">Full Mock</TabsTrigger>
          <TabsTrigger value="history" data-testid="tests-tab-history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="topic">
          <Card className="p-6 grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label>Exam</Label>
              <Select value={topic.exam} onValueChange={v => setTopic({ ...topic, exam: v })}>
                <SelectTrigger data-testid="topic-exam"><SelectValue /></SelectTrigger>
                <SelectContent>{EXAMS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={topic.subject} onValueChange={v => setTopic({ ...topic, subject: v })}>
                <SelectTrigger data-testid="topic-subject"><SelectValue /></SelectTrigger>
                <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Topic (e.g. Mughal Empire, Profit & Loss)</Label>
              <Input value={topic.topic} onChange={e => setTopic({ ...topic, topic: e.target.value })} data-testid="topic-input" />
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={topic.difficulty} onValueChange={v => setTopic({ ...topic, difficulty: v })}>
                <SelectTrigger data-testid="topic-diff"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={topic.language} onValueChange={v => setTopic({ ...topic, language: v })}>
                <SelectTrigger data-testid="topic-lang"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिन्दी</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <div className="flex justify-between"><Label>Questions</Label><span className="text-sm font-semibold">{topic.count}</span></div>
              <Slider value={[topic.count]} min={5} max={50} step={5} onValueChange={([v]) => setTopic({ ...topic, count: v })} data-testid="topic-count" />
            </div>
            <div className="md:col-span-2">
              <Button onClick={startTopic} disabled={busy} className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white" data-testid="topic-start-btn">
                {busy ? <><Loader2 className="size-4 mr-2 animate-spin" /> Generating…</> : <><PlayCircle className="size-4 mr-2" /> Generate & Start</>}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="mock">
          <Card className="p-6 space-y-5">
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/40 rounded-md p-4 text-sm">
              <div className="font-semibold mb-1 flex items-center gap-2"><Sparkles className="size-4 text-orange-600" /> SSC CGL Tier-1 Pattern</div>
              <p className="text-muted-foreground">100 Q · 60 min · 4 sections (GI, Quant, English, GA) · 2 marks/q · -0.5 negative</p>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Exam</Label>
                <Select value={mock.exam} onValueChange={v => setMock({ ...mock, exam: v })}>
                  <SelectTrigger data-testid="mock-exam"><SelectValue /></SelectTrigger>
                  <SelectContent>{EXAMS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={mock.language} onValueChange={v => setMock({ ...mock, language: v })}>
                  <SelectTrigger data-testid="mock-lang"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">हिन्दी</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={startMock} disabled={busy} className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white" data-testid="mock-start-btn">
              {busy ? <><Loader2 className="size-4 mr-2 animate-spin" /> Building 100Q mock (60-90s)…</> : <><Trophy className="size-4 mr-2" /> Generate & Start Mock</>}
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          {results.length === 0 ? (
            <Card className="p-12 text-center">
              <ClipboardList className="size-12 mx-auto opacity-30 mb-3" />
              <p className="text-muted-foreground">No attempts yet. Take your first test!</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {results.map(r => (
                <Card key={r.id} className="p-5 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate(`/app/result/${r.id}`)} data-testid={`result-card-${r.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">{r.test_title}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge variant="secondary" className="text-xs">{r.exam}</Badge>
                        <Badge variant="outline" className="text-xs">{r.test_type}</Badge>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <div className="text-2xl font-bold font-heading">{r.percent_score}%</div>
                      <div className="text-xs text-muted-foreground">{r.correct}/{r.total_questions}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-3 flex items-center gap-1"><Timer className="size-3" /> {Math.round((r.time_taken_seconds || 0) / 60)} min · {new Date(r.submitted_at).toLocaleDateString()}</div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
