"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { Header } from "@/components/Header";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import {
  Bot,
  Send,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  BookOpen,
  MessageSquare,
  HelpCircle,
  Code2,
  Lightbulb,
  ListOrdered,
  GraduationCap,
  X,
  ChevronRight,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  subject?: { id: string; name: string } | null;
}

interface Subject {
  id: string;
  name: string;
}

export default function TutorPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [responseMode, setResponseMode] = useState<string>("simple");
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [suggestedFollowUps, setSuggestedFollowUps] = useState<string[]>([]);
  const [mobileChatsOpen, setMobileChatsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load conversations & subjects
  useEffect(() => {
    fetch("/api/subjects")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.subjects) setSubjects(data.subjects);
      })
      .catch(() => {});

    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadConversationMessages = async (id: string) => {
    setActiveConversationId(id);
    setMobileChatsOpen(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.conversation?.messages || []);
        if (data.conversation?.subjectId) {
          setSelectedSubjectId(data.conversation.subjectId);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setSuggestedFollowUps([]);
    setInputPrompt("");
    setMobileChatsOpen(false);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation?")) return;
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (activeConversationId === id) {
        handleStartNewChat();
      }
      loadConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || loading) return;

    setInputPrompt("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const tempUserMsg: Message = {
      id: "temp-" + Date.now(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId || undefined,
          message: text,
          subjectId: selectedSubjectId || undefined,
          responseMode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get tutor answer");
      }

      if (!activeConversationId && data.conversationId) {
        setActiveConversationId(data.conversationId);
        loadConversations();
      }

      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }

      if (data.suggestedFollowUps) {
        setSuggestedFollowUps(data.suggestedFollowUps);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Error contacting AI Tutor";
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content: `⚠️ **Academic Assistant Notice**: ${errorMsg}. Please try submitting again.`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputPrompt(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const modeOptions = [
    { value: "simple", label: "Simple", icon: Lightbulb },
    { value: "detailed", label: "Detailed", icon: BookOpen },
    { value: "step_by_step", label: "Step-by-Step", icon: ListOrdered },
    { value: "example", label: "Example", icon: Code2 },
    { value: "quiz_me", label: "Quiz Me", icon: HelpCircle },
    { value: "socratic", label: "Socratic Discovery", icon: GraduationCap },
  ];

  return (
    <AppShell>
      <Header
        title="AI Academic Tutor"
        subtitle="Ultra-concise college tutor: step-by-step math, science intuitions & exam prep"
      />

      <div className="h-[calc(100vh-4.5rem)] flex overflow-hidden relative">
        {/* Mobile Slide-Over Backdrop & Drawer */}
        {mobileChatsOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileChatsOpen(false)}
            />
            <div className="relative w-72 max-w-[85%] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" /> Past Conversations
                </span>
                <button
                  onClick={() => setMobileChatsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3">
                <button
                  onClick={handleStartNewChat}
                  className="w-full py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Start New Question
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
                {conversations.length === 0 ? (
                  <p className="p-4 text-center text-xs text-slate-400">No chat history yet.</p>
                ) : (
                  conversations.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => loadConversationMessages(c.id)}
                      className={`p-3 rounded-xl text-xs cursor-pointer flex items-center justify-between ${
                        activeConversationId === c.id
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="truncate">{c.title}</p>
                        {c.subject?.name && (
                          <span className="text-[10px] text-slate-400">{c.subject.name}</span>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleDeleteConversation(c.id, e)}
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Desktop Sidebar: Conversation History */}
        <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0 h-full">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> Conversations ({conversations.length})
            </span>
            <button
              onClick={handleStartNewChat}
              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800"
              title="Start New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No past chats yet. Ask a question to begin!
              </div>
            ) : (
              conversations.map((c) => {
                const isActive = activeConversationId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => loadConversationMessages(c.id)}
                    className={`p-2.5 rounded-xl text-xs cursor-pointer flex items-center justify-between group transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate">{c.title}</p>
                      {c.subject?.name && (
                        <p className="text-[10px] text-slate-400 truncate">{c.subject.name}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(c.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 rounded text-slate-400 transition-opacity"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Center / Main Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
          {/* Top Control Bar: Subject, Chats Drawer & Mode Selector */}
          <div className="p-2 sm:p-3 bg-white border-b border-slate-200 space-y-2 shadow-2xs">
            {/* Top row: Subject on left, Chats & New Chat on right */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-semibold text-slate-500 shrink-0">Subject:</span>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 outline-none focus:border-blue-500 max-w-[130px] sm:max-w-[200px] truncate"
                >
                  <option value="">General Academic</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chat management buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setMobileChatsOpen(true)}
                  className="md:hidden px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
                  title="View past conversations"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Chats ({conversations.length})</span>
                </button>

                <button
                  onClick={handleStartNewChat}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                  title="Start a new question"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New</span>
                </button>
              </div>
            </div>

            {/* Response Mode Selector (Horizontal swipeable on mobile) */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
              {modeOptions.map((mode) => {
                const isSelected = responseMode === mode.value;
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.value}
                    onClick={() => setResponseMode(mode.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-5">
            {messages.length === 0 ? (
              <div className="max-w-2xl mx-auto my-6 sm:my-10 text-center space-y-4 px-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-700 mx-auto">
                  <span>🇵🇭 Full Multilingual Support: English, Tagalog & Bisaya</span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  Ask Your College Academic Tutor
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Pwede kang magtanong sa Tagalog, Bisaya, o English! Step-by-step math, science, essays, and active recall practice.
                </p>

                {/* College Starter Prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-2 max-w-xl mx-auto">
                  {[
                    "🇵🇭 Tagalog: Ano ang photosynthesis at paano ito gumagana sa mga halaman?",
                    "🇵🇭 Bisaya: Unsa man ang balaod sa Newton nga ikaduha ug unsaon pag-compute?",
                    "Solve step-by-step: derivative of f(x) = x^3 * sin(x)",
                    "Explain Newton's 3 laws with intuitive college examples",
                    "How do supply and demand shifts affect market equilibrium?",
                    "Help me understand recursion in Python without giving the answer immediately",
                  ].map((sample, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(sample.replace(/^🇵🇭 (Tagalog|Bisaya):\s*/, ""))}
                      className="p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs text-xs text-slate-700 transition-all text-left flex items-start gap-2 group"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <span className="line-clamp-2">{sample}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 sm:gap-3 max-w-3xl ${
                    msg.role === "user" ? "ml-auto justify-end" : "mr-auto justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`rounded-2xl p-3.5 sm:p-5 text-sm shadow-xs ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-xs max-w-[88%] sm:max-w-xl"
                        : "bg-white border border-slate-200/80 rounded-bl-xs text-slate-800 max-w-[95%] sm:max-w-2xl"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">{msg.content}</p>
                    ) : (
                      <div>
                        <MarkdownRenderer content={msg.content} />
                        
                        {/* Quick action bar below assistant responses */}
                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleSendMessage("Can you give me a real-world example of this?")}
                              className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded text-[11px] border border-slate-200 flex items-center gap-1 transition-colors"
                            >
                              <Code2 className="w-3 h-3 text-blue-600" /> Example
                            </button>
                            <button
                              onClick={() => handleSendMessage("Quiz me on this concept to test my understanding")}
                              className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded text-[11px] border border-slate-200 flex items-center gap-1 transition-colors"
                            >
                              <HelpCircle className="w-3 h-3 text-indigo-600" /> Quiz Me
                            </button>
                          </div>

                          <button
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            className="p-1 hover:text-slate-700 rounded flex items-center gap-1 transition-colors"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-[11px] text-emerald-600 font-medium">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-[11px]">Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0 mt-1 text-xs">
                      You
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="flex gap-2.5 sm:gap-3 max-w-2xl mr-auto">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs p-3.5 sm:p-4 text-xs text-slate-600 flex items-center gap-2.5 shadow-xs">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  <span>AI StudyMate is preparing your step-by-step explanation...</span>
                </div>
              </div>
            )}

            {/* Suggested Follow-Up Interactive Chips */}
            {!loading && suggestedFollowUps.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Suggested Next Steps:
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {suggestedFollowUps.map((fu, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(fu)}
                      className="text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full border border-blue-200 transition-colors cursor-pointer text-left flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>{fu}</span>
                      <ChevronRight className="w-3 h-3 text-blue-500 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Form (Responsive Auto-expanding Textarea) */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shadow-xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="max-w-4xl mx-auto flex items-end gap-2"
            >
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all p-1.5 sm:p-2">
                <textarea
                  ref={textareaRef}
                  value={inputPrompt}
                  onChange={handleTextareaInput}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Ask in English, Tagalog, or Bisaya (e.g. solve calculus, unsaon pag-compute, ipaliwanag ang thesis)..."
                  className="w-full bg-transparent resize-none outline-none text-slate-900 text-xs sm:text-sm px-2 py-1 max-h-36 placeholder:text-slate-400 leading-relaxed"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !inputPrompt.trim()}
                className="p-3 sm:px-5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium text-xs sm:text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer shrink-0"
                title="Send question"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span className="hidden sm:inline">Ask</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
            <p className="text-[10px] text-center text-slate-400 mt-1.5">
              Press Enter to send, Shift + Enter for new line. Pwede magtanong sa English, Tagalog, at Bisaya!
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
