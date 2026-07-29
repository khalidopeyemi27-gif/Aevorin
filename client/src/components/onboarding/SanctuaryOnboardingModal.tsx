import React, { useState, useEffect } from "react";
import { usePreferences } from "../../core/preferences/PreferencesContext";
import { ManuscriptRepository } from "../../database/repositories/manuscriptRepository";
import { EntityRepository } from "../../database/repositories/entityRepository";

interface SanctuaryOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (projectData?: { id: string; title: string; style: string }) => void;
}

export function SanctuaryOnboardingModal({
  isOpen,
  onClose,
  onComplete
}: SanctuaryOnboardingModalProps) {
  const { preferences, updatePreferences } = usePreferences();

  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState("Writer");
  const [creationType, setCreationType] = useState("Novel");
  const [writingStyle, setWritingStyle] = useState<"planner" | "balanced" | "discovery">("balanced");
  const [dailyGoal, setDailyGoal] = useState<number>(1000);
  const [selectedTheme, setSelectedTheme] = useState<string>("midnight");

  // New Project Fields
  const [projectTitle, setProjectTitle] = useState("");
  const [projectGenre, setProjectGenre] = useState("Fantasy");
  const [projectDescription, setProjectDescription] = useState("");
  const [starterOption, setStarterOption] = useState<"blank" | "starter" | "import">("starter");
  const [importText, setImportText] = useState("");

  // Greeting time
  const [greetingTime, setGreetingTime] = useState("afternoon");

  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setGreetingTime("morning");
    else if (hr < 18) setGreetingTime("afternoon");
    else setGreetingTime("evening");

    const savedName = localStorage.getItem("aevorin_user_name") || "Writer";
    setUserName(savedName);
  }, []);

  if (!isOpen) return null;

  const handleFinishOnboarding = async (option: "blank" | "starter" | "import") => {
    try {
      // 1. Save preferences
      updatePreferences({
        theme: selectedTheme
      });
      localStorage.setItem("aevorin_daily_goal", dailyGoal.toString());
      localStorage.setItem("aevorin_writing_style", writingStyle);
      localStorage.setItem("aevorin_onboarding_completed", "true");

      const title = projectTitle.trim() || (creationType === "Novel" ? "Untitled Novel" : `My ${creationType}`);
      const now = Date.now();
      const projId = `proj_${now}`;

      // Create initial project chapter & scene
      const ch = await ManuscriptRepository.createChapter(projId, "Chapter 1: The Beginning");
      const sc = await ManuscriptRepository.createScene(projId, ch.id, "Scene 1");

      if (option === "starter") {
        // Pre-seed a rich story starter
        await EntityRepository.createEntity({
          projectId: projId,
          type: "character",
          title: "Protagonist",
          summary: "The main character of this journey, driven by ambition and hidden resolve."
        });
        await EntityRepository.createEntity({
          projectId: projId,
          type: "location",
          title: "The Citadel",
          summary: "An ancient stronghold where the fate of the realm hangs in the balance."
        });
      } else if (option === "import" && importText.trim()) {
        const words = importText.trim().split(/\s+/).filter(Boolean).length;
        await ManuscriptRepository.saveDraft(sc.id, importText.trim(), `<p>${importText.trim()}</p>`, words);
      }

      onComplete({ id: projId, title, style: writingStyle });
      onClose();
    } catch (err) {
      console.error("[Sanctuary Onboarding Error]", err);
      onClose();
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(10, 8, 18, 0.88)",
      backdropFilter: "blur(12px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 99999,
      padding: "1rem"
    }}>
      <div
        className="animate-scale-in"
        style={{
          background: "#151424",
          border: "1px solid rgba(159, 138, 208, 0.3)",
          borderRadius: "20px",
          maxWidth: "560px",
          width: "100%",
          padding: "2.25rem",
          boxShadow: "0 25px 60px rgba(0,0,0,0.8)",
          color: "#fff",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Top Step Progress Bar */}
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.75rem" }}>
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: "4px",
                borderRadius: "2px",
                background: s <= step ? "linear-gradient(90deg, #9f8ad0, #e08e6d)" : "rgba(255,255,255,0.1)",
                transition: "all 0.3s ease"
              }}
            />
          ))}
        </div>

        {/* STEP 1: Welcome & Sanctuary Greeting */}
        {step === 1 && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: "2.8rem", marginBottom: "1rem" }}>🌙</div>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.75rem", background: "linear-gradient(135deg, #fff, #9f8ad0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Good {greetingTime}, {userName}.
            </h2>
            <p style={{ color: "#cbd5e1", fontSize: "1rem", lineHeight: 1.6, maxWidth: "420px", margin: "0 auto 1.5rem auto" }}>
              Welcome to AEVORIN. Every great story begins with a single decision. Let's set up your writing sanctuary.
            </p>
            <div style={{ fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic", marginBottom: "2rem" }}>
              "Nothing you write here needs to be perfect. Just begin."
            </div>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button
                onClick={onClose}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "#94a3b8",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  padding: "0.75rem 1.5rem",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Skip for Now
              </button>
              <button
                onClick={() => setStep(2)}
                style={{
                  background: "linear-gradient(135deg, #9f8ad0, #7c3aed)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "0.75rem 1.75rem",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  boxShadow: "0 8px 20px rgba(124, 58, 237, 0.4)",
                  cursor: "pointer"
                }}
              >
                ✨ Create My Sanctuary
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: What are you creating today? */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: "1.35rem", fontWeight: 800, marginBottom: "0.5rem" }}>
              What are you creating today?
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
              Select your story format so AEVORIN can optimize your workspace defaults.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "1.75rem" }}>
              {[
                { label: "Novel", icon: "📖", desc: "Long-form fiction & sagas" },
                { label: "Light Novel", icon: "📚", desc: "Episodic character stories" },
                { label: "Screenplay", icon: "🎭", desc: "Scene & script format" },
                { label: "Short Story", icon: "📜", desc: "Focused single-concept piece" },
                { label: "Worldbuilding", icon: "🌍", desc: "Lore & codex notes" },
                { label: "Something Else", icon: "✨", desc: "Custom freeform writing" },
              ].map((item) => (
                <div
                  key={item.label}
                  onClick={() => setCreationType(item.label)}
                  style={{
                    background: creationType === item.label ? "rgba(159, 138, 208, 0.18)" : "rgba(255,255,255,0.04)",
                    border: creationType === item.label ? "2px solid #9f8ad0" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    padding: "0.9rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ fontSize: "1.4rem", marginBottom: "0.25rem" }}>{item.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#fff" }}>{item.label}</div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{item.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>Back</button>
              <button onClick={() => setStep(3)} style={{ background: "#9f8ad0", color: "#fff", border: "none", borderRadius: "8px", padding: "0.6rem 1.4rem", fontWeight: 700, cursor: "pointer" }}>Next →</button>
            </div>
          </div>
        )}

        {/* STEP 3: Writing Style */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: "1.35rem", fontWeight: 800, marginBottom: "0.5rem" }}>
              How do you like to write?
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
              AEVORIN adapts tool visibility based on your creative workflow.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1.75rem" }}>
              {[
                { id: "planner", icon: "🏰", title: "Planner", text: "I plan everything first. (Story Room, Timeline & Plot Board visible)" },
                { id: "balanced", icon: "✍️", title: "Balanced", text: "I outline a little. (Manuscript + Outline Sidebar ready)" },
                { id: "discovery", icon: "⚡", title: "Discovery / Pantser", text: "I discover the story as I write. (Immediate clean manuscript focus)" },
              ].map((styleItem) => (
                <div
                  key={styleItem.id}
                  onClick={() => setWritingStyle(styleItem.id as any)}
                  style={{
                    background: writingStyle === styleItem.id ? "rgba(159, 138, 208, 0.18)" : "rgba(255,255,255,0.04)",
                    border: writingStyle === styleItem.id ? "2px solid #9f8ad0" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    padding: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ fontSize: "1.6rem" }}>{styleItem.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>{styleItem.title}</div>
                    <div style={{ fontSize: "0.78rem", color: "#94a3b8", lineHeight: 1.4 }}>{styleItem.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => setStep(2)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>Back</button>
              <button onClick={() => setStep(4)} style={{ background: "#9f8ad0", color: "#fff", border: "none", borderRadius: "8px", padding: "0.6rem 1.4rem", fontWeight: 700, cursor: "pointer" }}>Next →</button>
            </div>
          </div>
        )}

        {/* STEP 4: Daily Goal */}
        {step === 4 && (
          <div>
            <h3 style={{ fontSize: "1.35rem", fontWeight: 800, marginBottom: "0.5rem" }}>
              What's your daily target goal?
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
              Set an optional starting pace. You can change this anytime from the top bar.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "1.75rem" }}>
              {[
                { val: 300, label: "300 words/day", desc: "Gentle daily habit" },
                { val: 500, label: "500 words/day", desc: "Steady progress pace" },
                { val: 1000, label: "1,000 words/day", desc: "Focused writer pace" },
                { val: 0, label: "No goal yet", desc: "Write without pressure" },
              ].map((g) => (
                <div
                  key={g.val}
                  onClick={() => setDailyGoal(g.val)}
                  style={{
                    background: dailyGoal === g.val ? "rgba(159, 138, 208, 0.18)" : "rgba(255,255,255,0.04)",
                    border: dailyGoal === g.val ? "2px solid #9f8ad0" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    padding: "1rem",
                    cursor: "pointer",
                    textAlign: "center"
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff", marginBottom: "0.2rem" }}>{g.label}</div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{g.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => setStep(3)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>Back</button>
              <button onClick={() => setStep(5)} style={{ background: "#9f8ad0", color: "#fff", border: "none", borderRadius: "8px", padding: "0.6rem 1.4rem", fontWeight: 700, cursor: "pointer" }}>Next →</button>
            </div>
          </div>
        )}

        {/* STEP 5: Choose Atmosphere */}
        {step === 5 && (
          <div>
            <h3 style={{ fontSize: "1.35rem", fontWeight: 800, marginBottom: "0.5rem" }}>
              Choose your sanctuary atmosphere
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
              Pick a theme that feels warm, immersive, and inspiring to you.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "1.75rem" }}>
              {[
                { id: "midnight", label: "🌙 Midnight Violet", bg: "#100d1d" },
                { id: "sepia", label: "📜 Warm Sepia", bg: "#1b1612" },
                { id: "paper", label: "☀️ Daylight Paper", bg: "#f7f5f0", text: "#1e293b" },
                { id: "forest", label: "🌲 Forest Green", bg: "#0b1612" },
                { id: "night", label: "⚫ Minimal Dark Slate", bg: "#111827" },
              ].map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTheme(t.id)}
                  style={{
                    background: t.bg,
                    border: selectedTheme === t.id ? "2px solid #e08e6d" : "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "12px",
                    padding: "1rem",
                    cursor: "pointer",
                    color: t.text || "#fff"
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{t.label}</div>
                  <div style={{ fontSize: "0.72rem", opacity: 0.7, marginTop: "0.25rem" }}>Live Preview</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => setStep(4)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>Back</button>
              <button onClick={() => setStep(6)} style={{ background: "#9f8ad0", color: "#fff", border: "none", borderRadius: "8px", padding: "0.6rem 1.4rem", fontWeight: 700, cursor: "pointer" }}>Next →</button>
            </div>
          </div>
        )}

        {/* STEP 6: 1-Click Story Starter (AEVORIN Signature) */}
        {step === 6 && (
          <div>
            <h3 style={{ fontSize: "1.35rem", fontWeight: 800, marginBottom: "0.5rem" }}>
              Create your first story with 1 click
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "0.88rem", marginBottom: "1.25rem" }}>
              What story has been waiting for you?
            </p>

            <div style={{ marginBottom: "1rem" }}>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Story Title (e.g. The Dark Kingdom)"
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "0.9rem",
                  marginBottom: "0.65rem"
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {[
                { id: "starter", icon: "🏰", title: "Story Starter (Recommended)", desc: "Includes pre-built character profiles, location, timeline & chapter structure." },
                { id: "blank", icon: "✍️", title: "Blank Manuscript", desc: "Start with a clean, empty canvas." },
                { id: "import", icon: "📥", title: "Import Existing Novel", desc: "Paste or import text from another writing app." },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setStarterOption(opt.id as any)}
                  style={{
                    background: starterOption === opt.id ? "rgba(159, 138, 208, 0.18)" : "rgba(255,255,255,0.04)",
                    border: starterOption === opt.id ? "2px solid #9f8ad0" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px",
                    padding: "0.85rem 1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.85rem",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ fontSize: "1.4rem" }}>{opt.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#fff" }}>{opt.title}</div>
                    <div style={{ fontSize: "0.74rem", color: "#94a3b8" }}>{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {starterOption === "import" && (
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste your existing manuscript text here..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.85rem",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "0.82rem",
                  marginBottom: "1rem"
                }}
              />
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={() => setStep(5)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>Back</button>
              <button
                onClick={() => handleFinishOnboarding(starterOption)}
                style={{
                  background: "linear-gradient(135deg, #9f8ad0, #7c3aed)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "0.75rem 1.75rem",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  boxShadow: "0 8px 20px rgba(124, 58, 237, 0.4)",
                  cursor: "pointer"
                }}
              >
                🚀 Begin Writing
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
