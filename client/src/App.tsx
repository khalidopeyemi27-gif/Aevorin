import { apiUrl } from "./lib/api";
import React, { useState, useEffect, lazy, Suspense } from "react";
import { useBackHandler } from "./core/navigation/useBackHandler";
import { BACK_PRIORITY } from "./core/navigation/BackPriority";
import { NavigationProvider } from "./core/navigation/NavigationContext";
import { NavigationDebugger } from "./components/workspace/NavigationDebugger";
import { AuthOverlay, supabase } from "./components/auth/AuthOverlay";
import { ProjectRepository } from "./database/repositories/projectRepository";

const Dashboard = lazy(() => import("./core/Dashboard"));
const Workspace = lazy(() => import("./core/Workspace"));

function LoadingWorkspace() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0d0b1e", color: "#94a3b8" }}>
      <div className="spinner" style={{ width: "40px", height: "40px", border: "4px solid rgba(255,255,255,0.1)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      <p style={{ marginTop: "1rem", fontSize: "0.9rem", fontWeight: 600 }}>Loading Sanctuary Workspace...</p>
    </div>
  );
}

// Error boundary to catch runtime crashes and show a visible error
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message + "\n" + error.stack };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", color: "#ff6b6b", background: "#0d0b1e", minHeight: "100vh", fontFamily: "monospace" }}>
          <h2>⚠️ AEVORIN Render Error</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.8rem", marginTop: "1rem", color: "#f8d7da" }}>{this.state.error}</pre>
          <button
            onClick={() => { this.setState({ hasError: false, error: "" }); window.location.reload(); }}
            style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#7c3aed", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface StatusData {
  status: string;
  kernelBooted: boolean;
  activeProject: string | null;
  activeProjectId: string | null;
  features: Record<string, boolean>;
}

