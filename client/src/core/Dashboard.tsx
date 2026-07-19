import React, { useState } from "react";
import { Card, Button } from "../components/ui";

interface ProjectManifest {
  created: string;
  writing_mode: string;
  description?: string;
  chaptersCount?: number;
  wordsCount?: number;
  lastOpened?: string;
  archived?: boolean;
}

interface ProjectData {
  id: string;
  name: string;
  path: string;
  manifest: ProjectManifest;
  isValid?: boolean;
  errors?: string[];
  targetWordCount?: number;
  coverImage?: string | null;
  description?: string;
}

interface DashboardProps {
  projects: ProjectData[];
  activeProjectId: string | null;
  onCreateProject: (name: string, description: string, template: string, targetWordCount: number, coverImage: string | null) => Promise<void>;
  onLoadProject: (name: string) => Promise<void>;
  onSeedExample: () => void;
  onSeedAbyssalMonarch?: () => void;
  onDeleteProject: (name: string) => Promise<void>;
  onRenameProject: (name: string, newName: string) => Promise<void>;
  onDuplicateProject: (name: string, newName: string) => Promise<void>;
  onArchiveProject: (name: string, archive: boolean) => Promise<void>;
  onCleanupSamples: () => Promise<void>;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
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

// Visual Cover Generator helper (with LocalStorage cache check)
function generateCoverSVG(name: string, template: string, projectId?: string): string {
  const cacheKey = projectId ? `aevorin_cover_svg_${projectId}` : null;
  if (cacheKey) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;
  }

  // Determine cover color based on title names or template settings to match user's screenshot
  let coverColor = "#5a5d64"; // Default charcoal grey
  const lowerName = name.toLowerCase();

  if (lowerName.includes("human") || lowerName.includes("first") || lowerName.includes("return")) {
    coverColor = "#b91c1c"; // Red cover
  } else if (lowerName.includes("dreamer") || lowerName.includes("dream")) {
    coverColor = "#123c8f"; // Blue cover
  } else if (template === "fantasy") {
    coverColor = "#b91c1c"; // Red
  } else if (template === "romance") {
    coverColor = "#831032"; // Deep burgundy
  } else if (template === "scifi") {
    coverColor = "#123c8f"; // Blue
  } else if (template === "mystery") {
    coverColor = "#1e293b"; // Dark slate
  }

  const cleanTitle = name.toUpperCase();
  const authorName = (localStorage.getItem("aevorin_author_name") || "Casual Progenitor").toUpperCase();

  const svg = `<svg className="project-cover-placeholder" viewBox="0 0 160 230" style="width: 100%; height: 100%; border-radius: 8px; box-shadow: -5px 10px 20px rgba(0,0,0,0.45);">
    <!-- Base Cover Color -->
    <rect width="100%" height="100%" fill="${coverColor}" />

    <!-- Spine Shadow depth simulation overlay (Simulates realistic page folds) -->
    <rect x="0" width="10" height="100%" fill="black" fill-opacity="0.3" />
    <line x1="10" y1="0" x2="10" y2="100%" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />
    <rect x="10" width="3" height="100%" fill="black" fill-opacity="0.1" />

    <!-- Title wrapping using foreignObject to prevent layout break -->
    <foreignObject x="14" y="36" width="132" height="135">
      <div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: center; justify-content: center; height: 100%; text-align: center; color: #ffffff; font-family: 'Source Serif 4', 'Georgia', serif; font-size: 13.5px; font-weight: bold; line-height: 1.4; text-transform: uppercase; padding: 0 6px; overflow: hidden; letter-spacing: 0.02em;">
        ${cleanTitle}
      </div>
    </foreignObject>

    <!-- Author name in small text on bottom left -->
    <text x="14" y="212" fill="rgba(255,255,255,0.4)" font-size="7" font-family="sans-serif" font-weight="600" letter-spacing="0.05em">
      ${authorName}
    </text>
  </svg>`;

  if (cacheKey) {
    try {
      localStorage.setItem(cacheKey, svg);
    } catch (e) {
      console.warn("Storage quota exceeded, cover SVG not cached.");
    }
  }
  return svg;
}

function formatProjectTitle(name: string): string {
  if (name.includes("_Restore_")) {
    const parts = name.split("_Restore_");
    const baseName = parts[0];
    const timestampStr = parts[1];
    
    if (/^\d+$/.test(timestampStr)) {
      const date = new Date(parseInt(timestampStr, 10));
      const formattedDate = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      return `Restored - ${baseName} (${formattedDate})`;
    }
    return `Restored - ${baseName}`;
  }
  return name;
}

