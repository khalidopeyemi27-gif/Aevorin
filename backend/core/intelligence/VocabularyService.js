class VocabularyService {
  constructor() {
    // Standard set of stopwords to filter repeated keywords
    this.stopWords = new Set([
      "the", "a", "an", "and", "or", "but", "if", "then", "of", "to", "in", "on", "at", 
      "for", "with", "by", "about", "as", "is", "was", "were", "are", "be", "been", "he", 
      "she", "they", "it", "i", "you", "we", "his", "her", "their", "my", "your", "our",
      "him", "me", "them", "us", "myself", "himself", "herself", "themselves"
    ]);
  }

  /**
   * Computes vocabulary metrics.
   */
  computeVocabulary(text) {
    if (!text || text.trim() === "") {
      return { uniqueCount: 0, ttr: 100, repeatedPhrases: [] };
    }

    const words = text.toLowerCase().split(/\s+/).filter(w => w.match(/^[a-z]+$/));
    const totalWords = words.length;
    if (totalWords === 0) {
      return { uniqueCount: 0, ttr: 100, repeatedPhrases: [] };
    }

    const frequency = {};
    for (const w of words) {
      frequency[w] = (frequency[w] || 0) + 1;
    }

    // Type-Token Ratio (TTR): unique / total
    const uniqueCount = Object.keys(frequency).length;
    const ttr = Math.round((uniqueCount / totalWords) * 1000) / 10;

    // Repeated phrases: let's scan for repeated 3-word combinations (trigrams)
    const trigrams = {};
    for (let k = 0; k < words.length - 2; k++) {
      // Skip if any word is a stopword to avoid unhelpful phrases like "in the morning"
      if (this.stopWords.has(words[k]) && this.stopWords.has(words[k+1]) && this.stopWords.has(words[k+2])) {
        continue;
      }
      const phrase = `${words[k]} ${words[k+1]} ${words[k+2]}`;
      trigrams[phrase] = (trigrams[phrase] || 0) + 1;
    }

    const repeatedPhrases = Object.entries(trigrams)
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([phrase, count]) => ({ phrase, count }));

    return {
      uniqueCount,
      ttr,
      repeatedPhrases
    };
  }
}

module.exports = VocabularyService;
