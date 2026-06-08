"use client";
import { useState } from "react";
import { Bot, Sparkles, FileText, MessageSquare, ListTodo, AlertCircle, Loader2, CheckCircle, Copy, Check } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const H   = () => ({ "Content-Type": "application/json", ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
      {copied ? <><Check size={12} className="text-green-500" /> Copied</> : <><Copy size={12} /> Copy</>}
    </button>
  );
}

export default function LawyerAiToolsPage() {
  const [form, setForm]         = useState({ caseTitle: "", caseDescription: "" });
  const [activeType, setType]   = useState("summarize");
  const [result, setResult]     = useState("");
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  const tools = [
    { id: "summarize", label: "Case Summary",      icon: FileText,      desc: "Get a quick bullet-point summary" },
    { id: "response",  label: "Draft Response",    icon: MessageSquare, desc: "Generate a client response draft" },
    { id: "tasks",     label: "Extract Tasks",     icon: ListTodo,      desc: "Get a list of action items" },
  ];

  const run = async () => {
    if (!form.caseTitle.trim() || !form.caseDescription.trim()) {
      setError("Please fill in both case title and description.");
      return;
    }
    setError("");
    setLoading(true);
    setResult("");
    setTasks([]);
    setSuccess(false);

    try {
      const res  = await fetch(`${API}/api/ai/lawyer-assist`, {
        method: "POST", headers: H(), credentials: "include",
        body: JSON.stringify({ ...form, requestType: activeType }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        if (activeType === "tasks") {
          try {
            const parsed = JSON.parse(data.result.replace(/```json|```/g, "").trim());
            setTasks(Array.isArray(parsed) ? parsed : [data.result]);
          } catch {
            setTasks(data.result.split("\n").filter(Boolean));
          }
        } else {
          setResult(data.result);
        }
      } else {
        setError(data.message || "AI assistant failed. Please try again.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
            <Bot size={20} className="text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Lawyer Assistant</h1>
            <p className="text-sm text-gray-500">Case tools powered by Google Gemini</p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3">
          <AlertCircle size={14} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            <strong>Important:</strong> All AI-generated content must be reviewed and verified by you before use. AI assists your workflow — final judgment is always yours.
          </p>
        </div>

        {/* Tool selector */}
        <div className="grid grid-cols-3 gap-3">
          {tools.map(({ id, label, icon: Icon, desc }) => (
            <button
              key={id}
              onClick={() => { setType(id); setResult(""); setTasks([]); setSuccess(false); }}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeType === id
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
              }`}
            >
              <Icon size={16} className={activeType === id ? "text-green-600 mb-1" : "text-gray-400 mb-1"} />
              <p className={`text-xs font-semibold ${activeType === id ? "text-green-700 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}`}>{label}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">{desc}</p>
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Case Title</label>
            <input
              value={form.caseTitle}
              onChange={(e) => setForm((f) => ({ ...f, caseTitle: e.target.value }))}
              placeholder="e.g. Property dispute - Khan vs Ahmed"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Case Description</label>
            <textarea
              value={form.caseDescription}
              onChange={(e) => setForm((f) => ({ ...f, caseDescription: e.target.value }))}
              rows={5}
              placeholder="Describe the case details, background, current situation, and any relevant facts..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button
            onClick={run}
            disabled={loading}
            className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Generating...</>
              : <><Sparkles size={16} /> {tools.find((t) => t.id === activeType)?.label}</>
            }
          </button>
        </div>

        {/* Result */}
        {success && (result || tasks.length > 0) && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                <CheckCircle size={15} /> AI Result
              </div>
              {result && <CopyButton text={result} />}
            </div>

            {activeType === "tasks" && tasks.length > 0 ? (
              <ol className="space-y-2">
                {tasks.map((task, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{task}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{result}</p>
              </div>
            )}

            <p className="text-xs text-gray-400 italic">⚠️ Review all AI-generated content before use. This is a draft only.</p>
          </div>
        )}
      </div>
  );
}