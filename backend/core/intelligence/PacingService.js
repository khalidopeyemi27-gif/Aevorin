class PacingService {
  /**
   * Computes pacing stats per chapter.
   */
  computeChapterPacing(chapters, scenes) {
    const chapterStats = [];

    for (const chap of chapters) {
      const chapScenes = scenes.filter(s => s.chapter_id === chap.id);
      const totalWords = chapScenes.reduce((sum, s) => sum + (s.word_count || 0), 0);
      const sceneCount = chapScenes.length;
      
      let averageSceneSize = 0;
      let shortestScene = null;
      let longestScene = null;
      let pacingVariance = 0;
      const flags = [];

      if (sceneCount > 0) {
        averageSceneSize = Math.round(totalWords / sceneCount);
        
        // Find shortest/longest
        const sorted = [...chapScenes].sort((a, b) => (a.word_count || 0) - (b.word_count || 0));
        shortestScene = { id: sorted[0].id, title: sorted[0].title, wordCount: sorted[0].word_count || 0 };
        longestScene = { id: sorted[sorted.length - 1].id, title: sorted[sorted.length - 1].title, wordCount: sorted[sorted.length - 1].word_count || 0 };

        // Compute variance (standard deviation of word counts)
        const sqDiffs = chapScenes.map(s => Math.pow((s.word_count || 0) - averageSceneSize, 2));
        const meanSqDiff = sqDiffs.reduce((sum, val) => sum + val, 0) / sceneCount;
        pacingVariance = Math.round(Math.sqrt(meanSqDiff));

        // Pacing anomaly checks (e.g. 30% shorter or longer than average)
        for (const s of chapScenes) {
          const w = s.word_count || 0;
          if (w < averageSceneSize * 0.7) {
            flags.push({
              sceneId: s.id,
              sceneTitle: s.title,
              type: "short_pacing",
              message: `Scene "${s.title}": 30%+ shorter than chapter average (${w} vs ${averageSceneSize} words)`
            });
          } else if (w > averageSceneSize * 1.3) {
            flags.push({
              sceneId: s.id,
              sceneTitle: s.title,
              type: "long_pacing",
              message: `Scene "${s.title}": 30%+ longer than chapter average (${w} vs ${averageSceneSize} words)`
            });
          }
        }
      }

      chapterStats.push({
        chapterId: chap.id,
        chapterTitle: chap.title,
        totalWords,
        sceneCount,
        averageSceneSize,
        shortestScene,
        longestScene,
        pacingVariance,
        flags
      });
    }

    return chapterStats;
  }
}

module.exports = PacingService;
