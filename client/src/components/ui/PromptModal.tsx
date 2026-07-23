import React, { useState, useEffect, useRef } from "react";
import { Button } from "./index";

interface PromptModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  placeholder?: string;
  initialValue?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  title,
  subtitle,
  placeholder = "Type here...",
  initialValue = "",
  confirmText = "Create",
  cancelText = "Cancel",
  onConfirm,
  onCancel
}) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(value.trim());
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(8px)",
        animation: "fadeIn 0.2s ease-out"
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          margin: "1rem",
          padding: "1.75rem",
          background: "linear-gradient(135deg, rgba(22, 22, 34, 0.95) 0%, rgba(14, 14, 22, 0.98) 100%)",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05), 0 8px 32px rgba(180, 108, 255, 0.15)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 600, letterSpacing: "-0.01em", color: "#f3f3f8" }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{ margin: 0, fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.6)", lineHeight: 1.4 }}>
              {subtitle}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === "Escape") onCancel();
            }}
            style={{
              width: "100%",
              padding: "0.85rem 1rem",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "10px",
              color: "#fff",
              fontSize: "0.95rem",
              outline: "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
              boxSizing: "border-box"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#b46cff";
              e.target.style.boxShadow = "0 0 0 3px rgba(180, 108, 255, 0.2)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(255, 255, 255, 0.15)";
              e.target.style.boxShadow = "none";
            }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <Button variant="secondary" onClick={onCancel} type="button">
              {cancelText}
            </Button>
            <Button variant="primary" type="submit" disabled={!value.trim()}>
              {confirmText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