interface ProjectData {
  id: string;
  name: string;
  path: string;
  manifest: {
    created: string;
    writing_mode: string;
  };
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [status, setStatus] = useState<StatusData | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loadedProject, setLoadedProject] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch(apiUrl("/api/status"));
      if (!res.ok) throw new Error("Status API returned error");
      const data = await res.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setStatus(null);
    }
  };

  const fetchProjects = async () => {
    try {
      // 1. Load from Dexie local IndexedDB immediately (0ms)
      const local = await ProjectRepository.getAll();
      if (local.length > 0) {
        setProjects(local);
      }

      // 2. Sync with backend API
      const res = await fetch(apiUrl("/api/projects"));
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error("[Projects] API offline, operating in Dexie IndexedDB mode:", err);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchProjects();
  }, []);

  const handleCreateProject = async (name: string, description: string, template: string, targetWordCount: number, coverImage: string | null) => {
    try {
      // Create locally in Dexie IndexedDB first (0ms response)
      const newProject = await ProjectRepository.create({
        name,
        description,
        template,
        targetWordCount,
        coverImage: coverImage || undefined
      });

      setSuccess(`Project "${newProject.name}" created in Local Sanctuary!`);
      setLoadedProject(newProject);
      await fetchProjects();
    } catch (err: any) {
      throw err;
    }
  };

  const handleLoadProject = async (projectName: string) => {
    try {
      setError(null);
      // 1. Load from local Dexie IndexedDB repository first (0ms response)
      const localProject = await ProjectRepository.getByName(projectName);
      if (localProject) {
        setLoadedProject(localProject);
        setSuccess(`Loaded project "${localProject.name}"!`);
        return;
      }

      // 2. Fallback to API if not found locally
      const res = await fetch(apiUrl("/api/projects/load"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          console.warn("[App] Auth token expired, opening local sanctuary instance");
          const created = await ProjectRepository.create({ name: projectName });
          setLoadedProject(created);
          setSuccess(`Loaded project "${created.name}"!`);
          return;
        }
        throw new Error(data.error || "Failed to load project");
      }

      setSuccess(`Loaded project "${data.name}"!`);
      setLoadedProject(data);
      await fetchStatus();
    } catch (err: any) {
      console.error("[App] Failed loading project:", err);
      setError(err.message || "Unable to load project");
    }
  };

  const handleSeedExample = async () => {
    try {
      const res = await fetch(apiUrl("/api/projects/seed-example"), {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to seed example project");
      
      setSuccess(`Example project "${data.name}" seeded and loaded successfully!`);
      setLoadedProject(data);
      await fetchStatus();
      await fetchProjects();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSeedAbyssalMonarch = async () => {
    try {
      const res = await fetch(apiUrl("/api/projects/seed-abyssal-monarch"), {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to seed demo novel");
      
      setSuccess(`Demo novel "${data.name}" seeded and loaded successfully!`);
      setLoadedProject(data);
      await fetchStatus();
      await fetchProjects();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteProject = async (projectName: string) => {
    try {
      const res = await fetch(apiUrl(`/api/projects/${projectName}`), {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete project");
      setSuccess(`Deleted project "${projectName}"!`);
      await fetchProjects();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const [projectToLoad, setProjectToLoad] = useState<string | null>(null);

  const handleTriggerLoadSafety = async (name: string) => {
    if (loadedProject) {
      setProjectToLoad(name);
    } else {
      await handleLoadProject(name);
    }
  };

  const handleRenameProject = async (name: string, newName: string) => {
    try {
      const res = await fetch(apiUrl(`/api/projects/${name}/rename`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to rename project");
      }
      setSuccess(`Renamed project to "${newName}"!`);
      await fetchProjects();
      if (loadedProject && loadedProject.name === name) {
        await handleLoadProject(newName);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDuplicateProject = async (name: string, newName: string) => {
    try {
      const res = await fetch(apiUrl(`/api/projects/${name}/duplicate`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to duplicate project");
      }
      setSuccess(`Duplicated project "${name}" to "${newName}"!`);
      await fetchProjects();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleArchiveProject = async (name: string, archive: boolean) => {
    try {
      const endpoint = archive ? "archive" : "unarchive";
      const res = await fetch(apiUrl(`/api/projects/${name}/${endpoint}`), {
        method: "PUT"
      });
      if (!res.ok) throw new Error(`Failed to ${endpoint} project`);
      setSuccess(`${archive ? "Archived" : "Restored"} project "${name}"!`);
      await fetchProjects();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCleanupSamples = async () => {
    try {
      const res = await fetch(apiUrl("/api/projects/cleanup-samples"), {
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to clean up sample projects");
      const data = await res.json();
      setSuccess(data.message);
      await fetchProjects();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCloseProject = () => {
    setLoadedProject(null);
    setSuccess(null);
    setError(null);
    fetchStatus();
    fetchProjects();
  };

  useBackHandler({
    id: "app_switch_project_modal",
    priority: BACK_PRIORITY.MODAL,
    isActive: projectToLoad !== null,
    onBack: () => {
      setProjectToLoad(null);
      return true;
    }
  });

  useBackHandler({
    id: "app_exit_project",
    priority: BACK_PRIORITY.PROJECT,
    isActive: loadedProject !== null && projectToLoad === null,
    onBack: () => {
      handleCloseProject();
      return true;
    }
  });

  if (!session) {
    return <AuthOverlay onLogin={(sess) => setSession(sess)} />;
  }

  return (
    <div className="app-container">
      <NavigationDebugger />
      {loadedProject ? (
        <ErrorBoundary>
          <Suspense fallback={<LoadingWorkspace />}>
            <Workspace
              project={loadedProject}
              onBackToDashboard={handleCloseProject}
              onSeedExample={handleSeedExample}
              projects={projects}
              onLoadProject={handleLoadProject}
            />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <>
          {localStorage.getItem("aevorin_dev_mode") === "true" && (
            <header className="app-header">
              <div className="brand-logo">
                <svg className="brand-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "24px", height: "24px", color: "#f5c542", filter: "drop-shadow(0 0 8px rgba(245, 197, 66, 0.4))" }}>
                  <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
                  <line x1="16" y1="8" x2="2" y2="22" />
                  <line x1="17.5" y1="15" x2="9" y2="15" />
                </svg>
                <h1>AEVORIN</h1>
                <span className="version-badge">v2.0 Sanctuary</span>
              </div>
              <div className="system-status">
                <span className={`status-pill ${status ? "connected" : "disconnected"}`}>
                  Backend: {status ? "Connected ✓" : "Disconnected ✗"}
                </span>
                <span className={`status-pill ${status?.kernelBooted ? "ready" : "offline"}`}>
                  Kernel: {status?.kernelBooted ? "Booted ✓" : "Offline ✗"}
                </span>
              </div>
            </header>
          )}

          <main className="app-main">
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <Suspense fallback={<LoadingWorkspace />}>
              <Dashboard
                projects={projects}
                activeProjectId={status?.activeProjectId || null}
                onCreateProject={handleCreateProject}
                onLoadProject={handleTriggerLoadSafety}
                onSeedExample={handleSeedExample}
                onSeedAbyssalMonarch={handleSeedAbyssalMonarch}
                onDeleteProject={handleDeleteProject}
                onRenameProject={handleRenameProject}
                onDuplicateProject={handleDuplicateProject}
                onArchiveProject={handleArchiveProject}
                onCleanupSamples={handleCleanupSamples}
              />
            </Suspense>
          </main>

          {/* Custom Project Load Switch Safety Warning */}
          {projectToLoad && (
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
              <div className="calm-creation-dialog animate-scale-in" style={{ maxWidth: "450px", width: "90%", margin: "0 auto", padding: "1.5rem", background: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <h3 style={{ margin: 0, fontFamily: "var(--font-editor)", fontSize: "1.5rem", color: "var(--text-primary)" }}>Switch Project</h3>
                <p style={{ margin: "1rem 0", color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                  You are currently editing a project. Would you like to save draft progress and load <strong>{projectToLoad}</strong>?
                </p>
                <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                  <button className="btn btn-secondary" onClick={() => setProjectToLoad(null)}>Cancel</button>
                  <button className="btn btn-primary" onClick={async () => {
                    const name = projectToLoad;
                    setProjectToLoad(null);
                    await handleLoadProject(name);
                  }}>Save & Switch</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
