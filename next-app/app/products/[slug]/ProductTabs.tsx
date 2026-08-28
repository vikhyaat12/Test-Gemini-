"use client";

import { useState } from "react";

type Review = { id: string; rating: number; title: string; body: string; user: { name: string }; createdAt: string; helpful: number };
type QA = { id: string; question: string; answer: string | null; createdAt: string };
type FAQ = { q: string; a: string };
type Product = { ingredients?: string; usage?: string; description?: string; id?: string };

export default function ProductTabs({
  product, reviews, avgRating, ratingDist, faqs, questions, productId,
}: {
  productId: string;
  product: Product;
  reviews: Review[];
  avgRating: string;
  ratingDist: { star: number; count: number }[];
  faqs: FAQ[];
  questions: QA[];
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [qaInput, setQaInput] = useState("");
  const [qaMessage, setQaMessage] = useState("");
  const tabs = ["Description", "Ingredients", "How to use", "Reviews", "Q&A", "FAQ"];

  const submitQuestion = async () => {
    if (!qaInput.trim()) return;
    try {
      const res = await fetch(`/api/products/${productId}/qa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: qaInput }),
      });
      if (res.ok) { setQaMessage("Your question has been submitted and will appear after review."); setQaInput(""); }
      else setQaMessage("Could not submit your question. Please try again.");
    } catch { setQaMessage("Network error. Please try again."); }
  };

  const maxCount = Math.max(...ratingDist.map(r => r.count), 1);

  return (
    <section className="product-details-section" style={{ marginTop: 48 }}>
      <div className="detail-tabs" style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--line)", marginBottom: 24 }}>
        {tabs.map((tab, index) => (
          <button key={tab} className={activeTab === index ? "tab-active" : ""}
            onClick={() => setActiveTab(index)}
            style={{ padding: "12px 20px", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: activeTab === index ? 700 : 400, borderBottom: activeTab === index ? "2px solid var(--purple)" : "2px solid transparent", marginBottom: -2, color: activeTab === index ? "var(--purple)" : "var(--muted)" }}>
            {tab}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {/* ─── DESCRIPTION ─── */}
        {activeTab === 0 && (
          <div className="tab-panel active">
            <p style={{ fontSize: 14, lineHeight: 1.8 }}>{product.description}</p>
          </div>
        )}

        {/* ─── INGREDIENTS ─── */}
        {activeTab === 1 && (
          <div className="tab-panel active">
            <h3>Full ingredient transparency</h3>
            {product.ingredients ? (
              <p style={{ fontSize: 14, lineHeight: 1.8 }}>{product.ingredients}</p>
            ) : (
              <p className="muted">Ingredient details will be available soon. Every ingredient is listed with its purpose and concentration.</p>
            )}
          </div>
        )}

        {/* ─── USAGE ─── */}
        {activeTab === 2 && (
          <div className="tab-panel active">
            <h3>Suggested ritual</h3>
            {product.usage ? (
              <p style={{ fontSize: 14, lineHeight: 1.8 }}>{product.usage}</p>
            ) : (
              <p className="muted">Usage instructions will be available soon. Follow the suggested daily ritual for best results.</p>
            )}
          </div>
        )}

        {/* ─── REVIEWS ─── */}
        {activeTab === 3 && (
          <div className="tab-panel active">
            <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 32 }}>
              <div>
                <div style={{ textAlign: "center", padding: 20, background: "var(--paper)" }}>
                  <b style={{ font: "36px var(--font-display)", display: "block" }}>{avgRating}</b>
                  <p style={{ fontSize: 13, color: "var(--muted)" }}>{reviews.length} reviews</p>
                </div>
                <div style={{ marginTop: 16 }}>
                  {ratingDist.map(r => (
                    <div key={r.star} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, fontSize: 12 }}>
                      <span style={{ width: 12 }}>{r.star}★</span>
                      <div style={{ flex: 1, height: 6, background: "#eee", borderRadius: 3 }}>
                        <div style={{ width: `${(r.count / maxCount) * 100}%`, height: "100%", background: "var(--gold)", borderRadius: 3 }} />
                      </div>
                      <span style={{ width: 20, textAlign: "right", color: "var(--muted)" }}>{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                {reviews.length === 0 ? (
                  <p style={{ color: "var(--muted)", fontSize: 13 }}>No reviews yet. Be the first to share your experience.</p>
                ) : (
                  <div style={{ display: "grid", gap: 16 }}>
                    {reviews.map(r => (
                      <div key={r.id} style={{ padding: 16, border: "1px solid var(--line)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <div>
                            <b style={{ fontSize: 13 }}>{r.user.name}</b>
                            <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 8 }}>{new Date(r.createdAt).toLocaleDateString("en-IN")}</span>
                          </div>
                          <span style={{ fontSize: 12 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                        </div>
                        {r.title && <b style={{ fontSize: 13, display: "block", marginBottom: 4 }}>{r.title}</b>}
                        <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{r.body}</p>
                        {r.helpful > 0 && <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>Helpful ({r.helpful})</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Q&A ─── */}
        {activeTab === 4 && (
          <div className="tab-panel active">
            <h3>Customer questions & answers</h3>
            <div style={{ margin: "20px 0" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={qaInput} onChange={e => setQaInput(e.target.value)} placeholder="Ask a question about this product…" style={{ flex: 1, padding: "10px 14px", border: "1px solid var(--line)", fontSize: 13 }} />
                <button onClick={submitQuestion} style={{ padding: "10px 18px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12 }}>Ask</button>
              </div>
              {qaMessage && <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>{qaMessage}</p>}
            </div>
            {questions.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>No questions yet. Be the first to ask.</p>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {questions.map(q => (
                  <div key={q.id} style={{ padding: 16, border: "1px solid var(--line)" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Q: {q.question}</p>
                    {q.answer ? (
                      <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ink)", paddingLeft: 16, borderLeft: "2px solid var(--gold)" }}>A: {q.answer}</p>
                    ) : (
                      <p style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>Awaiting answer from our care team.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── FAQ ─── */}
        {activeTab === 5 && (
          <div className="tab-panel active">
            <h3>Frequently asked questions</h3>
            {faqs.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>No FAQ available for this product yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {faqs.map((f, i) => (
                  <div key={i} style={{ padding: 16, border: "1px solid var(--line)" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{f.q}</p>
                    <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{f.a}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
