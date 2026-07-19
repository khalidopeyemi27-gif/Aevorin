import { useEffect } from "react";

interface ShortcutHandlers {
  onSave?: () => void;
  onToggleFocus?: () => void;
  onCreateChapter?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenSearch?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      
      // Context checks: check if we are typing inside an editable field
      let isEditable = false;
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase();
        isEditable =
          tagName === "input" ||
          tagName === "textarea" ||
          activeEl.hasAttribute("contenteditable") ||
          activeEl.classList.contains("ProseMirror");
      }

      // If typing in editable element, ignore shortcuts EXCEPT Ctrl+S, Ctrl+K, Ctrl+P, Ctrl+/
      if (isEditable) {
        const isSave = e.ctrlKey && e.key.toLowerCase() === "s";
        const isCmdPalette =
          (e.ctrlKey && e.key.toLowerCase() === "k") ||
          (e.ctrlKey && e.key === "/");
        const isSearch = e.ctrlKey && e.key.toLowerCase() === "p";
        
        if (!isSave && !isCmdPalette && !isSearch) {
          return;
        }
      }

      // Ctrl + S: Save
      if (e.ctrlKey && e.key.toLowerCase() === "s") {
        if (handlers.onSave) {
          e.preventDefault();
          handlers.onSave();
        }
      }

      // Ctrl + Shift + F: Toggle Focus Mode
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "f") {
        if (handlers.onToggleFocus) {
          e.preventDefault();
          handlers.onToggleFocus();
        }
      }

      // Ctrl + N: Create Chapter
      if (e.ctrlKey && e.key.toLowerCase() === "n") {
        if (handlers.onCreateChapter) {
          e.preventDefault();
          handlers.onCreateChapter();
        }
      }

      // Ctrl + K or Ctrl + /: Command Palette
      if (
        (e.ctrlKey && e.key.toLowerCase() === "k") ||
        (e.ctrlKey && e.key === "/")
      ) {
        if (handlers.onOpenCommandPalette) {
          e.preventDefault();
          handlers.onOpenCommandPalette();
        }
      }

      // Ctrl + P: Global Search
      if (e.ctrlKey && e.key.toLowerCase() === "p") {
        if (handlers.onOpenSearch) {
          e.preventDefault();
          handlers.onOpenSearch();
        }
      }

      // Standard / key: open command palette (only if NOT in an editable field)
      if (e.key === "/" && !isEditable) {
        if (handlers.onOpenCommandPalette) {
          e.preventDefault();
          handlers.onOpenCommandPalette();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers]);
}
