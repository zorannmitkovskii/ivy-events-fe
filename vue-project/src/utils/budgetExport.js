export function exportBudgetToCsv({ month, currency, summary, categories }) {
  const lines = [];

  lines.push(["Month", month].join(","));
  lines.push(["Currency", currency].join(","));
  lines.push("");

  lines.push("Summary");
  lines.push(["Total Budget", summary.totalBudget].join(","));
  lines.push(["Total Spent", summary.totalSpent].join(","));
  lines.push(["Remaining", summary.remaining].join(","));
  lines.push(["Spent Percent", summary.spentPercent].join(","));
  lines.push("");

  lines.push(["Categories", "Spent", "Budget", "Percent"].join(","));
  for (const c of categories || []) {
    lines.push([csv(c.name), c.spent, c.budget, c.percent].join(","));
  }

  const csvText = lines.join("\n");
  download(csvText, `budget-${month}.csv`, "text/csv;charset=utf-8");
}

function csv(v) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

function download(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
