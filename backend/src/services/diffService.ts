interface DiffLine {
    type: 'add' | 'remove' | 'unchanged' | 'info';
    content: string;
    oldLineNumber?: number;
    newLineNumber?: number;
}

interface DiffHunk {
    oldStart: number;
    oldCount: number;
    newStart: number;
    newCount: number;
    lines: DiffLine[];
}

interface DiffResult {
    hunks: DiffHunk[];
    additions: number;
    deletions: number;
    changes: number;
}

class DiffService {
    /**
     * Compute line-by-line diff between two strings
     */
    computeDiff(oldCode: string, newCode: string): DiffResult {
        const oldLines = oldCode.split('\n');
        const newLines = newCode.split('\n');

        const lcs = this.longestCommonSubsequence(oldLines, newLines);
        const hunks = this.buildHunks(oldLines, newLines, lcs);

        let additions = 0;
        let deletions = 0;

        hunks.forEach(hunk => {
            hunk.lines.forEach(line => {
                if (line.type === 'add') additions++;
                if (line.type === 'remove') deletions++;
            });
        });

        return {
            hunks,
            additions,
            deletions,
            changes: additions + deletions
        };
    }

    /**
     * Parse a unified diff patch (GitHub format)
     */
    parsePatch(patch: string): DiffHunk[] {
        if (!patch) return [];

        const lines = patch.split('\n');
        const hunks: DiffHunk[] = [];
        let currentHunk: DiffHunk | null = null;
        let oldLine = 0;
        let newLine = 0;

        for (const line of lines) {
            // Hunk header: @@ -oldStart,oldCount +newStart,newCount @@
            const hunkMatch = line.match(/^@@\s*-(\d+)(?:,(\d+))?\s*\+(\d+)(?:,(\d+))?\s*@@/);

            if (hunkMatch) {
                if (currentHunk) {
                    hunks.push(currentHunk);
                }
                currentHunk = {
                    oldStart: parseInt(hunkMatch[1], 10),
                    oldCount: parseInt(hunkMatch[2] || '1', 10),
                    newStart: parseInt(hunkMatch[3], 10),
                    newCount: parseInt(hunkMatch[4] || '1', 10),
                    lines: []
                };
                oldLine = currentHunk.oldStart;
                newLine = currentHunk.newStart;
                continue;
            }

            if (!currentHunk) continue;

            if (line.startsWith('+')) {
                currentHunk.lines.push({
                    type: 'add',
                    content: line.substring(1),
                    newLineNumber: newLine++
                });
            } else if (line.startsWith('-')) {
                currentHunk.lines.push({
                    type: 'remove',
                    content: line.substring(1),
                    oldLineNumber: oldLine++
                });
            } else if (line.startsWith(' ') || line === '') {
                currentHunk.lines.push({
                    type: 'unchanged',
                    content: line.substring(1) || '',
                    oldLineNumber: oldLine++,
                    newLineNumber: newLine++
                });
            }
        }

        if (currentHunk) {
            hunks.push(currentHunk);
        }

        return hunks;
    }

    /**
     * Generate unified diff format
     */
    toUnifiedDiff(oldCode: string, newCode: string, oldFileName = 'a/file', newFileName = 'b/file'): string {
        const diff = this.computeDiff(oldCode, newCode);
        let output = `--- ${oldFileName}\n+++ ${newFileName}\n`;

        diff.hunks.forEach(hunk => {
            output += `@@ -${hunk.oldStart},${hunk.oldCount} +${hunk.newStart},${hunk.newCount} @@\n`;

            hunk.lines.forEach(line => {
                const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';
                output += `${prefix}${line.content}\n`;
            });
        });

        return output;
    }

