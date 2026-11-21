import { useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  Code2,
  Download,
  Minus,
  Plus,
  Type,
} from 'lucide-react';
import { BookItem, ReadingProgressRecord } from '../types/book';
import { downloadBookHtml, generateBookHtml } from '../utils/htmlExport';

interface ReaderViewProps {
  book: BookItem;
  progress: ReadingProgressRecord | undefined;
  onUpdateProgress: (bookId: string, percent: number, bookmarked: boolean) => void;
  onBackToLibrary: () => void;
}

type ReaderTheme = 'cream' | 'sepia' | 'night';

const THEME_STYLES: Record<ReaderTheme, { bg: string; text: string; muted: string; border: string; label: string }> = {
  cream: {
    bg: 'bg-[#fcf9f3]',
    text: 'text-[#1c1c18]',
    muted: 'text-[#57423b]',
    border: 'border-[#dec0b7]/60',
    label: 'Clássico',
  },
  sepia: {
    bg: 'bg-[#f4ecd8]',
    text: 'text-[#3b2f27]',
    muted: 'text-[#6a5649]',
    border: 'border-[#d3c1a5]',
    label: 'Sépia',
  },
  night: {
    bg: 'bg-[#161917]',
    text: 'text-[#e3e6e1]',
    muted: 'text-[#a3aba4]',
    border: 'border-[#2e3530]',
    label: 'Noturno',
  },
};

