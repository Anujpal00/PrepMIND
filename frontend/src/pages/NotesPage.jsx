import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { NotebookPen, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "@/lib/markdown";

export default function NotesPage() {
  const [params] = useSearchParams();
  const [materials, setMaterials] = useState([]);
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState({ material_id: params.get("material") || "", style: "short", language: "en" });
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(null);

  useEffect(() => {
    api.get("/materials").then(({ data }) => setMaterials(data.filter(m => m.status === "ready")));
    api.get("/ai/notes").then(({ data }) => setNotes(data));
  }, []);

  const generate = async () => {
    if (!form.material_id) { toast.error("Choose a material"); return; }
    setBusy(true);
    try {
      const { data } = await api.post("/ai/notes", form);
      setNotes(n => [data, ...n]);
      setActive(data);
      toast.success("Notes generated!");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6" data-testid="notes-page">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] font-bold text-orange-600">AI Notes Generator</div>
        <h1 className="text-3xl md:text-4xl font-bold font-heading mt-1">Turn PDFs into revision notes</h1>
      </div>

      <Card className="p-6 grid md:grid-cols-4 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label>Material</Label>
          <Select value={form.material_id} onValueChange={v => setForm({ ...form, material_id: v })}>
            <SelectTrigger data-testid="notes-material-select"><SelectValue placeholder="Choose material" /></SelectTrigger>
            <SelectContent>{materials.map(m => <SelectItem key={m.id} value={m.id}>{m.filename}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Style</Label>
          <Select value={form.style} onValueChange={v => setForm({ ...form, style: v })}>
            <SelectTrigger data-testid="notes-style-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="short">Short notes</SelectItem>
              <SelectItem value="detailed">Detailed notes</SelectItem>
              <SelectItem value="one_page">One-page revision</SelectItem>
              <SelectItem value="highlights">Highlights only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Language</Label>
          <Select value={form.language} onValueChange={v => setForm({ ...form, language: v })}>
            <SelectTrigger data-testid="notes-lang-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिन्दी</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-4">
          <Button onClick={generate} disabled={busy || !form.material_id} className="w-full bg-orange-600 hover:bg-orange-700 text-white h-11" data-testid="notes-generate-btn">
            {busy ? <><Loader2 className="size-4 mr-2 animate-spin" /> Generating…</> : <><Sparkles className="size-4 mr-2" /> Generate notes</>}
          </Button>
        </div>
      </Card>

      <div className="grid lg:grid-cols-[300px_1fr] gap-6">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground mb-3">Your notes ({notes.length})</div>
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            <div className="space-y-1.5">
              {notes.map(n => (
                <button key={n.id} onClick={() => setActive(n)} className={`w-full text-left p-3 rounded-md border text-sm ${active?.id === n.id ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20" : "border-border hover:bg-slate-50 dark:hover:bg-slate-800"}`} data-testid={`note-item-${n.id}`}>
                  <div className="font-semibold truncate">{n.material_filename}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 capitalize">{n.style.replace("_", " ")} · {new Date(n.created_at).toLocaleDateString()}</div>
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
              <NotebookPen className="size-12 mx-auto opacity-30 mb-3" />
              <p className="text-sm">{notes.length === 0 ? "Generate your first note above." : "Select a note to view."}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