export default function Dashboard({
  projects,
  activeProjectId,
  onCreateProject,
  onLoadProject,
  onSeedExample,
  onSeedAbyssalMonarch,
  onDeleteProject,
  onRenameProject,
  onDuplicateProject,
  onArchiveProject,
  onCleanupSamples
}: DashboardProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeLibraryView, setActiveLibraryView] = useState<"books" | "create" | "import" | "archive">("books");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authorName, setAuthorName] = useState(() => localStorage.getItem("aevorin_author_name") || "Zubair");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [devModeEnabled, setDevModeEnabled] = useState(() => localStorage.getItem("aevorin_dev_mode") === "true");
  
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  React.useEffect(() => {
    // If we have projects, fetch activity for the most recent one
    const mostRecent = [...projects]
      .filter(p => !p.manifest?.archived)
      .sort((a, b) => {
        const aTime = a.manifest?.lastOpened ? new Date(a.manifest.lastOpened).getTime() : 0;
        const bTime = b.manifest?.lastOpened ? new Date(b.manifest.lastOpened).getTime() : 0;
        return bTime - aTime;
      })[0];
      
    if (mostRecent) {
      import("../lib/api").then(({ apiUrl }) => {
        fetch(apiUrl(`/api/projects/${mostRecent.id}/activity`))
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) setRecentActivities(data);
          })
          .catch(e => console.error(e));
      });
    }
  }, [projects]);

  const handleDevModeChange = (enabled: boolean) => {
    setDevModeEnabled(enabled);
    localStorage.setItem("aevorin_dev_mode", enabled ? "true" : "false");
  };

  const handleAuthorNameChange = (newName: string) => {
    setAuthorName(newName);
    localStorage.setItem("aevorin_author_name", newName);
    // Clear cover SVG cache keys so they regenerate with the new name
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("aevorin_cover_svg_")) {
        localStorage.removeItem(key);
        i--;
      }
    }
  };

  const [template, setTemplate] = useState("blank");
  const [targetWordCount, setTargetWordCount] = useState(80000);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  // Custom UI management states
  const [projectToDelete, setProjectToDelete] = useState<ProjectData | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  
  const [projectToRename, setProjectToRename] = useState<ProjectData | null>(null);
  const [renameNewName, setRenameNewName] = useState("");
  
  const [projectToDuplicate, setProjectToDuplicate] = useState<ProjectData | null>(null);
  const [duplicateNewName, setDuplicateNewName] = useState("");

  const [onboardingStep, setOnboardingStep] = useState(0);
  const [activeMenuProject, setActiveMenuProject] = useState<ProjectData | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onCreateProject(name.trim(), description.trim(), template, targetWordCount, coverImage);
      setName("");
      setDescription("");
      setTemplate("blank");
      setTargetWordCount(80000);
      setCoverImage(null);
      setIsCreating(false);
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };


  const sortedProjects = [...projects]
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const aTime = a.manifest?.lastOpened ? new Date(a.manifest.lastOpened).getTime() : 0;
      const bTime = b.manifest?.lastOpened ? new Date(b.manifest.lastOpened).getTime() : 0;
      return bTime - aTime;
    });

  const currentBook = sortedProjects.find(p => !p.manifest?.archived) || null;
  const otherActiveBooks = sortedProjects.filter(p => !p.manifest?.archived && p.id !== currentBook?.id);
  const archivedBooks = sortedProjects.filter(p => !!p.manifest?.archived);

  const renderBookCoverItem = (p: ProjectData) => {
    const isActive = p.id === activeProjectId;
    const coverSvg = p.coverImage ? null : generateCoverSVG(p.name, p.manifest?.writing_mode || "blank", p.id);
    
    if (p.isValid === false) {
      return (
        <div key={p.id} style={{ width: "100%", maxWidth: "160px", padding: "1rem", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "8px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: "1.5rem" }}>⚠️</div>
          <div style={{ fontSize: "0.8rem", color: "#ef4444", fontWeight: 700, margin: "0.5rem 0", textAlign: "center" }}>Corrupted</div>
          <button 
            onClick={(e) => { e.stopPropagation(); setProjectToDelete(p); setDeleteConfirmName(""); }}
            style={{ fontSize: "0.75rem", background: "rgba(239,68,68,0.2)", border: "none", color: "#ef4444", padding: "0.25rem 0.5rem", borderRadius: "4px", cursor: "pointer" }}
          >
            Remove
          </button>
        </div>
      );
    }

    return (
      <div 
        key={p.id || p.name} 
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "160px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          cursor: "pointer"
        }}
        onClick={() => onLoadProject(p.name)}
      >
        <div style={{
          position: "relative",
          width: "100%",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: isActive ? "0 0 15px #f5c542" : "-4px 8px 16px rgba(0,0,0,0.5)",
          border: isActive ? "2px solid #f5c542" : "2px solid transparent",
          transition: "transform 0.2s ease",
        }} className="calm-featured-book-cover">
          {p.coverImage ? (
            <img src={p.coverImage} alt={p.name} style={{ width: "100%", display: "block" }} />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: coverSvg || "" }} style={{ width: '100%', height: '100%', display: "block" }} />
          )}

          <button
            onClick={(e) => { e.stopPropagation(); setActiveMenuProject(p); }}
            style={{
              position: "absolute",
              top: "6px",
              right: "6px",
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "rgba(0, 0, 0, 0.6)",
              border: "none",
              color: "#e08e6d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
              zIndex: 5
            }}
          >
            ⋮
          </button>
        </div>

        <div style={{
          marginTop: "0.6rem",
          fontSize: "0.75rem",
          color: "rgba(255,255,255,0.45)",
          textAlign: "center",
          width: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}>
          {(p.manifest?.wordsCount || 0).toLocaleString()} words
        </div>
      </div>
    );
  };

  return (
    <div className="calm-launcher" style={{ background: "#333333", minHeight: "100vh" }}>
      {projects.length === 0 ? (
        <div className="calm-launcher-empty-container animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '2rem' }}>
          <Card className="calm-creation-dialog animate-scale-in" style={{ width: '100%', maxWidth: '520px', padding: '2.5rem', background: '#2d2d2d', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)', borderRadius: '16px' }}>
            
            {onboardingStep === 0 && (
              <div style={{ textAlign: 'center' }}>
                <span className="calm-logo-large" style={{ fontSize: '2rem', display: 'block', marginBottom: '1.5rem', letterSpacing: '0.15em', color: '#e08e6d', fontWeight: 800 }}>⚔ AEVORIN ⚔</span>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>Welcome to your sanctuary.</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                  A distraction-free, offline-first workspace designed exclusively for authors. Start writing your next story in seconds.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', alignItems: 'center' }}>
                  <Button onClick={() => setOnboardingStep(1)} className="btn-primary" style={{ width: '100%', minHeight: '44px', fontWeight: 600, background: '#9f8ad0', border: 'none' }}>
                    Write a New Story
                  </Button>
                  <button className="calm-onboarding-seed-link" onClick={onSeedExample} style={{ background: 'none', border: 'none', color: '#e08e6d', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, minHeight: '44px' }}>
                    Or load the 'Forgotten Kingdom' example template
                  </button>
                  {onSeedAbyssalMonarch && (
                    <button className="calm-onboarding-seed-link" onClick={onSeedAbyssalMonarch} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, minHeight: '44px', marginTop: '0.25rem' }}>
                      Or seed the 'Abyssal Monarch' fantasy outline
                    </button>
                  )}
                </div>
              </div>
            )}

            {onboardingStep === 1 && (
              <div>
                <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.5rem', fontWeight: 700 }}>What is your story's title?</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', marginBottom: '2rem' }}>Every great journey starts with a name. You can always change this later.</p>
                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <input
                    type="text"
                    placeholder="e.g. The Whispering Star"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                    style={{ width: '100%', padding: '0.85rem 1rem', background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '1rem', minHeight: '44px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && name.trim()) {
                        e.preventDefault();
                        setOnboardingStep(2);
                      }
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <Button className="btn-secondary" style={{ minHeight: '44px', minWidth: '80px' }} onClick={() => { setOnboardingStep(0); setName(""); }}>Back</Button>
                  <Button className="btn-primary" style={{ minHeight: '44px', minWidth: '100px', background: '#9f8ad0', border: 'none' }} disabled={!name.trim()} onClick={() => setOnboardingStep(2)}>Next</Button>
                </div>
              </div>
            )}

            {onboardingStep === 2 && (
              <div>
                <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.5rem', fontWeight: 700 }}>Choose your genre structure</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>This structures your acts and guides your pacing beats.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginBottom: '2rem', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                  {[
                    { id: 'blank', label: 'Blank Canvas', desc: 'No presets. A clean, empty book template.' },
                    { id: 'fantasy', label: 'Epic Fantasy', desc: 'Pre-seeds a three-act structure and character sheets.' },
                    { id: 'scifi', label: 'Sci-Fi Space Opera', desc: 'Sets up pacing check-points and lore log templates.' },
                    { id: 'mystery', label: 'Mystery / Thriller', desc: 'Includes clue tracking timelines and suspect dossiers.' },
                    { id: 'romance', label: 'Romance / Drama', desc: 'Pre-seeds dynamic character conflict pacing beats.' }
                  ].map((t) => (
                    <div 
                      key={t.id} 
                      onClick={() => setTemplate(t.id)} 
                      style={{
                        padding: '0.75rem 1rem',
                        background: template === t.id ? 'rgba(159, 138, 208, 0.12)' : 'rgba(255,255,255,0.02)',
                        border: template === t.id ? '1px solid #9f8ad0' : '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'border-color 0.2s, background 0.2s'
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: '0.9rem', color: template === t.id ? '#9f8ad0' : '#fff' }}>{t.label}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>{t.desc}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <Button className="btn-secondary" style={{ minHeight: '44px', minWidth: '80px' }} onClick={() => setOnboardingStep(1)}>Back</Button>
                  <Button className="btn-primary" style={{ minHeight: '44px', minWidth: '100px', background: '#9f8ad0', border: 'none' }} onClick={() => setOnboardingStep(3)}>Next</Button>
                </div>
              </div>
            )}

            {onboardingStep === 3 && (
              <div>
                <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.5rem', fontWeight: 700 }}>Choose your writing target</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', marginBottom: '2rem' }}>We partition local file allocations to support word tracking statistics.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
                  {[
                    { val: 20000, label: 'Novella', words: '20,000 words' },
                    { val: 50000, label: 'Short Novel', words: '50,000 words' },
                    { val: 80000, label: 'Full Novel', words: '80,000 words' }
                  ].map((w) => (
                    <div 
                      key={w.val} 
                      onClick={() => setTargetWordCount(w.val)} 
                      style={{
                        padding: '0.75rem 0.5rem',
                        background: targetWordCount === w.val ? 'rgba(159, 138, 208, 0.12)' : 'rgba(255,255,255,0.02)',
                        border: targetWordCount === w.val ? '1px solid #9f8ad0' : '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'border-color 0.2s, background 0.2s'
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: '0.88rem', color: '#fff' }}>{w.label}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#9f8ad0', fontWeight: 'bold' }}>{w.words}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <Button className="btn-secondary" style={{ minHeight: '44px', minWidth: '80px' }} onClick={() => setOnboardingStep(2)}>Back</Button>
                  <Button 
                    className="btn-primary" 
                    style={{ minHeight: '44px', minWidth: '130px', background: '#9f8ad0', border: 'none' }}
                    disabled={loading} 
                    onClick={async () => {
                      setLoading(true);
                      setError(null);
                      try {
                        await onCreateProject(name.trim(), description.trim(), template, targetWordCount, coverImage);
                        setName("");
                        setDescription("");
                        setTemplate("blank");
                        setOnboardingStep(0);
                      } catch (err: any) {
                        setError(err.message || "Failed to create project");
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    {loading ? "Creating..." : "Begin Writing ✦"}
                  </Button>
                </div>
              </div>
            )}

          </Card>
        </div>
      ) : (
        <div style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          background: "#1e1e1e",
          color: "#fff"
        }}>
          {/* ── Library Header ── */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1.25rem 1.5rem",
            background: "#1e1e1e",
            borderBottom: "1px solid rgba(255,255,255,0.05)"
          }}>
            <div>
              <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: "0.15rem" }}>Aevorin</div>
              <h1 style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#e08e6d",
                margin: 0,
                fontFamily: "'Source Serif 4', 'Georgia', serif",
                letterSpacing: "0.02em"
              }}>
                Library
              </h1>
            </div>
            <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
              <button 
                onClick={() => setSearchOpen(s => !s)}
                style={{ background: "none", border: "none", color: searchOpen ? "#e08e6d" : "rgba(255,255,255,0.45)", fontSize: "1.25rem", cursor: "pointer", padding: 0, transition: "color 0.2s" }}
                title="Search Stories"
              >
                🔍
              </button>
              <button 
                onClick={() => setSettingsOpen(true)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", fontSize: "1.25rem", cursor: "pointer", padding: 0 }}
                title="Settings"
              >
                ⚙️
              </button>
            </div>
          </div>

          {/* ── Search Bar (collapsible) ── */}
          {searchOpen && (
            <div style={{ padding: "0.75rem 1.5rem", background: "#181818", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "0.5rem" }}>
              <input 
                type="text"
                placeholder="Search stories by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: "0.6rem 1rem",
                  background: "#252525",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "0.9rem",
                  minHeight: "44px"
                }}
                autoFocus
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  style={{
                    padding: "0 1rem",
                    background: "rgba(255,255,255,0.06)",
                    border: "none",
                    borderRadius: "8px",
                    color: "rgba(255,255,255,0.6)",
                    cursor: "pointer",
                    fontSize: "0.85rem"
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* ── Section Navigation Tiles ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "0.75rem",
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid rgba(255,255,255,0.05)"
          }}>
            {([
              { id: "books",   icon: "📚", label: "Books",        desc: "Your stories" },
              { id: "create",  icon: "✦",  label: "Create Story", desc: "Start something new" },
              { id: "import",  icon: "📥", label: "Import Story",  desc: "Bring in a file" },
              { id: "archive", icon: "📦", label: "Archive",       desc: `${archivedBooks.length} stored` }
            ] as const).map((tile) => (
              <button
                key={tile.id}
                onClick={() => {
                  if (tile.id === "create") {
                    setName("");
                    setDescription("");
                    setTemplate("blank");
                    setTargetWordCount(80000);
                    setCoverImage(null);
                    setIsCreating(true);
                  } else {
                    setActiveLibraryView(tile.id);
                  }
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "0.25rem",
                  padding: "1rem 1.1rem",
                  background: activeLibraryView === tile.id && tile.id !== "create"
                    ? "rgba(224,142,109,0.10)"
                    : "rgba(255,255,255,0.03)",
                  border: activeLibraryView === tile.id && tile.id !== "create"
                    ? "1px solid rgba(224,142,109,0.3)"
                    : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "10px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.2s, border-color 0.2s"
                }}
              >
                <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>{tile.icon}</span>
                <span style={{
                  fontSize: "0.92rem",
                  fontWeight: 700,
                  color: activeLibraryView === tile.id && tile.id !== "create" ? "#e08e6d" : "#fff"
                }}>{tile.label}</span>
                <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>{tile.desc}</span>
              </button>
            ))}
          </div>

          {/* ── Main Content Area ── */}
          <div style={{ flex: 1, padding: "1.5rem", maxWidth: "600px", margin: "0 auto", width: "100%", paddingBottom: "6rem" }}>

            {/* DASHBOARD HOME VIEW */}
            {activeLibraryView === "books" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
                {/* 1. Continue Writing (Massive) */}
                {currentBook && (
                  <div style={{ marginBottom: "var(--spacing-2)" }}>
                    <div style={{ fontSize: "var(--font-size-xs)", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: "var(--spacing-3)" }}>Continue Writing</div>
                    <div style={{
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "12px",
                      padding: "var(--spacing-4)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--spacing-3)",
                      alignItems: "flex-start",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
                    }}>
                      <div style={{ display: "flex", gap: "var(--spacing-4)", width: "100%", alignItems: "center" }}>
                        <div style={{ flexShrink: 0, width: "100px" }}>
                          {renderBookCoverItem(currentBook)}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                          <span style={{ fontSize: "var(--font-size-xs)", color: "#e08e6d", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {(currentBook.manifest?.writing_mode || "Novel").toUpperCase()}
                          </span>
                          <h3 style={{
                            fontSize: "var(--font-size-xl)",
                            fontWeight: 700,
                            margin: "0.2rem 0 0.4rem 0",
                            color: "#fff",
                            fontFamily: "'Source Serif 4', 'Georgia', serif"
                          }}>
                            {formatProjectTitle(currentBook.name)}
                          </h3>
                          {recentActivities.length > 0 && (
                             <div style={{ fontSize: "var(--font-size-xs)", color: "rgba(255,255,255,0.5)" }}>
                               Last active {timeAgo(recentActivities[0].timestamp)}
                             </div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => onLoadProject(currentBook.name)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                          background: "#9f8ad0",
                          border: "none",
                          color: "#fff",
                          padding: "0.85rem",
                          borderRadius: "8px",
                          fontSize: "var(--font-size-md)",
                          fontWeight: 700,
                          cursor: "pointer",
                          width: "100%",
                          boxShadow: "0 4px 14px rgba(159,138,208,0.25)"
                        }}
                        className="continue-writing-btn"
                      >
                        Continue →
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Recent Activity */}
                {currentBook && recentActivities.length > 0 && (
                  <div>
                    <div style={{ fontSize: "var(--font-size-xs)", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: "var(--spacing-3)" }}>Recent Activity</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
                      {recentActivities.slice(0, 3).map((act: any) => (
                        <div key={act.id} style={{ 
                          fontSize: "var(--font-size-sm)", 
                          color: "rgba(255,255,255,0.8)", 
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.04)",
                          borderRadius: "8px",
                          padding: "var(--spacing-3)",
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "space-between" 
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}>
                            <span style={{ color: "#9f8ad0", fontSize: "1.2rem" }}>{act.action === "edited" ? "✎" : "👁"}</span>
                            <span>{act.entity_type === "scene" ? "Scene" : act.entity_type === "character" ? "Character" : "Entity"}</span>
                          </div>
                          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "var(--font-size-xs)" }}>{timeAgo(act.timestamp)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Projects (All Stories) */}
                {(currentBook || otherActiveBooks.length > 0) && (
                  <div>
                    <div style={{ fontSize: "var(--font-size-xs)", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: "var(--spacing-3)" }}>Projects</div>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "var(--spacing-4) var(--spacing-2)",
                      justifyItems: "center"
                    }}>
                      {sortedProjects.filter(p => !p.manifest?.archived).map((p) => renderBookCoverItem(p))}
                    </div>
                  </div>
                )}
                
                {/* 4. Quick Create */}
                <div>
                   <div style={{ fontSize: "var(--font-size-xs)", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: "var(--spacing-3)" }}>Quick Create</div>
                   <button
                    onClick={() => {
                      setName("");
                      setDescription("");
                      setTemplate("blank");
                      setTargetWordCount(80000);
                      setCoverImage(null);
                      setIsCreating(true);
                    }}
                    style={{
                      width: "100%",
                      padding: "var(--spacing-4)",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px dashed rgba(255,255,255,0.2)",
                      borderRadius: "12px",
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "var(--font-size-md)",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "var(--spacing-2)"
                    }}
                   >
                     <span style={{ fontSize: "1.5rem" }}>+</span> New Story Project
                   </button>
                </div>

                {/* Empty state */}
                {!currentBook && otherActiveBooks.length === 0 && (
                  <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📖</div>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "var(--font-size-sm)", lineHeight: 1.6 }}>No stories yet.<br/>Tap <strong style={{ color: "#e08e6d" }}>Quick Create</strong> to begin.</p>
                  </div>
                )}
              </div>
            )}

            {/* ARCHIVE VIEW */}
            {activeLibraryView === "archive" && (
              <div>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: "0.75rem" }}>
                  Archived Stories ({archivedBooks.length})
                </div>
                {archivedBooks.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📦</div>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.9rem", lineHeight: 1.6 }}>No archived stories.<br/>Archived books appear here.</p>
                  </div>
                ) : (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "1.5rem 1rem",
                    justifyItems: "center"
                  }}>
                    {archivedBooks.map((p) => renderBookCoverItem(p))}
                  </div>
                )}
              </div>
            )}

            {/* IMPORT VIEW */}
            {activeLibraryView === "import" && (
              <div style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📥</div>
                <h3 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Import a Story</h3>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", lineHeight: 1.6, marginBottom: "2rem" }}>
                  Import an existing manuscript from a .txt, .docx, or Aevorin project file.
                </p>
                <div style={{
                  border: "2px dashed rgba(255,255,255,0.12)",
                  borderRadius: "12px",
                  padding: "2.5rem 1.5rem",
                  background: "rgba(255,255,255,0.02)",
                  cursor: "not-allowed",
                  color: "rgba(255,255,255,0.25)",
                  fontSize: "0.85rem"
                }}>
                  Drop file here — coming soon
                </div>
              </div>
            )}

          </div>

          {/* Custom Overlay Dialog for Creating a Book */}
          {isCreating && (
            <div className="calm-modal-overlay animate-fade-in" style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 99999,
              padding: "1.5rem"
            }}>
              <Card className="calm-creation-dialog animate-scale-in" style={{
                width: "100%",
                maxWidth: "460px",
                background: "#2d2d2d",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "16px",
                padding: "2rem",
                boxShadow: "0 15px 50px rgba(0,0,0,0.6)"
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: "1.3rem", color: "#fff", fontWeight: 700 }}>Begin a New Story</h3>
                  <button 
                    onClick={() => setIsCreating(false)} 
                    style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.8rem', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
                
                {error && (
                  <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.85rem" }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleCreate} className="calm-creation-form" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div className="form-group">
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>Story Title</label>
                    <input
                      type="text"
                      placeholder="e.g. The Glass Kingdom"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoFocus
                      style={{ width: "100%", padding: "0.75rem 1rem", background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#fff", fontSize: "0.95rem" }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>Brief Description</label>
                    <textarea
                      placeholder="Summary or theme guidelines..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      style={{ width: "100%", padding: "0.75rem 1rem", background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#fff", fontSize: "0.95rem", resize: "none" }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>Writing Template</label>
                    <select 
                      value={template} 
                      onChange={(e) => setTemplate(e.target.value)}
                      style={{ width: "100%", padding: "0.75rem 1rem", background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#fff", fontSize: "0.95rem" }}
                    >
                      <option value="blank">Blank Novel</option>
                      <option value="fantasy">Epic Fantasy</option>
                      <option value="romance">Romance</option>
                      <option value="scifi">Sci-Fi Odyssey</option>
                      <option value="mystery">Mystery Thriller</option>
                    </select>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: "flex-end" }}>
                    <Button type="button" className="btn-secondary" style={{ minHeight: "44px" }} onClick={() => setIsCreating(false)}>Cancel</Button>
                    <Button type="submit" className="btn-primary" style={{ minHeight: "44px", background: "#9f8ad0", border: "none" }} disabled={loading}>
                      {loading ? "Creating..." : "Create World"}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {/* Option Actions Drawer/Sheet overlay */}
          {activeMenuProject && (
            <div className="calm-modal-overlay" onClick={() => setActiveMenuProject(null)} style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.6)",
              display: "flex",
              justifyContent: "flex-end",
              flexDirection: "column",
              zIndex: 99999
            }}>
              <div 
                className="calm-bottom-sheet animate-slide-up" 
                onClick={(e) => e.stopPropagation()} 
                style={{
                  width: "100%",
                  maxWidth: "520px",
                  background: "#2d2d2d",
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                  borderTopLeftRadius: "16px",
                  borderTopRightRadius: "16px",
                  padding: "1.5rem",
                  margin: "0 auto",
                  boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.5)"
                }}
              >
                {/* Drag Handle Pill */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                  <div style={{ width: "40px", height: "4px", background: "rgba(255,255,255,0.15)", borderRadius: "2px" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "1.1rem", color: "#fff", fontWeight: 700 }}>
                      {formatProjectTitle(activeMenuProject.name)}
                    </h4>
                    <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                      Opened {activeMenuProject.manifest?.lastOpened ? timeAgo(activeMenuProject.manifest.lastOpened) : "Never"}
                    </span>
                  </div>
                  <button 
                    onClick={() => setActiveMenuProject(null)} 
                    style={{ background: "none", border: "none", color: "#888", fontSize: "1.5rem", cursor: "pointer", padding: 0 }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <button 
                    className="bottom-sheet-item"
                    style={{
                      minHeight: "48px",
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "8px",
                      padding: "0.75rem 1rem",
                      color: "#fff",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "0.95rem",
                      transition: "background 0.2s"
                    }}
                    onClick={() => {
                      const targetName = activeMenuProject.name;
                      setActiveMenuProject(null);
                      onLoadProject(targetName);
                    }}
                  >
                    📖 <span style={{ fontWeight: 600 }}>Open Draft Editor</span>
                  </button>

                  <button 
                    className="bottom-sheet-item"
                    style={{
                      minHeight: "48px",
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "8px",
                      padding: "0.75rem 1rem",
                      color: "#fff",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "0.95rem",
                      transition: "background 0.2s"
                    }}
                    onClick={() => {
                      setProjectToRename(activeMenuProject);
                      setRenameNewName(activeMenuProject.name);
                      setActiveMenuProject(null);
                    }}
                  >
                    ✏️ <span style={{ fontWeight: 600 }}>Rename Story</span>
                  </button>

                  <button 
                    className="bottom-sheet-item"
                    style={{
                      minHeight: "48px",
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "8px",
                      padding: "0.75rem 1rem",
                      color: "#fff",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "0.95rem",
                      transition: "background 0.2s"
                    }}
                    onClick={() => {
                      setProjectToDuplicate(activeMenuProject);
                      setDuplicateNewName(`${activeMenuProject.name} (Copy)`);
                      setActiveMenuProject(null);
                    }}
                  >
                    👯 <span style={{ fontWeight: 600 }}>Duplicate Story</span>
                  </button>

                  <button 
                    className="bottom-sheet-item"
                    style={{
                      minHeight: "48px",
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "8px",
                      padding: "0.75rem 1rem",
                      color: "#fff",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "0.95rem",
                      transition: "background 0.2s"
                    }}
                    onClick={async () => {
                      const targetProject = activeMenuProject;
                      setActiveMenuProject(null);
                      try {
                        await onArchiveProject(targetProject.name, !targetProject.manifest?.archived);
                      } catch (err: any) {
                        setError(err.message || "Failed to archive project");
                      }
                    }}
                  >
                    📦 <span style={{ fontWeight: 600 }}>
                      {activeMenuProject.manifest?.archived ? "Restore to Library" : "Archive Story"}
                    </span>
                  </button>

                  <button 
                    className="bottom-sheet-item"
                    style={{
                      minHeight: "48px",
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      background: "rgba(239, 68, 68, 0.05)",
                      border: "1px solid rgba(239, 68, 68, 0.15)",
                      borderRadius: "8px",
                      padding: "0.75rem 1rem",
                      color: "#f87171",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "0.95rem",
                      transition: "background 0.2s"
                    }}
                    onClick={() => {
                      setProjectToDelete(activeMenuProject);
                      setDeleteConfirmName("");
                      setActiveMenuProject(null);
                    }}
                  >
                    🗑 <span style={{ fontWeight: 600 }}>Delete Permanently</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rename Dialog Modal Overlay */}
          {projectToRename && (
            <div className="calm-modal-overlay animate-fade-in" style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 99999,
              padding: "1.5rem"
            }}>
              <Card className="calm-creation-dialog animate-scale-in" style={{
                width: "100%",
                maxWidth: "400px",
                background: "#2d2d2d",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "1.75rem"
              }}>
                <h3 style={{ margin: 0, marginBottom: "1rem", fontSize: "1.2rem", color: "#fff", fontWeight: 700 }}>Rename Story</h3>
                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <input
                    type="text"
                    value={renameNewName}
                    onChange={(e) => setRenameNewName(e.target.value)}
                    required
                    autoFocus
                    style={{ width: "100%", padding: "0.75rem 1rem", background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#fff", fontSize: "0.95rem" }}
                  />
                </div>
                <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                  <Button className="btn-secondary" onClick={() => setProjectToRename(null)}>Cancel</Button>
                  <Button 
                    className="btn-primary" 
                    style={{ background: "#9f8ad0", border: "none" }}
                    disabled={!renameNewName.trim() || renameNewName.trim() === projectToRename.name}
                    onClick={async () => {
                      const source = projectToRename.name;
                      const target = renameNewName.trim();
                      setProjectToRename(null);
                      try {
                        await onRenameProject(source, target);
                      } catch (err: any) {
                        setError(err.message || "Failed to rename project");
                      }
                    }}
                  >
                    Rename
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Duplicate Dialog Modal Overlay */}
          {projectToDuplicate && (
            <div className="calm-modal-overlay animate-fade-in" style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 99999,
              padding: "1.5rem"
            }}>
              <Card className="calm-creation-dialog animate-scale-in" style={{
                width: "100%",
                maxWidth: "400px",
                background: "#2d2d2d",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "1.75rem"
              }}>
                <h3 style={{ margin: 0, marginBottom: "1rem", fontSize: "1.2rem", color: "#fff", fontWeight: 700 }}>Duplicate Story</h3>
                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <input
                    type="text"
                    value={duplicateNewName}
                    onChange={(e) => setDuplicateNewName(e.target.value)}
                    required
                    autoFocus
                    style={{ width: "100%", padding: "0.75rem 1rem", background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#fff", fontSize: "0.95rem" }}
                  />
                </div>
                <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                  <Button className="btn-secondary" onClick={() => setProjectToDuplicate(null)}>Cancel</Button>
                  <Button 
                    className="btn-primary" 
                    style={{ background: "#9f8ad0", border: "none" }}
                    disabled={!duplicateNewName.trim() || duplicateNewName.trim() === projectToDuplicate.name}
                    onClick={async () => {
                      const source = projectToDuplicate.name;
                      const target = duplicateNewName.trim();
                      setProjectToDuplicate(null);
                      try {
                        await onDuplicateProject(source, target);
                      } catch (err: any) {
                        setError(err.message || "Failed to duplicate project");
                      }
                    }}
                  >
                    Duplicate
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Delete Dialog Modal Overlay */}
          {projectToDelete && (
            <div className="calm-modal-overlay animate-fade-in" style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 999999,
              padding: "1.5rem"
            }}>
              <Card className="calm-creation-dialog animate-scale-in" style={{
                width: "100%",
                maxWidth: "420px",
                background: "#2d2d2d",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                borderRadius: "12px",
                padding: "1.75rem"
              }}>
                <h3 style={{ margin: 0, marginBottom: "0.5rem", fontSize: "1.2rem", color: "#ef4444", fontWeight: 700 }}>⚠️ Delete Manuscript?</h3>
                <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", lineHeight: "1.4", marginBottom: "1.25rem" }}>
                  This action is permanent and cannot be undone. All database records, structural guidelines, and outlines will be deleted.
                </p>
                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.8", color: "rgba(255,255,255,0.7)" }}>
                    Type <strong style={{ color: "#fff" }}>{projectToDelete.name}</strong> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Enter story name..."
                    autoFocus
                    style={{ width: "100%", padding: "0.75rem 1rem", background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#fff", fontSize: "0.95rem" }}
                  />
                </div>
                <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                  <Button className="btn-secondary" onClick={() => setProjectToDelete(null)}>Cancel</Button>
                  <Button 
                    className="btn-danger"
                    disabled={deleteConfirmName !== projectToDelete.name}
                    onClick={async () => {
                      const targetName = projectToDelete.name;
                      setProjectToDelete(null);
                      try {
                        await onDeleteProject(targetName);
                      } catch (err: any) {
                        setError(err.message || "Failed to delete project");
                      }
                    }}
                    style={{ background: "#ef4444", border: "none", color: "#fff", fontWeight: 600 }}
                  >
                    Confirm Delete
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Workspace Settings drawer/sheet modal */}
          {settingsOpen && (
            <div className="calm-modal-overlay" onClick={() => setSettingsOpen(false)} style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.6)",
              display: "flex",
              justifyContent: "flex-end",
              flexDirection: "column",
              zIndex: 99999
            }}>
              <div 
                className="calm-bottom-sheet animate-slide-up" 
                onClick={(e) => e.stopPropagation()} 
                style={{
                  width: "100%",
                  maxWidth: "520px",
                  background: "#2d2d2d",
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                  borderTopLeftRadius: "16px",
                  borderTopRightRadius: "16px",
                  padding: "1.5rem",
                  margin: "0 auto",
                  boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.5)"
                }}
              >
                {/* Visual Drag Handle Pill */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                  <div style={{ width: "40px", height: "4px", background: "rgba(255,255,255,0.15)", borderRadius: "2px" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <h4 style={{ margin: 0, fontSize: "1.1rem", color: "#fff", fontWeight: 700 }}>
                    Workspace Options & Settings
                  </h4>
                  <button 
                    onClick={() => setSettingsOpen(false)} 
                    style={{ background: "none", border: "none", color: "#888", fontSize: "1.5rem", cursor: "pointer", padding: 0 }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  
                  {/* Author Profile Settings */}
                  <div style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "8px",
                    padding: "1rem",
                    marginBottom: "0.5rem"
                  }}>
                    <label style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#e08e6d",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "0.5rem"
                    }}>
                      Pen Name / Author Name
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => handleAuthorNameChange(e.target.value)}
                      placeholder="e.g. Zubair"
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.85rem",
                        background: "#1c1c1c",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "6px",
                        color: "#fff",
                        fontSize: "0.9rem"
                      }}
                    />
                  </div>

                  {/* Advanced settings toggle */}
                  <div style={{ marginTop: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#e08e6d",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.5rem 0"
                      }}
                    >
                      {isAdvancedOpen ? "▼ Hide Advanced Settings" : "▶ Show Advanced Settings"}
                    </button>
                    
                    {isAdvancedOpen && (
                      <div style={{
                        marginTop: "0.75rem",
                        padding: "1rem",
                        background: "rgba(0,0,0,0.15)",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.05)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem"
                      }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", fontSize: "0.9rem", color: "#fff" }}>
                          <input
                            type="checkbox"
                            checked={devModeEnabled}
                            onChange={(e) => handleDevModeChange(e.target.checked)}
                            style={{ width: "16px", height: "16px", accentColor: "#9f8ad0" }}
                          />
                          Enable Developer Mode
                        </label>
                        
                        {devModeEnabled && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "0.75rem", marginTop: "0.25rem" }}>
                            <button 
                              className="bottom-sheet-item"
                              style={{
                                minHeight: "44px",
                                display: "flex",
                                alignItems: "center",
                                gap: "1rem",
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.05)",
                                borderRadius: "8px",
                                padding: "0.75rem 1rem",
                                color: "#fff",
                                cursor: "pointer",
                                textAlign: "left",
                                fontSize: "0.9rem",
                                transition: "background 0.2s"
                              }}
                              onClick={() => {
                                setSettingsOpen(false);
                                onSeedExample();
                              }}
                            >
                              🚀 <span style={{ fontWeight: 600 }}>Load 'Forgotten Kingdom' Example</span>
                            </button>

                            {onSeedAbyssalMonarch && (
                              <button 
                                className="bottom-sheet-item"
                                style={{
                                  minHeight: "44px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "1rem",
                                  background: "rgba(255,255,255,0.02)",
                                  border: "1px solid rgba(255,255,255,0.05)",
                                  borderRadius: "8px",
                                  padding: "0.75rem 1rem",
                                  color: "#fff",
                                  cursor: "pointer",
                                  textAlign: "left",
                                  fontSize: "0.9rem",
                                  transition: "background 0.2s"
                                }}
                                onClick={() => {
                                  setSettingsOpen(false);
                                  onSeedAbyssalMonarch();
                                }}
                              >
                                🔮 <span style={{ fontWeight: 600 }}>Seed 'Abyssal Monarch' Outline</span>
                              </button>
                            )}

                            {onCleanupSamples && (
                              <button 
                                className="bottom-sheet-item"
                                style={{
                                  minHeight: "44px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "1rem",
                                  background: "rgba(239, 68, 68, 0.05)",
                                  border: "1px solid rgba(239, 68, 68, 0.15)",
                                  borderRadius: "8px",
                                  padding: "0.75rem 1rem",
                                  color: "#f87171",
                                  cursor: "pointer",
                                  textAlign: "left",
                                  fontSize: "0.9rem",
                                  transition: "background 0.2s"
                                }}
                                onClick={() => {
                                  setSettingsOpen(false);
                                  onCleanupSamples();
                                }}
                              >
                                🧹 <span style={{ fontWeight: 600 }}>Clean Sample Projects (Developer Tools)</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