export function ReaderView({
  book,
  progress,
  onUpdateProgress,
  onBackToLibrary,
}: ReaderViewProps) {
  const [theme, setTheme] = useState<ReaderTheme>('cream');
  const [fontSize, setFontSize] = useState<number>(19);
  const [showSettings, setShowSettings] = useState(false);
  const [showHtmlModal, setShowHtmlModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const percent = progress?.percent ?? 44;
  const bookmarked = progress?.bookmarked ?? false;
  const themeStyle = THEME_STYLES[theme];

  const paragraphs = book.content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const htmlOutput = generateBookHtml(book);

  const handleCopyHtml = async () => {
    await navigator.clipboard.writeText(htmlOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Reader Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#dec0b7]/50">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToLibrary}
            aria-label="Voltar para Biblioteca"
            className="min-h-[44px] min-w-[44px] px-3 rounded-lg bg-[#f0eee8] text-[#1c1c18] hover:bg-[#e5e2dc] inline-flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Estante</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSettings((prev) => !prev)}
            className={`min-h-[44px] px-3 rounded-lg inline-flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              showSettings
                ? 'bg-[#9f3c16] text-white'
                : 'bg-[#f0eee8] text-[#1c1c18] hover:bg-[#e5e2dc]'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Tipografia</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHtmlModal(true)}
            className="min-h-[44px] px-3 rounded-lg bg-[#f0eee8] text-[#1c1c18] hover:bg-[#e5e2dc] inline-flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Code2 className="w-4 h-4 text-[#9f3c16]" />
            <span>Ver HTML</span>
          </button>
        </div>

        <div className="text-xs text-[#57423b] truncate max-w-xs sm:max-w-md font-medium">
          <span className="font-editorial text-[#1c1c18] font-semibold">{book.title}</span>
          <span aria-hidden="true"> · </span>
          <span>{book.authorName}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadBookHtml(book)}
            className="min-h-[44px] px-3 rounded-lg bg-[#f0eee8] text-[#1c1c18] hover:bg-[#e5e2dc] inline-flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Baixar .html</span>
          </button>

          <button
            type="button"
            aria-label={bookmarked ? 'Remover marca-página' : 'Marcar página'}
            onClick={() => onUpdateProgress(book.id, percent, !bookmarked)}
            className={`min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              bookmarked
                ? 'bg-[#ffdbcf] text-[#9f3c16]'
                : 'bg-[#f0eee8] text-[#57423b] hover:text-[#1c1c18]'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Typography & Theme Drawer */}
      {showSettings && (
        <div className="bg-[#f6f3ed] border border-[#dec0b7]/60 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {(Object.keys(THEME_STYLES) as ReaderTheme[]).map((key) => {
              const active = theme === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTheme(key)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors min-h-[40px] cursor-pointer ${
                    active
                      ? 'border-[#9f3c16] bg-[#9f3c16] text-white'
                      : 'border-[#dec0b7] bg-[#fcf9f3] text-[#1c1c18]'
                  }`}
                >
                  {THEME_STYLES[key].label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-[#57423b]">Tamanho do texto</span>
            <button
              type="button"
              aria-label="Diminuir fonte"
              onClick={() => setFontSize((s) => Math.max(14, s - 1))}
              className="w-10 h-10 rounded-lg bg-[#ebe8e2] flex items-center justify-center text-[#1c1c18] hover:bg-[#e5e2dc] cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold tabular-nums w-10 text-center">{fontSize}px</span>
            <button
              type="button"
              aria-label="Aumentar fonte"
              onClick={() => setFontSize((s) => Math.min(26, s + 1))}
              className="w-10 h-10 rounded-lg bg-[#ebe8e2] flex items-center justify-center text-[#1c1c18] hover:bg-[#e5e2dc] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Reading Canvas */}
      <article
        className={`rounded-2xl border ${themeStyle.border} ${themeStyle.bg} ${themeStyle.text} px-6 sm:px-14 py-10 max-w-3xl mx-auto shadow-[0_4px_24px_rgba(44,34,30,0.06)] transition-colors duration-200`}
      >
        <header className={`pb-6 mb-8 border-b ${themeStyle.border}`}>
          <p className={`text-xs ${themeStyle.muted} mb-2`}>
            {book.genre} · {book.authorName}
          </p>
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold">{book.title}</h1>
        </header>

        <div className="space-y-6">
          {paragraphs.map((para, idx) => {
            if (para.startsWith('## ') || para.startsWith('# ')) {
              const headingText = para.replace(/^#+\s*/, '');
              return (
                <h2
                  key={idx}
                  className="font-editorial text-xl sm:text-2xl font-semibold pt-4 text-[#9f3c16]"
                >
                  {headingText}
                </h2>
              );
            }

            return (
              <p
                key={idx}
                className={`font-editorial text-justify ${
                  idx === 0 || (paragraphs[idx - 1]?.startsWith('#') && idx === 1)
                    ? 'first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:leading-none first-letter:text-[#9f3c16]'
                    : ''
                }`}
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: `${Math.round(fontSize * 1.65)}px`,
                }}
              >
                {para}
              </p>
            );
          })}
        </div>

        {/* Reading Progress Bar */}
        <footer className={`mt-12 pt-6 border-t ${themeStyle.border} space-y-3`}>
          <div className="flex items-center justify-between text-xs tabular-nums">
            <span className={`inline-flex items-center gap-1.5 ${themeStyle.muted}`}>
              <BookOpen className="w-4 h-4 text-[#9f3c16]" />
              Progresso da leitura
            </span>
            <span className="font-bold text-[#9f3c16]">{percent}% lido</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={percent}
            aria-label="Progresso de leitura em porcentagem"
            onChange={(e) => onUpdateProgress(book.id, Number(e.target.value), bookmarked)}
            className="w-full accent-[#9f3c16] cursor-pointer"
          />
        </footer>
      </article>

      {/* Complete HTML5 Code Modal */}
      {showHtmlModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fcf9f3] border border-[#dec0b7] rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#dec0b7]/60 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-editorial text-lg font-semibold text-[#1c1c18]">
                  Código HTML Completo — {book.title}
                </h3>
                <p className="text-xs text-[#57423b]">
                  Arquivo HTML5 independente com tipografia Literata pronta para publicar em qualquer site.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowHtmlModal(false)}
                className="px-3 py-2 rounded-lg bg-[#ebe8e2] text-xs font-semibold text-[#1c1c18] hover:bg-[#e5e2dc] cursor-pointer"
              >
                Fechar
              </button>
            </div>
            <pre className="p-5 text-xs font-mono bg-[#f6f3ed] text-[#1c1c18] overflow-auto flex-1 leading-relaxed">
              {htmlOutput}
            </pre>
            <div className="px-6 py-4 border-t border-[#dec0b7]/60 flex flex-wrap items-center justify-end gap-3 bg-[#fcf9f3]">
              <button
                type="button"
                onClick={() => void handleCopyHtml()}
                className="px-4 py-2.5 rounded-lg bg-[#ebe8e2] text-[#1c1c18] text-xs font-semibold hover:bg-[#e5e2dc] cursor-pointer"
              >
                {copied ? 'Código Copiado!' : 'Copiar Código HTML'}
              </button>
              <button
                type="button"
                onClick={() => downloadBookHtml(book)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#9f3c16] text-white text-xs font-semibold hover:bg-[#bf542c] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Baixar .html
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
