import React from "react";

// Card Component
export function Card({ children, className = "", style, onClick }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; onClick?: () => void }) {
  return (
    <div className={`ov-card anim-scale-in ${className}`} style={style} onClick={onClick}>
      {children}
    </div>
  );
}

// Button Component
export function Button({ children, className = "", style, onClick, type = "button", disabled = false }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; onClick?: () => void; type?: "button" | "submit" | "reset"; disabled?: boolean }) {
  return (
    <button type={type} disabled={disabled} className={`ov-btn ${className}`} style={style} onClick={onClick}>
      {children}
    </button>
  );
}

// ProgressBar Component
export function ProgressBar({ percent, className = "" }: { percent: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className={`ov-progress-track ${className}`}>
      <div className="ov-progress-fill" style={{ width: `${clamped}%` }} />
    </div>
  );
}

// SectionHeader Component
export function SectionHeader({ title, subtitle, className = "" }: { title: string; subtitle?: string; className?: string }) {
  return (
    <div className={`ov-section-header ${className}`}>
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

// EmptyState Component
export function EmptyState({ title, description, children, icon, className = "" }: { title: string; description?: string; children?: React.ReactNode; icon?: React.ReactNode; className?: string }) {
  return (
    <div className={`ov-empty-state ${className}`}>
      {icon && <div className="ov-empty-icon">{icon}</div>}
      <h4>{title}</h4>
      {description && <p>{description}</p>}
      {children && <div className="ov-empty-actions">{children}</div>}
    </div>
  );
}

// Badge Component
export function Badge({ children, variant = "primary", className = "" }: { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning'; className?: string }) {
  return (
    <span className={`ov-badge variant-${variant} ${className}`}>
      {children}
    </span>
  );
}

// StatCard Component
export function StatCard({ label, value, icon, className = "" }: { label: string; value: string | number; icon?: React.ReactNode; className?: string }) {
  return (
    <div className={`ov-stat-card ${className}`}>
      <div className="ov-stat-header">
        {icon && <span className="ov-stat-icon">{icon}</span>}
        <span className="ov-stat-label">{label}</span>
      </div>
      <div className="ov-stat-value">{value}</div>
    </div>
  );
}

// Modal Component
export function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="ov-modal-overlay anim-fade-in" onClick={onClose}>
      <div className="ov-modal-content anim-scale-in" onClick={e => e.stopPropagation()}>
        <div className="ov-modal-header">
          <h4>{title}</h4>
          <button className="ov-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="ov-modal-body">{children}</div>
      </div>
    </div>
  );
}

// BottomSheet Component
export function BottomSheet({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="ov-modal-overlay anim-fade-in" onClick={onClose} style={{ alignItems: "flex-end", padding: 0 }}>
      <div className="anim-slide-up" onClick={e => e.stopPropagation()} style={{
        width: "100%",
        background: "var(--sidebar-bg)",
        borderTopLeftRadius: "16px",
        borderTopRightRadius: "16px",
        padding: "1.25rem",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.3)"
      }}>
        {title && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h4 style={{ margin: 0, fontSize: "1.1rem" }}>{title}</h4>
            <button style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.5rem", padding: "0 0.5rem", cursor: "pointer" }} onClick={onClose}>×</button>
          </div>
        )}
        <div style={{ paddingBottom: "2rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// FAB Component
export function FAB({ icon, onClick, className = "" }: { icon: React.ReactNode; onClick: () => void; className?: string }) {
  return (
    <button 
      className={`ov-fab ${className}`}
      onClick={onClick}
      style={{
        position: "fixed",
        bottom: "80px", // above mobile bottom nav
        right: "20px",
        width: "56px",
        height: "56px",
        borderRadius: "28px",
        background: "linear-gradient(135deg, #9f8ad0, #c084fc)",
        color: "white",
        border: "none",
        boxShadow: "0 8px 24px rgba(159,138,208,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.5rem",
        cursor: "pointer",
        zIndex: 1000,
        transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
      }}
    >
      {icon}
    </button>
  );
}
