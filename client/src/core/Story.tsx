import { useState } from "react";

interface Scene {
  id: string;
  chapter_id: string | null;
  title: string;
  summary: string;
  pov_entity_id: string | null;
  purpose: string;
  conflict: string;
  outcome: string;
  word_count: number;
  status: string;
  mood: string;
}

interface Chapter {
  id: string;
  title: string;
}

interface Entity {
  id: string;
  type: string;
  title: string;
}

interface StoryProps {
  chapters: Chapter[];
  scenes: Scene[];
  entities: Entity[];
}

export default function Story({ chapters, scenes, entities }: StoryProps) {
  const [activeChapterFilter, setActiveChapterFilter] = useState<string | "all">("all");

  const getPOVName = (povId: string | null) => {
    if (!povId) return "None";
    const entity = entities.find(e => e.id === povId);
    return entity ? entity.title : "Unknown POV";
  };

  const filteredScenes = activeChapterFilter === "all"
    ? scenes
    : scenes.filter(s => s.chapter_id === activeChapterFilter);

  // Group scenes by chapters for outline summary list
  const scenesByChapter = chapters.map(ch => ({
    chapter: ch,
    scenes: scenes.filter(s => s.chapter_id === ch.id)
  }));

  const uncategorizedScenes = scenes.filter(s => !s.chapter_id);

  return (
    <div className="story-workspace">
      {/* View Sub-selector Navigation */}
      <div className="story-sub-header">
        <div className="filter-controls">
          <label>Filter Corkboard by Chapter:</label>
          <select
            value={activeChapterFilter}
            onChange={(e) => setActiveChapterFilter(e.target.value)}
          >
            <option value="all">All Scenes</option>
            {chapters.map(ch => (
              <option key={ch.id} value={ch.id}>{ch.title}</option>
            ))}
            <option value="uncategorized">Uncategorized</option>
          </select>
        </div>
      </div>

      {/* Main Double Tab Layout: Split Outline Index on Left, Corkboard Card Deck on Right */}
      <div className="story-split-container">
        {/* Left Side: Summary Index */}
        <aside className="story-outline-index">
          <h3>Outline Overview</h3>
          <div className="outline-scroll-list">
            {scenesByChapter.map(({ chapter, scenes }) => (
              <div key={chapter.id} className="outline-chapter-item">
                <strong>{chapter.title}</strong>
                <ul>
                  {scenes.map(s => (
                    <li key={s.id}>
                      <span className="bullet">•</span> {s.title} <span className="wordcount">({s.word_count} words)</span>
                    </li>
                  ))}
                  {scenes.length === 0 && <li className="empty-li">No scenes</li>}
                </ul>
              </div>
            ))}
            {uncategorizedScenes.length > 0 && (
              <div className="outline-chapter-item">
                <strong>Uncategorized Scenes</strong>
                <ul>
                  {uncategorizedScenes.map(s => (
                    <li key={s.id}>
                      <span className="bullet">•</span> {s.title} <span className="wordcount">({s.word_count} words)</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>

        {/* Right Side: Corkboard Visual Cards Deck */}
        <section className="story-corkboard">
          {filteredScenes.length === 0 ? (
            <div className="empty-corkboard">
              <p>No scene cards match the active filter. Add scenes inside the Manuscript workspace to view cards on the corkboard.</p>
            </div>
          ) : (
            <div className="corkboard-grid">
              {filteredScenes.map((scene) => (
                <div key={scene.id} className={`corkboard-card status-${scene.status}`}>
                  <div className="card-header">
                    <h4>{scene.title}</h4>
                    <span className="card-status-badge">{scene.status.replace("_", " ")}</span>
                  </div>
                  <div className="card-body">
                    <div className="card-meta-row">
                      <strong>POV:</strong> <span>{getPOVName(scene.pov_entity_id)}</span>
                    </div>
                    {scene.mood && (
                      <div className="card-meta-row">
                        <strong>Mood:</strong> <span>{scene.mood}</span>
                      </div>
                    )}
                    {scene.purpose && (
                      <div className="card-text-block">
                        <strong>Purpose:</strong>
                        <p>{scene.purpose}</p>
                      </div>
                    )}
                    {scene.conflict && (
                      <div className="card-text-block">
                        <strong>Conflict:</strong>
                        <p>{scene.conflict}</p>
                      </div>
                    )}
                    {scene.outcome && (
                      <div className="card-text-block">
                        <strong>Outcome:</strong>
                        <p>{scene.outcome}</p>
                      </div>
                    )}
                    {scene.summary && (
                      <div className="card-text-block synopsis">
                        <strong>Synopsis:</strong>
                        <p>{scene.summary}</p>
                      </div>
                    )}
                  </div>
                  <div className="card-footer">
                    <span>Words: {scene.word_count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
