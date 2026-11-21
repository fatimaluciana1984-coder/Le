import { BookItem, COVER_PRESET_INFO } from '../types/book';

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatContentToHtml(content: string): string {
  const lines = content.split(/\r?\n/);
  const blocks: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('## ')) {
      blocks.push(`      <h2>${escapeHtml(line.slice(3))}</h2>`);
    } else if (line.startsWith('# ')) {
      blocks.push(`      <h2>${escapeHtml(line.slice(2))}</h2>`);
    } else {
      blocks.push(`      <p>${escapeHtml(line)}</p>`);
    }
  }

  return blocks.join('\n');
}

export function generateBookHtml(book: BookItem): string {
  const accent = COVER_PRESET_INFO[book.coverPreset]?.accentColor || '#9f3c16';
  const safeTitle = escapeHtml(book.title);
  const safeAuthor = escapeHtml(book.authorName);
  const safeSynopsis = escapeHtml(book.synopsis);
  const safeGenre = escapeHtml(book.genre);
  const bodyHtml = formatContentToHtml(book.content);
  const priceLabel =
    book.priceCents > 0
      ? (book.priceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : 'Edição Gratuita';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle} — ${safeAuthor}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Literata:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #fcf9f3;
      --surface: #f6f3ed;
      --ink: #1c1c18;
      --muted: #57423b;
      --accent: ${accent};
      --border: #dec0b7;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 2rem 1.25rem 4rem;
      background-color: var(--bg);
      color: var(--ink);
      font-family: 'Literata', Georgia, serif;
      line-height: 1.85;
    }
    .container {
      max-width: 720px;
      margin: 0 auto;
    }
    .cover {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 2.5rem 2rem;
      margin-bottom: 2.5rem;
    }
    .meta {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.85rem;
      color: var(--muted);
      margin-bottom: 0.75rem;
    }
    h1 {
      margin: 0 0 0.5rem;
      font-size: clamp(1.9rem, 4vw, 2.75rem);
      line-height: 1.2;
      color: var(--ink);
    }
    .author {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 600;
      color: var(--accent);
      margin: 0 0 1.25rem;
    }
    .synopsis {
      margin: 0;
      font-size: 1.05rem;
      color: var(--muted);
    }
    article h2 {
      font-size: 1.5rem;
      margin: 2.25rem 0 0.9rem;
      color: var(--accent);
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.4rem;
    }
    article p {
      font-size: 1.12rem;
      margin: 0 0 1.3rem;
      text-align: justify;
    }
    footer {
      margin-top: 3.5rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border);
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.85rem;
      color: var(--muted);
      text-align: center;
    }
  </style>
</head>
<body>
  <main class="container">
    <header class="cover">
      <div class="meta">${safeGenre} · ${escapeHtml(priceLabel)}</div>
      <h1>${safeTitle}</h1>
      <p class="author">Por ${safeAuthor}</p>
      <p class="synopsis">${safeSynopsis}</p>
    </header>
    <article>
${bodyHtml}
    </article>
    <footer>
      Publicado com Ateliê Literário · Documento HTML5 independente
    </footer>
  </main>
</body>
</html>`;
}

export function downloadBookHtml(book: BookItem): void {
  const html = generateBookHtml(book);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const slug =
    book.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'meu-livro';
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${slug}.html`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
