import { useState } from "react";
import type { FormEvent } from "react";
import type { Chapter } from "../../models/chapter";

interface AddChapterSheetProps {
  onClose: () => void;
  onSubmit: (title: string, act: string, purpose: string, status: string) => Promise<Chapter>;
  onSelectAction: (action: 'write' | 'scenes' | 'stay', chapterId: string) => void;
}

export function AddChapterSheet({ onClose, onSubmit, onSelectAction }: AddChapterSheetProps) {
  const [title, setTitle] = useState("");
  const [act, setAct] = useState("Act I");
  const [purpose, setPurpose] = useState("");
  const [status, setStatus] = useState<'draft' | 'writing' | 'complete' | 'review'>("draft");
  
  const [createdChapter, setCreatedChapter] = useState<Chapter | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const chapter = await onSubmit(title.trim(), act, purpose.trim(), status);
      setCreatedChapter(chapter);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, top: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "#212121", width: "100%", borderTopLeftRadius: "20px", borderTopRightRadius: "20px", padding: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.08)", boxSizing: "border-box" as any, display: "flex", flexDirection: "column", gap: "1rem" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.75rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#fff", margin: 0 }}>
            {createdChapter ? "Chapter Created!" : "Create Chapter"}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "1.2rem", cursor: "pointer", padding: "0 0.5rem" }}>
            ✕
          </button>
        </div>

        {!createdChapter ? (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "block", marginBottom: "0.3rem" }}>Title</label>
              <input
                type="text"
                required
                placeholder="e.g. The Awakening"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{ width: "100%", background: "#2d2d2d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#fff", padding: "0.55rem 0.75rem", fontSize: "0.85rem", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "block", marginBottom: "0.3rem" }}>Act</label>
              <select
                value={act}
                onChange={e => setAct(e.target.value)}
                style={{ width: "100%", background: "#2d2d2d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#fff", padding: "0.55rem 0.75rem", fontSize: "0.85rem", boxSizing: "border-box" }}
              >
                <option value="Act I">Act I — The Awakening</option>
                <option value="Act II">Act II — The Collapse</option>
                <option value="Act III">Act III — The Resolve</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "block", marginBottom: "0.3rem" }}>Goal / Purpose</label>
              <textarea
                placeholder="What happens in this chapter? Why does it exist?"
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                rows={2}
                style={{ width: "100%", background: "#2d2d2d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#fff", padding: "0.55rem 0.75rem", fontSize: "0.85rem", boxSizing: "border-box", resize: "none" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "block", marginBottom: "0.3rem" }}>Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                style={{ width: "100%", background: "#2d2d2d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#fff", padding: "0.55rem 0.75rem", fontSize: "0.85rem", boxSizing: "border-box" }}
              >
                <option value="draft">○ Draft</option>
                <option value="writing">◐ Writing</option>
                <option value="complete">● Complete</option>
                <option value="review">△ Review</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{ background: "#e08e6d", border: "none", color: "#fff", padding: "0.75rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem", marginTop: "0.5rem" }}
            >
              {submitting ? "Creating..." : "Create Chapter"}
            </button>
          </form>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "0.5rem 0" }}>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "rgba(255,255,255,0.7)", textAlign: "center" }}>
              Chapter <strong>"{createdChapter.title}"</strong> created successfully. What would you like to do next?
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              <button
                onClick={() => onSelectAction("write", createdChapter.id)}
                style={{ background: "linear-gradient(90deg, #9f8ad0, #e08e6d)", border: "none", color: "#fff", padding: "0.8rem", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem" }}
              >
                ✍ Start Writing
              </button>
              <button
                onClick={() => onSelectAction("scenes", createdChapter.id)}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0.8rem", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem" }}
              >
                ＋ Add Scenes
              </button>
              <button
                onClick={() => onSelectAction("stay", createdChapter.id)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", padding: "0.6rem", cursor: "pointer", fontSize: "0.82rem" }}
              >
                ← Stay in Outline
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
