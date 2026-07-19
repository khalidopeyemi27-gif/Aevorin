export interface DiffChange {
  type: "insert" | "delete" | "equal";
  text: string;
}

export interface DiffResult {
  changes: DiffChange[];
}

/**
 * Computes a word-level diff between oldContent and newContent.
 * Returns an array of changes (insert, delete, equal) grouped dynamically.
 */
export function computeDiff(oldContent: string, newContent: string): DiffResult {
  if (!oldContent) {
    return { changes: [{ type: "insert", text: newContent }] };
  }
  if (!newContent) {
    return { changes: [{ type: "delete", text: oldContent }] };
  }

  // Split content into words and whitespace preservation blocks
  const oldWords = oldContent.split(/(\s+)/);
  const newWords = newContent.split(/(\s+)/);

  const n = oldWords.length;
  const m = newWords.length;

  // LCS Dynamic Programming matrix
  const dp: number[][] = Array(n + 1)
    .fill(null)
    .map(() => Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const rawChanges: DiffChange[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      rawChanges.unshift({ type: "equal", text: oldWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawChanges.unshift({ type: "insert", text: newWords[j - 1] });
      j--;
    } else {
      rawChanges.unshift({ type: "delete", text: oldWords[i - 1] });
      i--;
    }
  }

  // Merge contiguous tokens of the same edit type to minimize element overhead
  const grouped: DiffChange[] = [];
  for (const token of rawChanges) {
    if (!token.text) continue;
    const last = grouped[grouped.length - 1];
    if (last && last.type === token.type) {
      last.text += token.text;
    } else {
      grouped.push({ ...token });
    }
  }

  return { changes: grouped };
}
