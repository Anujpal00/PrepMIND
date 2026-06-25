import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, FileText, MessageSquareText, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "@/lib/markdown";

export default function ChatPage() {
  const { materialId } = useParams();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [selected, setSelected] = useState(materialId || "");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en");
  const [sending, setSending] = useState(false);
  const endRef = useRef();

  useEffect(() => {
    api.get("/materials").then(({ data }) => {
      const ready = data.filter(m => m.status === "ready");
      setMaterials(ready);
      if (!selected && ready.length > 0) {
        setSelected(ready[0].id);
        navigate(`/app/chat/${ready[0].id}`, { replace: true });
      }
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.get(`/chat/history/${selected}`).then(({ data }) => setMessages(data || []));
  }, [selected]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || !selected) return;
    const userMsg = { role: "user", content: input, id: Date.now() };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setSending(true);
    try {
      const { data } = await api.post("/chat/ask", { material_id: selected, message: userMsg.content, language });
      setMessages(m => [...m, { role: "assistant", content: data.answer, citations: data.citations, id: data.id }]);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Chat failed");
      setMessages(m => m.slice(0, -1));
    } finally { setSending(false); }
  };

  const activeMat = materials.find(m => m.id === selected);

  if (materials.length === 0) {
    return (
      <div className="text-center py-20" data-testid="chat-empty">
        <MessageSquareText className="size-12 mx-auto opacity-30 mb-3" />
        <p className="text-muted-foreground">Upload a study material first to chat with it.</p>
        <Button className="mt-4 bg-orange-600 hover:bg-orange-700 text-white" onClick={() => navigate("/app/materials")} data-testid="chat-goto-materials">Go to Materials</Button>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-6 h-[calc(100vh-8rem)] min-h-[500px]" data-testid="chat-page">
      {/* Left: material selector */}
      <Card className="p-4 hidden lg:flex flex-col">
        <div className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground mb-3">Material</div>
        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {materials.map(m => (
              <button
                key={m.id}
                onClick={() => { setSelected(m.id); navigate(`/app/chat/${m.id}`, { replace: true }); }}
                className={`w-full text-left p-3 rounded-md border text-sm transition-colors ${selected === m.id ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900" : "border-border hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                data-testid={`chat-select-${m.id}`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="size-4 shrink-0" />
                  <span className="truncate">{m.filename}</span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Right: chat */}
      <Card className="flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Button size="sm" variant="ghost" className="lg:hidden" onClick={() => navigate("/app/materials")} data-testid="chat-back-btn"><ArrowLeft className="size-4" /></Button>
            <FileText className="size-4 text-orange-600 shrink-0" />
            <span className="font-semibold truncate">{activeMat?.filename}</span>
          </div>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-32 h-8 text-xs" data-testid="chat-language-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिन्दी</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ScrollArea className="flex-1 p-5">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-sm">Ask anything about this material. Try:</p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                {["Summarize this in 5 bullets", "Create 10 MCQs from chapter 1", "Explain the main topic in Hindi"].map(s => (
                  <button key={s} onClick={() => setInput(s)} className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-slate-100 dark:hover:bg-slate-800" data-testid={`chat-suggest-${s.slice(0,8)}`}>{s}</button>
                ))}
              </div>
            </div>
          ) : messages.map((m, i) => (
            <div key={i} className={`mb-5 flex ${m.role === "user" ? "justify-end" : "justify-start"}`} data-testid={`msg-${m.role}-${i}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "bg-slate-50 dark:bg-slate-800"}`}>
                {m.role === "user" ? (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</div>
                ) : (
                  <div className="prose-notes text-sm leading-relaxed">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                )}
                {m.citations?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10 text-xs opacity-70">
                    Sources: {m.citations.map(c => `p.${c.page}`).join(", ")}
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start mb-5">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 text-sm flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Thinking…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </ScrollArea>
        <div className="p-4 border-t border-border flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Ask anything from this material…"
            disabled={sending}
            data-testid="chat-input"
          />
          <Button onClick={send} disabled={!input.trim() || sending} className="bg-orange-600 hover:bg-orange-700 text-white" data-testid="chat-send-btn">
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      </Card>
    </div>
  );
}
