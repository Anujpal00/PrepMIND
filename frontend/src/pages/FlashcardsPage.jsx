import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Layers, Loader2, Sparkles, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function FlashcardsPage() {
  const [params] = useSearchParams();
  const [materials, setMaterials] = useState([]);
  const [sets, setSets] = useState([]);
  const [activeSet, setActiveSet] = useState(null);
  const [cards, setCards] = useState([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [form, setForm] = useState({ material_id: params.get("material") || "", count: 15, language: "en" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/materials").then(({ data }) => setMaterials(data.filter(m => m.status === "ready")));
    api.get("/ai/flashcards").then(({ data }) => setSets(data));
  }, []);

  const loadSet = async (setId) => {
    const { data } = await api.get(`/ai/flashcards/${setId}`);
    setCards(data);
    setActiveSet(setId);
    setIdx(0); setFlipped(false);
  };

  const generate = async () => {
    if (!form.material_id) { toast.error("Choose a material"); return; }
    setBusy(true);
    try {
      const { data } = await api.post("/ai/flashcards", form);
      setSets(s => [{ set_id: data.set_id, count: data.count, created_at: new Date().toISOString(), material_id: form.material_id }, ...s]);
      setCards(data.flashcards);
      setActiveSet(data.set_id);
      setIdx(0); setFlipped(false);
      toast.success(`${data.count} flashcards ready!`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally { setBusy(false); }
  };

  const card = cards[idx];

  return (
    <div className="space-y-6" data-testid="flashcards-page">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] font-bold text-orange-600">Flashcards</div>
        <h1 className="text-3xl md:text-4xl font-bold font-heading mt-1">Spaced-repetition revision</h1>
      </div>

      <Card className="p-6 grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Material</Label>
          <Select value={form.material_id} onValueChange={v => setForm({ ...form, material_id: v })}>
            <SelectTrigger data-testid="flash-material-select"><SelectValue placeholder="Choose…" /></SelectTrigger>
            <SelectContent>{materials.map(m => <SelectItem key={m.id} value={m.id}>{m.filename}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Language</Label>
          <Select value={form.language} onValueChange={v => setForm({ ...form, language: v })}>
            <SelectTrigger data-testid="flash-lang-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिन्दी</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between"><Label>Count</Label><span className="text-sm font-semibold">{form.count}</span></div>
          <Slider value={[form.count]} min={5} max={30} step={5} onValueChange={([v]) => setForm({ ...form, count: v })} data-testid="flash-count-slider" />
        </div>
        <div className="md:col-span-3">
          <Button onClick={generate} disabled={busy || !form.material_id} className="w-full bg-orange-600 hover:bg-orange-700 text-white h-11" data-testid="flash-generate-btn">
            {busy ? <><Loader2 className="size-4 mr-2 animate-spin" /> Generating…</> : <><Sparkles className="size-4 mr-2" /> Generate flashcards</>}
          </Button>
        </div>
      </Card>

      {sets.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Your sets</div>
          <div className="flex flex-wrap gap-2">
            {sets.map(s => (
              <button key={s.set_id} onClick={() => loadSet(s.set_id)} className={`px-3 py-1.5 rounded-md border text-xs ${activeSet === s.set_id ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20" : "border-border hover:bg-slate-50 dark:hover:bg-slate-800"}`} data-testid={`flash-set-${s.set_id}`}>
                {s.count} cards · {new Date(s.created_at).toLocaleDateString()}
              </button>
            ))}
          </div>
        </div>
      )}

      {cards.length > 0 && card && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-sm text-muted-foreground">{idx + 1} / {cards.length}</div>
          <Card
            onClick={() => setFlipped(f => !f)}
            className="w-full max-w-2xl min-h-[280px] p-10 cursor-pointer flex items-center justify-center text-center transition-transform hover:scale-[1.01]"
            data-testid="flashcard-body"
          >
            {flipped ? (
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-orange-600 mb-3 font-bold">Answer</div>
                <p className="text-lg leading-relaxed">{card.back}</p>
              </div>
            ) : (
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 font-bold">Question</div>
                <p className="text-xl font-heading font-semibold">{card.front}</p>
                <p className="text-xs text-muted-foreground mt-6">Click to flip</p>
              </div>
            )}
          </Card>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setIdx(i => Math.max(0, i - 1)); setFlipped(false); }} disabled={idx === 0} data-testid="flash-prev-btn">
              <ChevronLeft className="size-4 mr-1" /> Prev
            </Button>
            <Button variant="outline" onClick={() => setFlipped(f => !f)} data-testid="flash-flip-btn">
              <RotateCcw className="size-4 mr-1" /> Flip
            </Button>
            <Button onClick={() => { setIdx(i => Math.min(cards.length - 1, i + 1)); setFlipped(false); }} disabled={idx === cards.length - 1} className="bg-slate-900 hover:bg-slate-800 text-white" data-testid="flash-next-btn">
              Next <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {cards.length === 0 && sets.length === 0 && (
        <Card className="p-12 text-center">
          <Layers className="size-12 mx-auto opacity-30 mb-3" />
          <p className="text-muted-foreground">Generate your first flashcard set above.</p>
        </Card>
      )}
    </div>
  );
}
