import React, { createContext, useContext, useState, useEffect } from "react";

export interface WritingPreferences {
  editorFont: string;
  fontSize: number;
  lineHeight: number;
  pageWidth: number;
  paragraphSpacing: 'small' | 'medium' | 'large';
  theme: string;
  focusMode: boolean;
  typewriterMode: boolean;
  spellCheck: boolean;
  showLineNumbers: boolean;
  showStatusBar: boolean;
  showWordGoal: boolean;
  showBinder: boolean;
  showOutline: boolean;
  autoSaveInterval: number;
  smoothScrolling: boolean;
  caretAnimation: boolean;
}

const DEFAULT_PREFERENCES: WritingPreferences = {
  editorFont: 'Source Serif 4',
  fontSize: 18,
  lineHeight: 1.75,
  pageWidth: 720,
  paragraphSpacing: 'medium',
  theme: 'midnight',
  focusMode: false,
  typewriterMode: false,
  spellCheck: true,
  showLineNumbers: false,
  showStatusBar: true,
  showWordGoal: true,
  showBinder: true,
  showOutline: true,
  autoSaveInterval: 2,
  smoothScrolling: true,
  caretAnimation: true,
};

interface PreferencesContextType {
  preferences: WritingPreferences;
  updatePreferences: (updates: Partial<WritingPreferences>) => void;
  resetPreferences: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<WritingPreferences>(() => {
    try {
      const saved = localStorage.getItem("aevorin_writing_preferences");
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (e) {
      console.error("[Preferences] Failed to load from localStorage:", e);
    }
    return DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    try {
      localStorage.setItem("aevorin_writing_preferences", JSON.stringify(preferences));
      
      // Update HTML theme attribute and CSS custom variables on change
      const root = document.documentElement;
      root.setAttribute("data-theme", preferences.theme);
      
      root.style.setProperty("--editor-font-size", `${preferences.fontSize}px`);
      root.style.setProperty("--editor-line-height", `${preferences.lineHeight}`);
      root.style.setProperty("--editor-width", `${preferences.pageWidth}px`);
      root.style.setProperty("--font-editor", `'${preferences.editorFont}', Georgia, serif`);
      
      const spacingValue = preferences.paragraphSpacing === 'small' 
        ? '0.75rem' 
        : preferences.paragraphSpacing === 'large' 
          ? '2.25rem' 
          : '1.5rem';
      root.style.setProperty("--paragraph-spacing", spacingValue);
      
    } catch (e) {
      console.error("[Preferences] Failed to save to localStorage:", e);
    }
  }, [preferences]);

  const updatePreferences = (updates: Partial<WritingPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreferences, resetPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
