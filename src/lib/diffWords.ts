// Word-level diff for comparing prompt/tool-description text between AB-test
// versions. Classic LCS-based diff, tokenized on words (each token keeps its
// trailing whitespace so re-joining tokens reproduces the original text
// exactly, including newlines).

export type DiffToken = { type: "equal" | "insert" | "delete"; text: string };

function tokenize(text: string): string[] {
  return text.match(/\S+\s*|\s+/g) ?? [];
}

export function diffWords(oldText: string, newText: string): DiffToken[] {
  const a = tokenize(oldText);
  const b = tokenize(newText);
  const n = a.length;
  const m = b.length;

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const tokens: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      tokens.push({ type: "equal", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      tokens.push({ type: "delete", text: a[i] });
      i++;
    } else {
      tokens.push({ type: "insert", text: b[j] });
      j++;
    }
  }
  while (i < n) {
    tokens.push({ type: "delete", text: a[i] });
    i++;
  }
  while (j < m) {
    tokens.push({ type: "insert", text: b[j] });
    j++;
  }

  const merged: DiffToken[] = [];
  for (const t of tokens) {
    const last = merged[merged.length - 1];
    if (last && last.type === t.type) last.text += t.text;
    else merged.push({ ...t });
  }
  return merged;
}
