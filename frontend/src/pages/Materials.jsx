import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Upload, FileText, MessageSquareText, Trash2, Loader2, CheckCircle2, AlertCircle, Search, NotebookPen, Layers } from "lucide-react";
import { toast } from "sonner";

const SUBJECTS = ["General", "History", "Geography", "Polity", "Economics", "Science", "Current Affairs", "Quantitative Aptitude", "English"];

export default function Materials() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("General");
  const [topic, setTopic] = useState("");
  const fileRef = useRef();

  const load = async () => {
    const { data } = await api.get("/materials");
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, []);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("subject", subject);
    fd.append("topic", topic);
    try {
      await api.post("/materials/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Uploaded! Processing in background…");
      setTopic("");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this material?")) return;
    await api.delete(`/materials/${id}`);
    toast.success("Deleted");
    load();
  };

  const filtered = items.filter(m =>
    !search || m.filename.toLowerCase().includes(search.toLowerCase()) ||
    (m.subject || "").toLowerCase().includes(search.toLowerCase()) ||
    (m.topic || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="materials-page">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-orange-600">Study Materials</div>
          <h1 className="text-3xl md:text-4xl font-bold font-heading mt-1">Your library</h1>
          <p className="text-muted-foreground mt-1 text-sm">Upload PDFs, DOCX, or TXT. We extract, embed, and make them searchable.</p>
        </div>
      </div>

      {/* Upload card */}
      <Card className="p-6 border-2 border-dashed border-orange-200 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-900/10">
        <div className="grid md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div>
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1.5 block">Subject</label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger data-testid="upload-subject-select"><SelectValue /></SelectTrigger>
              <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1.5 block">Topic (optional)</label>
            <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Mughal Empire" data-testid="upload-topic-input" />
          </div>
          <div>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md" onChange={upload} className="hidden" data-testid="upload-file-input" />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="bg-orange-600 hover:bg-orange-700 text-white w-full md:w-auto h-10" data-testid="upload-btn">
              {uploading ? <><Loader2 className="size-4 mr-2 animate-spin" /> Uploading…</> : <><Upload className="size-4 mr-2" /> Choose file</>}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">PDF, DOCX, TXT · Max 25MB · Processing takes 30-90 seconds.</p>
      </Card>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search materials…" value={search} onChange={e => setSearch(e.target.value)} data-testid="materials-search-input" />
      </div>

      {/* List */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <Card key={i} className="h-32 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="size-12 mx-auto opacity-30 mb-3" />
          <p className="text-muted-foreground">{items.length === 0 ? "No materials yet. Upload your first PDF above." : "No matching materials."}</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => (
            <Card key={m.id} className="p-5 hover:-translate-y-1 hover:shadow-lg transition-all" data-testid={`material-card-${m.id}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="size-10 rounded-md bg-slate-900 dark:bg-slate-100 flex items-center justify-center shrink-0">
                  <FileText className="size-5 text-orange-500" />
                </div>
                <StatusBadge status={m.status} />
              </div>
              <h3 className="font-semibold mt-3 line-clamp-2" title={m.filename}>{m.filename}</h3>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge variant="secondary" className="text-xs">{m.subject}</Badge>
                {m.topic && <Badge variant="outline" className="text-xs">{m.topic}</Badge>}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {m.status === "ready" ? `${m.page_count} pages · ${m.chunk_count} chunks` : m.status === "processing" ? "Indexing…" : m.error || "Failed"}
              </div>
              <div className="flex gap-1.5 mt-4 flex-wrap">
                <Link to={`/app/chat/${m.id}`} className="flex-1 min-w-[80px]">
                  <Button size="sm" variant="outline" className="w-full" disabled={m.status !== "ready"} data-testid={`material-chat-${m.id}`}>
                    <MessageSquareText className="size-3.5 mr-1" /> Chat
                  </Button>
                </Link>
                <Link to={`/app/notes?material=${m.id}`}>
                  <Button size="sm" variant="ghost" disabled={m.status !== "ready"} data-testid={`material-notes-${m.id}`}><NotebookPen className="size-3.5" /></Button>
                </Link>
                <Link to={`/app/flashcards?material=${m.id}`}>
                  <Button size="sm" variant="ghost" disabled={m.status !== "ready"} data-testid={`material-flash-${m.id}`}><Layers className="size-3.5" /></Button>
                </Link>
                <Button size="sm" variant="ghost" onClick={() => remove(m.id)} data-testid={`material-delete-${m.id}`}><Trash2 className="size-3.5 text-red-600" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "ready") return <Badge className="bg-emerald-600 text-white"><CheckCircle2 className="size-3 mr-1" />Ready</Badge>;
  if (status === "processing") return <Badge className="bg-amber-500 text-white"><Loader2 className="size-3 mr-1 animate-spin" />Processing</Badge>;
  return <Badge variant="destructive"><AlertCircle className="size-3 mr-1" />Failed</Badge>;
}
