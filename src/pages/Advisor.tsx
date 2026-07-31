import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Send, Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type Msg = { role: "user" | "assistant"; content: string };

const STARTER_PROMPTS = [
  "How can I save more money this month?",
  "Where am I overspending?",
  "Explain common tax-saving options under 80C",
  "Help me build a monthly budget",
];

const MAX_INPUT_CHARS = 4_000;
const MAX_HISTORY_MESSAGES = 12;

const removeHiddenReasoning = (content: string) =>
  content
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*$/gi, "")
    .replace(/<\/?think>/gi, "")
    .trimStart();

const Advisor = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth?mode=signin");
      else setUser(session.user);
    });
  }, [navigate]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || text.length > MAX_INPUT_CHARS || streaming) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in");
        navigate("/auth?mode=signin");
        return;
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-advisor`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: next.slice(-MAX_HISTORY_MESSAGES) }),
      });

      if (!resp.ok || !resp.body) {
        const errorBody = await resp.json().catch(() => null) as { error?: string } | null;
        toast.error(errorBody?.error ?? "Failed to reach advisor");
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let assistant = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistant += delta;
              const visibleAssistant = removeHiddenReasoning(assistant);
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: visibleAssistant };
                return copy;
              });
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong");
    } finally {
      setStreaming(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background dark:bg-transparent flex flex-col">
      <header className="border-b glass sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-hero shadow-glow">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">AI Advisor</h1>
              <p className="text-xs text-muted-foreground">Personalized to your finances</p>
            </div>
          </div>
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-3xl space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 space-y-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-block p-6 rounded-2xl bg-gradient-hero shadow-glow-lg"
              >
                <Sparkles className="h-10 w-10 text-white" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Ask anything about your money</h2>
                <p className="text-muted-foreground">
                  I have access to your transactions, budgets, and goals -- ready to give you specific advice.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {STARTER_PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="text-left p-4 rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all hover-scale"
                  >
                    <span className="text-sm">{p}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <Card className={`max-w-[85%] px-4 py-3 ${
                  m.role === "user"
                    ? "bg-gradient-hero text-white border-0"
                    : "bg-card"
                }`}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-2 prose-headings:my-2">
                      <ReactMarkdown>{m.content || "..."}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {streaming && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <Card className="px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </Card>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t bg-card/50 backdrop-blur-sm sticky bottom-0">
        <div className="container mx-auto px-4 py-3 max-w-3xl">
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your finances..."
              disabled={streaming}
              className="flex-1"
            />
            <Button type="submit" disabled={streaming || !input.trim()} className="btn-glow" aria-label="Send message">
              {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </footer>
    </div>
  );
};

export default Advisor;

