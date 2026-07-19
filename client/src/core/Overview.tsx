import { useState, useEffect } from "react";
import { useWorkspaceStore } from "./store/WorkspaceStore";
import { Card, Button, ProgressBar } from "../components/ui";

interface ProjectData {
  id: string;
  name: string;
  path: string;
  manifest: {
    created: string;
    writing_mode: string;
  };
  targetWordCount?: number;
  coverImage?: string | null;
  description?: string;
}

interface OverviewProps {
  project: ProjectData;
  chapters: any[];
  scenes: any[];
  entities?: any[];
  onContinueWriting: () => void;
  onImportManuscript?: () => void;
  projects?: any[];
  onLoadProject?: (projectName: string) => Promise<void>;
  onBackToDashboard: () => void;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  // Handle SQLite datetime output format (YYYY-MM-DD HH:MM:SS) if it lacks 'T'
  const normalizedStr = dateStr.includes(' ') && !dateStr.includes('T')
    ? dateStr.replace(' ', 'T')
    : dateStr;
  
  const diff = Date.now() - new Date(normalizedStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(normalizedStr).toLocaleDateString();
}

// Visual Cover Generator helper
function generateCoverSVG(name: string, template: string) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase();
  const gradients: Record<string, string[]> = {
    fantasy: ["#1e1b4b", "#311042", "#7c3aed"],
    romance: ["#881337", "#4c0519", "#db2777"],
    scifi: ["#022c22", "#064e3b", "#06b6d4"],
    mystery: ["#18181b", "#09090b", "#4b5563"],
    blank: ["#0f172a", "#1e293b", "#3b82f6"]
  };
  const colors = gradients[template] || gradients.blank;
  
