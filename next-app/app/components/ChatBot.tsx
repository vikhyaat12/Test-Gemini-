"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════════
   CHATBOT — Premium Queens Care assistant
   Floating button, premium purple/gold styling, product cards,
   typing indicator, suggested questions, mobile-friendly.
   ═══════════════════════════════════════════════════════════════ */

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  products?: { name: string; slug: string; image: string; price: number; category: string }[];
  timestamp: number;
};

const SUGGESTED_QUESTIONS = [
  "What products do you have?",
  "Tell me about LUMINE-C",
  "How do I track my order?",
  "What is your return policy?",
];

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! 👋 Welcome to Queens Care Laboratories. I'm your personal care assistant. How can I help you today?",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if chatbot is enabled
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        const settings = d.settings || [];
        const chatbotSetting = settings.find((s: { key: string }) => s.key === "chatbot_enabled");
        if (chatbotSetting?.value === "false") setEnabled(false);
      })
      .catch(() => {});
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMsg: ChatMessage = { role: "user", content: text.trim(), timestamp: Date.now() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        const data = await res.json();

        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: data.response || "I'm having trouble understanding. Could you rephrase?",
          products: data.products || [],
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
            timestamp: Date.now(),
          },
        ]);
      }
      setLoading(false);
    },
    [messages, loading]
  );

  if (!enabled) return null;

  return (
    <>
      <style>{`
        @keyframes chatbotIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes chatbotPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(42,15,58,0.3); } 50% { box-shadow: 0 0 0 10px rgba(42,15,58,0); } }
        @keyframes typingDot { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }
        @media (prefers-reduced-motion: reduce) {
          .chatbot-panel { animation: none !important; }
          .chatbot-fab { animation: none !important; }
        }
      `}</style>

      {/* Chat Panel */}
      {open && (
        <div
          className="chatbot-panel"
          style={{
            position: "fixed",
            bottom: 90,
            right: 20,
            width: "min(400px, calc(100vw - 40px))",
            height: "min(560px, calc(100vh - 130px))",
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 12px 48px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 9995,
            animation: "chatbotIn 0.3s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 20px",
              background: "linear-gradient(135deg, #2A0F3A, #3e1654)",
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Queens Care Assistant</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, opacity: 0.7 }}>Ask about products, ingredients, orders</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.3)",
                background: "transparent",
                color: "#fff",
                cursor: "pointer",
                fontSize: 14,
                display: "grid",
                placeItems: "center",
              }}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflow: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "10px 14px",
                    borderRadius: msg.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                    background: msg.role === "user" ? "var(--purple, #2A0F3A)" : "#f5f3f0",
                    color: msg.role === "user" ? "#fff" : "var(--ink)",
                    fontSize: 13,
                    lineHeight: 1.6,
                  }}
                >
                  <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.content}</p>

                  {/* Product cards in chat */}
                  {msg.products && msg.products.length > 0 && (
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                      {msg.products.map((p) => (
                        <Link
                          key={p.slug}
                          href={`/products/${p.slug}`}
                          onClick={() => setOpen(false)}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "44px 1fr auto",
                            gap: 10,
                            alignItems: "center",
                            padding: "8px 10px",
                            background: "#fff",
                            borderRadius: 8,
                            border: "1px solid var(--line)",
                            textDecoration: "none",
                            color: "inherit",
                          }}
                        >
                          {p.image ? (
                            <img src={p.image} alt={p.name} style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6 }} />
                          ) : (
                            <div style={{ width: 44, height: 44, borderRadius: 6, background: "var(--line)" }} />
                          )}
                          <div>
                            <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>{p.name}</p>
                            <p style={{ margin: 0, fontSize: 10, color: "var(--muted)", textTransform: "capitalize" }}>{p.category}</p>
                          </div>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>₹{Number(p.price).toLocaleString("en-IN")}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "12px 16px", borderRadius: "12px 12px 12px 4px", background: "#f5f3f0" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "var(--muted)",
                          animation: `typingDot 1.2s infinite`,
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Suggested questions (only show if few messages) */}
            {messages.length <= 1 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 20,
                      border: "1px solid var(--line)",
                      background: "#fff",
                      fontSize: 11,
                      cursor: "pointer",
                      color: "var(--purple)",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--purple)";
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#fff";
                      e.currentTarget.style.color = "var(--purple)";
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--line)",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Ask about products, ingredients…"
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 24,
                border: "1px solid var(--line)",
                fontSize: 13,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "none",
                background: input.trim() ? "var(--purple, #2A0F3A)" : "#ddd",
                color: "#fff",
                cursor: input.trim() ? "pointer" : "not-allowed",
                fontSize: 16,
                display: "grid",
                placeItems: "center",
                transition: "background 0.2s",
              }}
              aria-label="Send message"
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        className="chatbot-fab"
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "none",
          background: "linear-gradient(135deg, #2A0F3A, #3e1654)",
          color: "#D4AF37",
          cursor: "pointer",
          fontSize: 24,
          boxShadow: "0 4px 20px rgba(42,15,58,0.35)",
          zIndex: 9996,
          display: "grid",
          placeItems: "center",
          animation: open ? "none" : "chatbotPulse 3s infinite",
          transition: "transform 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        aria-label={open ? "Close chat" : "Open chat assistant"}
      >
        {open ? "✕" : "💬"}
      </button>
    </>
  );
}