    /**
     * Generate HTML representation of diff
     */
    toHTML(diff: DiffResult | string, inline = true): string {
        let hunks: DiffHunk[];

        if (typeof diff === 'string') {
            hunks = this.parsePatch(diff);
        } else {
            hunks = diff.hunks;
        }

        const styles = `
            <style>
                .diff-viewer { font-family: 'Fira Code', monospace; font-size: 13px; background: #161b22; border-radius: 8px; overflow: hidden; }
                .diff-hunk { border-bottom: 1px solid #30363d; }
                .diff-hunk:last-child { border-bottom: none; }
                .diff-header { background: #21262d; color: #8b949e; padding: 8px 12px; font-size: 12px; }
                .diff-line { display: flex; min-height: 20px; }
                .diff-line-number { min-width: 50px; padding: 0 8px; text-align: right; color: #6e7681; background: #161b22; user-select: none; }
                .diff-line-content { flex: 1; padding: 0 12px; white-space: pre-wrap; word-break: break-all; }
                .diff-add { background: rgba(46, 160, 67, 0.15); }
                .diff-add .diff-line-content { color: #3fb950; }
                .diff-add .diff-line-number { background: rgba(46, 160, 67, 0.1); color: #3fb950; }
                .diff-remove { background: rgba(248, 81, 73, 0.15); }
                .diff-remove .diff-line-content { color: #f85149; }
                .diff-remove .diff-line-number { background: rgba(248, 81, 73, 0.1); color: #f85149; }
                .diff-unchanged { background: #0d1117; }
                .diff-unchanged .diff-line-content { color: #c9d1d9; }
            </style>
        `;

        let html = `<div class="diff-viewer">${styles}`;

        hunks.forEach((hunk, hunkIndex) => {
            html += `<div class="diff-hunk">`;
            html += `<div class="diff-header">@@ -${hunk.oldStart},${hunk.oldCount} +${hunk.newStart},${hunk.newCount} @@</div>`;

            hunk.lines.forEach(line => {
                const className = line.type === 'add' ? 'diff-add' :
                    line.type === 'remove' ? 'diff-remove' :
                        'diff-unchanged';

                html += `<div class="diff-line ${className}">`;
                html += `<div class="diff-line-number">${line.oldLineNumber || ''}</div>`;
                html += `<div class="diff-line-number">${line.newLineNumber || ''}</div>`;
                html += `<div class="diff-line-content">${this.escapeHtml(line.content)}</div>`;
                html += `</div>`;
            });

            html += `</div>`;
        });

        html += `</div>`;
        return html;
    }

    /**
     * LCS algorithm for diff computation
     */
    private longestCommonSubsequence(a: string[], b: string[]): number[][] {
        const m = a.length;
        const n = b.length;
        const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (a[i - 1] === b[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }

        return dp;
    }

    /**
     * Build hunks from LCS
     */
    private buildHunks(oldLines: string[], newLines: string[], lcs: number[][]): DiffHunk[] {
        const hunks: DiffHunk[] = [];
        const diffLines: DiffLine[] = [];

        let i = oldLines.length;
        let j = newLines.length;
        let oldLineNum = oldLines.length;
        let newLineNum = newLines.length;

        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
                diffLines.unshift({
                    type: 'unchanged',
                    content: oldLines[i - 1],
                    oldLineNumber: oldLineNum--,
                    newLineNumber: newLineNum--
                });
                i--;
                j--;
            } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
                diffLines.unshift({
                    type: 'add',
                    content: newLines[j - 1],
                    newLineNumber: newLineNum--
                });
                j--;
            } else if (i > 0 && (j === 0 || lcs[i][j - 1] < lcs[i - 1][j])) {
                diffLines.unshift({
                    type: 'remove',
                    content: oldLines[i - 1],
                    oldLineNumber: oldLineNum--
                });
                i--;
            }
        }

        // Group into hunks (context of 3 lines)
        if (diffLines.length === 0) return [];

        let currentHunk: DiffHunk | null = null;
        let unchangedCount = 0;
        const contextLines = 3;

        for (let idx = 0; idx < diffLines.length; idx++) {
            const line = diffLines[idx];
            const isChange = line.type !== 'unchanged';

            if (isChange) {
                if (currentHunk === null) {
                    // Start new hunk with context
                    const startIdx = Math.max(0, idx - contextLines);
                    currentHunk = {
                        oldStart: diffLines[startIdx].oldLineNumber || 1,
                        oldCount: 0,
                        newStart: diffLines[startIdx].newLineNumber || 1,
                        newCount: 0,
                        lines: diffLines.slice(startIdx, idx)
                    };
                }
                currentHunk.lines.push(line);
                unchangedCount = 0;
            } else {
                if (currentHunk !== null) {
                    currentHunk.lines.push(line);
                    unchangedCount++;

                    if (unchangedCount > contextLines * 2) {
                        // End current hunk
                        currentHunk.lines = currentHunk.lines.slice(0, -contextLines);
                        currentHunk.oldCount = currentHunk.lines.filter((l: DiffLine) => l.type !== 'add').length;
                        currentHunk.newCount = currentHunk.lines.filter((l: DiffLine) => l.type !== 'remove').length;
                        hunks.push(currentHunk);
                        currentHunk = null;
                        unchangedCount = 0;
                    }
                }
            }
        }

        if (currentHunk !== null) {
            currentHunk.oldCount = currentHunk.lines.filter((l: DiffLine) => l.type !== 'add').length;
            currentHunk.newCount = currentHunk.lines.filter((l: DiffLine) => l.type !== 'remove').length;
            hunks.push(currentHunk);
        }

        return hunks;
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
}

export const diffService = new DiffService();
export { DiffService, DiffResult, DiffHunk, DiffLine };
export default diffService;
