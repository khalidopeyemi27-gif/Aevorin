import { db } from "../../lib/db";

export interface ProofreadResult {
  originalText: string;
  correctedText: string;
  genre: string;
  changesCount: number;
  explanations: {
    type: "grammar" | "tone" | "continuity" | "dialogue";
    message: string;
    before?: string;
    after?: string;
  }[];
}

export class GenreEditorEngine {
  public static async proofreadAndEdit(
    projectId: string,
    text: string,
    genre: string = "Fantasy"
  ): Promise<ProofreadResult> {
    if (!text || !text.trim()) {
      return {
        originalText: text,
        correctedText: text,
        genre,
        changesCount: 0,
        explanations: []
      };
    }

    const explanations: ProofreadResult["explanations"] = [];
    let processed = text;

    // 1. Basic Grammar & Typo Rules
    // Double spaces
    if (/\s{2,}/.test(processed)) {
      processed = processed.replace(/ {2,}/g, " ");
      explanations.push({
        type: "grammar",
        message: "Cleaned up extra consecutive spaces."
      });
    }

    // Repeated words (e.g. "the the")
    const doubleWordRegex = /\b(\w+)\s+\1\b/gi;
    if (doubleWordRegex.test(processed)) {
      processed = processed.replace(doubleWordRegex, (match, word) => {
        explanations.push({
          type: "grammar",
          message: `Removed duplicate word '${word}'.`,
          before: match,
          after: word
        });
        return word;
      });
    }

    // Unclosed quotation marks in dialogue
    const quoteCount = (processed.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      explanations.push({
        type: "grammar",
        message: "Notice: Odd number of quotation marks detected in dialogue selection."
      });
    }

    // 2. Story Bible Continuity Checks
    try {
      const entities = await db.storyEntities.where("projectId").equals(projectId).toArray();
      for (const ent of entities) {
        if (!ent.title) continue;
        const nameLower = ent.title.toLowerCase();
        // Check for common misspellings (e.g. single letter off)
        const words = processed.split(/\s+/);
        for (const w of words) {
          const cleanW = w.replace(/[^a-zA-Z]/g, "");
          if (cleanW.length >= 4 && cleanW.toLowerCase() !== nameLower) {
            // Check Levenshtein distance 1
            if (this.levenshtein(cleanW.toLowerCase(), nameLower) === 1) {
              const regex = new RegExp(`\\b${cleanW}\\b`, "g");
              processed = processed.replace(regex, ent.title);
              explanations.push({
                type: "continuity",
                message: `Corrected potential name typo to match Story Bible entity '${ent.title}'.`,
                before: cleanW,
                after: ent.title
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn("[GenreEditorEngine] Story Bible check skipped:", e);
    }

    // 3. Genre-Specific Tone & Vocabulary Enhancements
    const normGenre = genre.toLowerCase();

    if (normGenre.includes("dark") || normGenre.includes("gothic") || normGenre.includes("horror")) {
      // Replace weak verbs with atmospheric ones
      const replacements: [RegExp, string, string][] = [
        [/\bwalked slowly\b/gi, "stalked silently", "Dark Fantasy atmosphere"],
        [/\blooked at\b/gi, "gazed intently into", "Evocative imagery"],
        [/\bvery cold\b/gi, "bitterly freezing", "Sensory detail"],
        [/\bsaid angrily\b/gi, "snarled", "Punchy dialogue tag"],
      ];

      for (const [pattern, repl, reason] of replacements) {
        if (pattern.test(processed)) {
          processed = processed.replace(pattern, (match) => {
            explanations.push({
              type: "tone",
              message: `Enhanced for ${genre}: ${reason}`,
              before: match,
              after: repl
            });
            return repl;
          });
        }
      }
    } else if (normGenre.includes("sci-fi") || normGenre.includes("cyberpunk") || normGenre.includes("space")) {
      const replacements: [RegExp, string, string][] = [
        [/\bbig spaceship\b/gi, "dreadnought vessel", "Sci-Fi precision"],
        [/\bcomputer system\b/gi, "neural interface matrix", "Futuristic vocabulary"],
        [/\bturned on\b/gi, "initialized", "Technical tone"],
      ];

      for (const [pattern, repl, reason] of replacements) {
        if (pattern.test(processed)) {
          processed = processed.replace(pattern, (match) => {
            explanations.push({
              type: "tone",
              message: `Enhanced for ${genre}: ${reason}`,
              before: match,
              after: repl
            });
            return repl;
          });
        }
      }
    } else if (normGenre.includes("light novel") || normGenre.includes("anime") || normGenre.includes("fantasy")) {
      const replacements: [RegExp, string, string][] = [
        [/\bhe was very strong\b/gi, "his aura flared with overwhelming power", "Light Novel flair"],
        [/\bshe smiled\b/gi, "a faint, mysterious smirk touched her lips", "Character beat"],
      ];

      for (const [pattern, repl, reason] of replacements) {
        if (pattern.test(processed)) {
          processed = processed.replace(pattern, (match) => {
            explanations.push({
              type: "tone",
              message: `Enhanced for ${genre}: ${reason}`,
              before: match,
              after: repl
            });
            return repl;
          });
        }
      }
    }

    return {
      originalText: text,
      correctedText: processed,
      genre,
      changesCount: explanations.length,
      explanations
    };
  }

  private static levenshtein(a: string, b: string): number {
    const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[a.length][b.length];
  }
}
