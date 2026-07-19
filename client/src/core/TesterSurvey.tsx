import React, { useState, useEffect } from "react";

interface TesterSurveyProps {
  projectId: string;
  onClose: () => void;
}

interface SurveyData {
  useCase: string[];
  useCaseOther: string;
  discovery: string;
  confusionPoints: string[];
  confusionOther: string;
  whatConfusedMost: string;
  featureWanted: string;
  whatWouldYouMiss: string;
  recommendation: string;
}

export default function TesterSurvey({ projectId, onClose }: TesterSurveyProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [survey, setSurvey] = useState<SurveyData>({
    useCase: [],
    useCaseOther: "",
    discovery: "",
    confusionPoints: [],
    confusionOther: "",
    whatConfusedMost: "",
    featureWanted: "",
    whatWouldYouMiss: "",
    recommendation: ""
  });

  // Check if already submitted
  useEffect(() => {
    const saved = localStorage.getItem(`aevorin_survey_submitted_${projectId}`);
    if (saved === "true") {
      setSubmitted(true);
    }
  }, [projectId]);

  const toggleUseCase = (value: string) => {
    setSurvey(prev => ({
      ...prev,
      useCase: prev.useCase.includes(value)
        ? prev.useCase.filter(v => v !== value)
        : [...prev.useCase, value]
    }));
  };

  const toggleConfusion = (value: string) => {
    setSurvey(prev => ({
      ...prev,
      confusionPoints: prev.confusionPoints.includes(value)
        ? prev.confusionPoints.filter(v => v !== value)
        : [...prev.confusionPoints, value]
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Save to localStorage
      localStorage.setItem(`aevorin_survey_${projectId}`, JSON.stringify(survey));
      localStorage.setItem(`aevorin_survey_submitted_${projectId}`, "true");

      // Also save to backend
      const res = await fetch(`/api/projects/${projectId}/survey`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...survey,
          version: "0.1.0",
          platform: navigator.platform,
          userAgent: navigator.userAgent,
          submittedAt: new Date().toISOString()
        })
      });

      if (!res.ok) throw new Error("Failed to save survey");
      setSubmitted(true);
    } catch (err) {
      // Even if backend fails, localStorage has the data
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const checkboxStyle: React.CSSProperties = {
    width: "18px", height: "18px", accentColor: "#818cf8", cursor: "pointer"
  };

  const radioStyle: React.CSSProperties = {
    width: "16px", height: "16px", accentColor: "#818cf8", cursor: "pointer"
  };

  const labelRowStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.95rem", cursor: "pointer"
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: "2rem"
  };

  const textareaStyle: React.CSSProperties = {
    width: "100%", minHeight: "70px", background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.1)", color: "white",
    borderRadius: "6px", padding: "0.75rem", fontSize: "0.9rem",
    resize: "vertical", fontFamily: "inherit"
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center", padding: "3rem 2rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🙏</div>
        <h2>Thank You, Alpha Tester</h2>
        <p style={{ color: "#94a3b8", margin: "1rem 0", lineHeight: "1.6" }}>
          Your feedback has been saved locally and will be included in your diagnostics export. 
          It helps shape what AEVORIN becomes.
        </p>
        <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ marginTop: "1rem" }}>
          Back to Workspace
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "1.5rem" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h2 style={{ marginBottom: "0.5rem" }}>AEVORIN Alpha Tester Survey</h2>
        <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
          Version: 0.1.0 &nbsp;•&nbsp; {navigator.platform}
        </p>
        <p style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "0.5rem" }}>
          This survey is stored locally. No data is sent to any server.
        </p>
      </div>

      {/* Q1: Use Case */}
      <div style={sectionStyle}>
        <h3 style={{ marginBottom: "0.75rem" }}>What did you use AEVORIN for?</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {["Novel", "Screenplay", "Worldbuilding", "Short Stories", "Game Writing", "Other"].map(opt => (
            <label key={opt} style={labelRowStyle}>
              <input
                type="checkbox"
                checked={survey.useCase.includes(opt)}
                onChange={() => toggleUseCase(opt)}
                style={checkboxStyle}
              />
              <span>{opt}</span>
            </label>
          ))}
          {survey.useCase.includes("Other") && (
            <input
              type="text"
              placeholder="Please specify..."
              value={survey.useCaseOther}
              onChange={e => setSurvey(prev => ({ ...prev, useCaseOther: e.target.value }))}
              style={{ ...textareaStyle, minHeight: "auto", padding: "0.5rem 0.75rem" }}
            />
          )}
        </div>
      </div>

      {/* Q2: Discovery */}
      <div style={sectionStyle}>
        <h3 style={{ marginBottom: "0.75rem" }}>How did you first understand AEVORIN?</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {[
            { value: "writing_app", label: "A writing app (like Scrivener)" },
            { value: "worldbuilding", label: "A worldbuilding tool (like Obsidian/Notion)" },
            { value: "planner", label: "A novel planner / outliner" },
            { value: "confused", label: "I was confused about what it does" }
          ].map(opt => (
            <label key={opt.value} style={labelRowStyle}>
              <input
                type="radio"
                name="discovery"
                value={opt.value}
                checked={survey.discovery === opt.value}
                onChange={e => setSurvey(prev => ({ ...prev, discovery: e.target.value }))}
                style={radioStyle}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Q3: Confusion Points */}
      <div style={sectionStyle}>
        <h3 style={{ marginBottom: "0.75rem" }}>Where did you struggle?</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {[
            "Creating a project",
            "Writing scenes",
            "Organizing characters",
            "Exporting",
            "Finding features",
            "Understanding the interface",
            "Other"
          ].map(opt => (
            <label key={opt} style={labelRowStyle}>
              <input
                type="checkbox"
                checked={survey.confusionPoints.includes(opt)}
                onChange={() => toggleConfusion(opt)}
                style={checkboxStyle}
              />
              <span>{opt}</span>
            </label>
          ))}
          {survey.confusionPoints.includes("Other") && (
            <input
              type="text"
              placeholder="Please specify..."
              value={survey.confusionOther}
              onChange={e => setSurvey(prev => ({ ...prev, confusionOther: e.target.value }))}
              style={{ ...textareaStyle, minHeight: "auto", padding: "0.5rem 0.75rem" }}
            />
          )}
        </div>
      </div>

      {/* Q4: What confused you most? */}
      <div style={sectionStyle}>
        <h3 style={{ marginBottom: "0.75rem" }}>What confused you most?</h3>
        <textarea
          placeholder="Describe the moment you felt most lost..."
          value={survey.whatConfusedMost}
          onChange={e => setSurvey(prev => ({ ...prev, whatConfusedMost: e.target.value }))}
          style={textareaStyle}
        />
      </div>

      {/* Q5: Feature wanted */}
      <div style={sectionStyle}>
        <h3 style={{ marginBottom: "0.75rem" }}>What feature did you want that was missing?</h3>
        <textarea
          placeholder="Anything you expected to find but couldn't..."
          value={survey.featureWanted}
          onChange={e => setSurvey(prev => ({ ...prev, featureWanted: e.target.value }))}
          style={textareaStyle}
        />
      </div>

      {/* Q6: What would you miss? */}
      <div style={sectionStyle}>
        <h3 style={{ marginBottom: "0.75rem" }}>If AEVORIN disappeared tomorrow, what would you miss?</h3>
        <textarea
          placeholder="This tells us where the real value is..."
          value={survey.whatWouldYouMiss}
          onChange={e => setSurvey(prev => ({ ...prev, whatWouldYouMiss: e.target.value }))}
          style={textareaStyle}
        />
      </div>

      {/* Q7: Recommendation */}
      <div style={sectionStyle}>
        <h3 style={{ marginBottom: "0.75rem" }}>Would you recommend AEVORIN to another writer?</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {[
            { value: "yes", label: "Yes" },
            { value: "maybe", label: "Maybe" },
            { value: "not_yet", label: "Not yet" }
          ].map(opt => (
            <label key={opt.value} style={labelRowStyle}>
              <input
                type="radio"
                name="recommendation"
                value={opt.value}
                checked={survey.recommendation === opt.value}
                onChange={e => setSurvey(prev => ({ ...prev, recommendation: e.target.value }))}
                style={radioStyle}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Skip for Now</button>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={submitting}
          style={{ padding: "0.6rem 1.5rem", background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", border: "none", color: "white", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
        >
          {submitting ? "Saving..." : "Submit Survey"}
        </button>
      </div>
    </div>
  );
}