  return (
    <svg className="project-cover-placeholder" viewBox="0 0 160 220" style={{ width: '100%', height: '100%', borderRadius: '8px' }}>
      <defs>
        <linearGradient id={`grad-${initials}-${template}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="50%" stopColor={colors[1]} />
          <stop offset="100%" stopColor={colors[2]} />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill={`url(#grad-${initials}-${template})`} />
      <rect x="8" y="8" width="144" height="204" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1.5" />
      <text x="50%" y="42%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="24" fontFamily="serif" fontWeight="bold" letterSpacing="0.05em">
        {initials}
      </text>
      <text x="50%" y="70%" dominantBaseline="middle" textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="9" fontFamily="sans-serif" fontWeight="600">
        {name.length > 18 ? name.slice(0, 16) + '...' : name}
      </text>
      <text x="50%" y="82%" dominantBaseline="middle" textAnchor="middle" fill="#f5c542" fontSize="7" fontFamily="sans-serif" letterSpacing="0.1em" fontWeight="bold">
        {(template || 'Novel').toUpperCase()}
      </text>
    </svg>
  );
}

export default function Overview({
  project,
  chapters,
  scenes,
  entities = [],
  onContinueWriting,
  onImportManuscript,
  projects = [],
  onLoadProject,
  onBackToDashboard
}: OverviewProps) {
  const { setActiveTab } = useWorkspaceStore();

  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");

  const [dismissedChecklist, setDismissedChecklist] = useState(() => {
    return localStorage.getItem(`aevorin_dismissed_checklist_${project.id}`) === "true";
  });

  const checks = [
    true,
    entities?.some(e => e.type === "character") || false,
    scenes?.some(s => s.word_count > 0) || false,
    localStorage.getItem(`aevorin_backup_created_${project.id}`) === "true",
    localStorage.getItem(`aevorin_exported_${project.id}`) === "true"
  ];
  
  const completed = checks.filter(Boolean).length;
  const pct = Math.round((completed / 5) * 100);

  // Fetch real project version history (Sessions Log)
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/projects/${project.id}/history`);
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [project.id]);

  const totalWords = scenes.reduce((sum: number, sc: any) => sum + (sc.word_count || 0), 0);
  
  // Custom metrics
  const todayWords = Math.min(totalWords, 1250); // mock today's progress
  const todayGoal = 2000;
  const progressPercent = Math.min(Math.round((todayWords / todayGoal) * 100), 100);
  const streakDays = 12;

  // Retrieve last edited scene details
  const lastScene = scenes
    .filter((s: any) => s.updated_at)
    .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

  const currentChapterLabel = lastScene
    ? (() => {
        const chap = chapters.find((c: any) => c.id === lastScene.chapter_id);
        return chap ? `Chapter ${chap.order_index + 1}: ${chap.title}` : "Unassigned Chapter";
      })()
    : chapters[0] ? `Chapter 1: ${chapters[0].title}` : "Chapter 1: The Outset";

  const currentSceneLabel = lastScene ? lastScene.title : "Scene 1: Introduction";

  const lastEditedTime = lastScene 
    ? `Last written: ${timeAgo(lastScene.updated_at)}` 
    : "Last written: Yesterday";

  // Create new chapter handler
  const handleCreateChapter = async (title: string) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      });
      if (res.ok) {
        setActiveTab("manuscript");
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddChapter = () => {
    setNewChapterTitle(`Chapter ${chapters.length + 1}`);
    setShowChapterModal(true);
  };

  // Filter other projects for the carousel swapper
  const otherProjects = projects
    .filter(p => p.id !== project.id)
    .slice(0, 4);

  // --- Analytical Calculations for Authorlytica Features ---
  
  // Calculate Calendar Heatmap (Last 28 Days contribution block grid)
  const getHeatmapGrid = () => {
    const grid = [];
    const now = new Date();
    
    // Generate last 28 days dates starting from today back to 27 days ago
    for (let i = 27; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateString = date.toISOString().split('T')[0];
      
      // Sum words written on this calendar date
      const dailyWords = history
        .filter((h: any) => {
          const itemDate = h.created_at.split(' ')[0] || h.created_at.split('T')[0];
          return itemDate === dateString;
        })
        .reduce((sum: number, h: any) => sum + (h.word_count || 0), 0);

      // Map word counts to contribution color opacity scales
      let level = 0;
      if (dailyWords > 0) {
        if (dailyWords <= 100) level = 1;
        else if (dailyWords <= 300) level = 2;
        else if (dailyWords <= 800) level = 3;
        else level = 4;
      }

      grid.push({
        date: dateString,
        words: dailyWords,
        level
      });
    }
    return grid;
  };

  // Calculate Weekly Progress Chart relative bar heights (last 7 days)
  const getWeeklyProgressBars = () => {
    const bars = [];
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateString = date.toISOString().split('T')[0];
      const dayLabel = weekdays[date.getDay()];

      const dailyWords = history
        .filter((h: any) => {
          const itemDate = h.created_at.split(' ')[0] || h.created_at.split('T')[0];
          return itemDate === dateString;
        })
        .reduce((sum: number, h: any) => sum + (h.word_count || 0), 0);

      bars.push({
        label: dayLabel,
        words: dailyWords
      });
    }
    
    const maxWords = Math.max(...bars.map(b => b.words), 200); // base height relative divisor
    return bars.map(b => ({
      ...b,
      percent: Math.min(Math.round((b.words / maxWords) * 100), 100)
    }));
  };

  const heatmapBlocks = getHeatmapGrid();
  const weeklyBars = getWeeklyProgressBars();

  // Return empty notebook state if no chapters are present
  if (chapters.length === 0) {
    return (
      <div className="calm-studio-dashboard">
        <header className="calm-header-nav animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button className="calm-nav-btn" onClick={onBackToDashboard} aria-label="Go back to Library">← Library</button>
            <span className="calm-header-logo">AEVORIN</span>
          </div>
        </header>
        <div className="calm-empty-state-container">
          <div className="calm-empty-state-content animate-fade-in">
            <span className="calm-logo-large">⚔ AEVORIN ⚔</span>
            <h2>Every great story begins with a blank page.</h2>
            <p>Initialize your portable manuscript and begin crafting your worlds.</p>
            
            <div className="calm-empty-actions">
              <Button onClick={handleAddChapter} className="btn-primary">
                + Begin a New Story
              </Button>
              {onImportManuscript && (
                <Button onClick={onImportManuscript} className="btn-secondary">
                  Import Existing Manuscript
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="calm-studio-dashboard animate-fade-in">
      {/* Top Header Row Navigation */}
      <header className="calm-header-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button className="calm-nav-btn" onClick={onBackToDashboard} aria-label="Go back to Library">← Library</button>
          <span className="calm-header-logo">AEVORIN</span>
        </div>
        <div className="calm-header-actions">
          <button className="calm-nav-btn" onClick={() => setActiveTab("story")} aria-label="Search manuscript">🔍 Search</button>
          <button className="calm-nav-btn accent" onClick={handleAddChapter}>+ New Story</button>
          <button className="calm-nav-btn" onClick={() => setActiveTab("help")} aria-label="Sanctuary settings">⚙ Settings</button>
        </div>
      </header>

      {/* Hero Welcome Greetings */}
      <div className="calm-hero-greetings animate-slide-up">
        <h1 className="calm-author-title">Good evening, Zubair.</h1>
        <p className="calm-author-subtitle">Your worlds are waiting. Continue the story you started.</p>
      </div>

      {/* Prominent Onboarding Checklist Card */}
      {!dismissedChecklist && (
        <Card className="calm-onboarding-card animate-slide-up" style={{
          background: "rgba(30, 27, 75, 0.4)",
          border: "1px solid rgba(129, 140, 248, 0.2)",
          marginBottom: "1.5rem",
          padding: "1.5rem",
          position: "relative",
          maxWidth: "860px",
          margin: "0 auto 2rem auto"
        }}>
          <button 
            onClick={() => {
              localStorage.setItem(`aevorin_dismissed_checklist_${project.id}`, "true");
              setDismissedChecklist(true);
            }} 
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "1.25rem",
              fontWeight: "bold"
            }}
            title="Dismiss Checklist"
          >
            ×
          </button>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ fontSize: "1.5rem" }}>✨</span>
            <div>
              <h4 style={{ margin: 0, fontSize: "1.05rem", fontFamily: "Plus Jakarta Sans, sans-serif", color: "#fff" }}>First-Run Onboarding Checklist</h4>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>Complete these 5 core writing tasks to fully experience AEVORIN.</p>
            </div>
          </div>

          <div className="onboarding-progress-row" style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.2rem" }}>
            <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #6366f1, #818cf8)", borderRadius: "3px" }} />
            </div>
            <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-secondary)" }}>{completed}/5 completed ({pct}%)</span>
          </div>

          <div className="onboarding-tasks-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem" }}>
              <span style={{ color: checks[0] ? "#34d399" : "#64748b", fontWeight: "bold" }}>{checks[0] ? "✓" : "○"}</span>
              <span style={{ textDecoration: checks[0] ? "line-through" : "none", color: checks[0] ? "var(--text-muted)" : "var(--text-secondary)" }}>1. Create/Load Project Workspace</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem" }}>
              <span style={{ color: checks[1] ? "#34d399" : "#64748b", fontWeight: "bold" }}>{checks[1] ? "✓" : "○"}</span>
              <span style={{ textDecoration: checks[1] ? "line-through" : "none", color: checks[1] ? "var(--text-muted)" : "var(--text-secondary)" }}>2. Create a Character Bible Profile</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem" }}>
              <span style={{ color: checks[2] ? "#34d399" : "#64748b", fontWeight: "bold" }}>{checks[2] ? "✓" : "○"}</span>
              <span style={{ textDecoration: checks[2] ? "line-through" : "none", color: checks[2] ? "var(--text-muted)" : "var(--text-secondary)" }}>3. Write first scene in Editor</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem" }}>
              <span style={{ color: checks[3] ? "#34d399" : "#64748b", fontWeight: "bold" }}>{checks[3] ? "✓" : "○"}</span>
              <span style={{ textDecoration: checks[3] ? "line-through" : "none", color: checks[3] ? "var(--text-muted)" : "var(--text-secondary)" }}>4. Save Backup Snapshot</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", gridColumn: "span 2" }}>
              <span style={{ color: checks[4] ? "#34d399" : "#64748b", fontWeight: "bold" }}>{checks[4] ? "✓" : "○"}</span>
              <span style={{ textDecoration: checks[4] ? "line-through" : "none", color: checks[4] ? "var(--text-muted)" : "var(--text-secondary)" }}>5. Compile manuscript inside Compiler tab</span>
            </div>
          </div>
        </Card>
      )}

      {/* Primary Layout Columns: Hero Book vs Metrics stack */}
      <div className="calm-main-grid animate-slide-up">
        
        {/* Left Side: Featured Book Cover Card & Sessions Log */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          <Card className="calm-featured-book-card">
            <div className="calm-book-flex-layout">
              {/* Visual Book Spine Cover */}
              <div className="calm-book-cover-spine">
                {project.coverImage ? (
                  <img src={project.coverImage} alt="Book cover art" />
                ) : generateCoverSVG(project.name, project.manifest?.writing_mode || "blank")}
              </div>

              {/* Book Details */}
              <div className="calm-book-details">
                <span className="calm-tag-genre">{(project.manifest?.writing_mode || "Novel").toUpperCase()}</span>
                <h2 className="calm-book-title">{project.name}</h2>
                
                <div className="calm-chapter-resume-details">
                  <span className="calm-chapter-indicator">{currentChapterLabel}</span>
                  <span className="calm-scene-indicator">{currentSceneLabel}</span>
                </div>

                <div className="calm-book-footer-stats">
                  <span className="calm-last-written">{lastEditedTime}</span>
                  <span className="calm-total-words">{totalWords.toLocaleString()} words total</span>
                </div>

                <Button className="calm-continue-btn" onClick={onContinueWriting}>
                  Continue Writing →
                </Button>
              </div>
            </div>
          </Card>

          {/* Sessions Log Card */}
          <Card className="calm-studio-card">
            <h3>Sessions Log</h3>
            <div className="calm-sessions-log-container">
              {loading ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading log history...</p>
              ) : history.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No session checkpoints committed yet. Keep writing!</p>
              ) : (
                <div className="calm-sessions-log-list" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "250px", overflowY: "auto" }}>
                  {history.map((h) => (
                    <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.015)", padding: "0.6rem 0.85rem", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.03)" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>
                          +{h.word_count || 0} words <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>on</span> {h.scene_title || "Draft"}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{h.summary || "autosave checkpoint"}</span>
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{timeAgo(h.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

        </div>

        {/* Right Side: Progress Trackers & Writing Rhythm Analytics */}
        <div className="calm-metrics-column">
          
          {/* Today's Writing Progress */}
          <Card className="calm-progress-card">
            <h3>Today's Writing</h3>
            <div className="calm-progress-bar-row">
              <div className="calm-progress-labels">
                <span>{todayWords.toLocaleString()} / {todayGoal.toLocaleString()} words</span>
                <span>🔥 {streakDays} day streak</span>
              </div>
              <ProgressBar percent={progressPercent} />
            </div>
            
            {/* Last session resume trigger */}
            <div className="calm-last-session-resume">
              <p>Last session: <strong>842 words</strong> written</p>
              <button onClick={onContinueWriting} className="calm-resume-small-btn">Resume</button>
            </div>
          </Card>

          {/* Writing Rhythm Heatmap Calendar (GitHub Contribution Style) */}
          <Card className="calm-progress-card">
            <h3>Writing Rhythm</h3>
            <div className="calm-heatmap-wrapper" style={{ marginTop: "1rem" }}>
              <div className="calm-heatmap-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px", width: "100%", maxWidth: "250px", margin: "0 auto 1rem auto" }}>
                {heatmapBlocks.map((block, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      aspectRatio: "1",
                      borderRadius: "3px",
                      background: block.level === 0 ? "rgba(255,255,255,0.03)" :
                                  block.level === 1 ? "rgba(124,58,237,0.25)" :
                                  block.level === 2 ? "rgba(124,58,237,0.5)" :
                                  block.level === 3 ? "rgba(124,58,237,0.75)" :
                                  "rgba(124,58,237,1)",
                      border: "1px solid rgba(255,255,255,0.02)"
                    }}
                    title={`${block.date}: ${block.words} words`}
                  />
                ))}
              </div>
              <div className="calm-heatmap-labels" style={{ display: "flex", justifyContent: "space-between", maxWidth: "250px", margin: "0 auto", fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
              {scenes.reduce((sum, s) => sum + (s.word_count || 0), 0) === 0 && (
                <div style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.85rem", fontStyle: "italic", borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "0.5rem" }}>
                  Write 100 words today to light up your rhythm map!
                </div>
              )}
            </div>
          </Card>

          {/* Weekly Bar Chart Progress */}
          <Card className="calm-progress-card">
            <h3>Weekly Rhythm</h3>
            <div className="calm-bar-chart-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: "100px", marginTop: "1rem", padding: "0 0.5rem" }}>
              {weeklyBars.map((bar, idx) => (
                <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: "0.5rem" }}>
                  <div style={{ width: "12px", height: "80px", background: "rgba(255,255,255,0.03)", borderRadius: "6px", position: "relative", overflow: "hidden" }}>
                    <div 
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: `${bar.percent}%`,
                        background: "linear-gradient(180deg, #a78bfa 0%, #7c3aed 100%)",
                        borderRadius: "6px"
                      }}
                      title={`${bar.words} words`}
                    />
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>{bar.label}</span>
                </div>
              ))}
            </div>
          </Card>

        </div>

      </div>

      {/* Horizontal Carousel: Recent Worlds library */}
      {otherProjects.length > 0 && (
        <div className="calm-recent-worlds-section animate-slide-up">
          <h3 className="calm-section-title">Recent Worlds</h3>
          <div className="calm-recent-worlds-carousel">
            {otherProjects.map((p) => (
              <Card key={p.id} className="calm-recent-book-card" onClick={() => onLoadProject && onLoadProject(p.name)}>
                <div className="calm-recent-cover">
                  {p.coverImage ? (
                    <img src={p.coverImage} alt={p.name} />
                  ) : generateCoverSVG(p.name, p.manifest?.writing_mode || "blank")}
                </div>
                <div className="calm-recent-details">
                  <h4>{p.name}</h4>
                  <span>Active recently</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Custom Chapter Creation Modal */}
      {showChapterModal && (
        <div className="calm-modal-overlay" style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.75)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999
        }}>
          <Card className="calm-creation-dialog animate-scale-in" style={{ maxWidth: "450px", width: "90%", margin: "0 auto" }}>
            <h3 style={{ margin: 0, fontFamily: "var(--font-editor)", fontSize: "1.5rem" }}>Add New Chapter</h3>
            <div className="calm-creation-form" style={{ marginTop: "1rem" }}>
              <div className="form-group">
                <label>Chapter Title</label>
                <input
                  type="text"
                  placeholder="Enter chapter title"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: "flex-end" }}>
                <Button type="button" className="btn-secondary" onClick={() => setShowChapterModal(false)}>Cancel</Button>
                <Button type="button" className="btn-primary" onClick={async () => {
                  if (!newChapterTitle.trim()) return;
                  await handleCreateChapter(newChapterTitle.trim());
                }}>Create Chapter</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
