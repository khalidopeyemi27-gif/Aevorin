class ReadabilityService {
  /**
   * Estimates syllable count for a word using English vowels grouping heuristics.
   * Handles silent "e", double vowels, and common word structures.
   */
  countSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, "");
    if (word.length <= 3) return 1;
    // Remove silent "e" suffix
    word = word.replace(/(?:es|ed|[^laeiouy]e)$/, '');
    // Ignore leading y
    word = word.replace(/^y/, '');
    const vowels = word.match(/[aeiouy]{1,2}/g);
    return vowels ? vowels.length : 1;
  }

  /**
   * Computes Flesch Reading Ease score.
   */
  computeFleschReadingEase(text) {
    if (!text || text.trim() === "") return { score: 100, label: "Very Easy" };

    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    if (wordCount === 0) return { score: 100, label: "Very Easy" };

    // Segment sentences by basic punctuation triggers (. ! ?)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = sentences.length || 1;

    let totalSyllables = 0;
    for (const w of words) {
      totalSyllables += this.countSyllables(w);
    }

    // Flesch Reading Ease formula
    const score = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (totalSyllables / wordCount);
    const roundedScore = Math.max(0, Math.min(100, Math.round(score * 10) / 10));

    let label = "Standard";
    if (roundedScore >= 90) label = "Very Easy (5th Grade)";
    else if (roundedScore >= 80) label = "Easy (6th Grade)";
    else if (roundedScore >= 70) label = "Fairly Easy (7th Grade)";
    else if (roundedScore >= 60) label = "Standard (8th-9th Grade)";
    else if (roundedScore >= 50) label = "Fairly Difficult (10th-12th Grade)";
    else if (roundedScore >= 30) label = "Difficult (College Level)";
    else label = "Very Difficult (Academic/Post-Grad)";

    return {
      score: roundedScore,
      label,
      sentenceCount,
      wordCount,
      syllableCount: totalSyllables
    };
  }
}

module.exports = ReadabilityService;
