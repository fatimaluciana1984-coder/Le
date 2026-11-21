import { useMemo, useState } from 'react';
import { BookOpen, Flame, Play, Plus, Sparkles } from 'lucide-react';
import { BookItem, formatBRL, ReadingProgressRecord, UserProfile } from '../types/book';
import { BookCover } from './BookCover';

interface LibraryViewProps {
  books: BookItem[];
  progressMap: Record<string, ReadingProgressRecord>;
  userProfile: UserProfile | null;
  currentUserId: string | null;
  onOpenReader: (book: BookItem) => void;
  onAddReadingMinutes: (minutes: number) => void;
  onGoPublish: () => void;
}

const SHELF_FILTERS = ['Todos', 'Meus Livros', 'Ficção', 'Ensaios', 'Romance', 'Mistério'] as const;

export function LibraryView({
  books,
  progressMap,
  userProfile,
  currentUserId,
  onOpenReader,
  onAddReadingMinutes,
  onGoPublish,
}: LibraryViewProps) {
  const [activeFilter, setActiveFilter] = useState<string>('Todos');

  const dailyMinutes = userProfile?.dailyMinutes ?? 18;
  const dailyGoal = userProfile?.dailyGoalMinutes ?? 25;
  const dailyPct = Math.min(100, Math.round((dailyMinutes / dailyGoal) * 100));
  const streakDays = userProfile?.streakDays ?? 5;

  const featuredBook = useMemo(() => {
    const inProgress = books.find((b) => {
      const p = progressMap[b.id]?.percent ?? 0;
      return p > 0 && p < 100;
    });
    return inProgress || books[0];
  }, [books, progressMap]);

  const featuredPercent = featuredBook ? (progressMap[featuredBook.id]?.percent ?? 44) : 0;

  const filteredBooks = useMemo(() => {
    if (activeFilter === 'Todos') return books;
    if (activeFilter === 'Meus Livros') {
      return books.filter((b) => currentUserId && b.authorId === currentUserId);
    }
    return books.filter((b) => b.genre === activeFilter);
  }, [books, activeFilter, currentUserId]);

  const greetingName = userProfile?.displayName?.split(' ')[0] || 'leitor(a)';

  return (
    <div className="space-y-8">
      {/* Greeting & Quick CTA */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[#57423b]">Boa tarde, {greetingName}</p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#1c1c18] mt-1">
            Sua poltrona está pronta.
          </h1>
        </div>
        <button
          type="button"
          onClick={onGoPublish}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#9f3c16] text-white text-sm font-semibold hover:bg-[#bf542c] transition-colors whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Criar Novo Livro
        </button>
      </section>

      {/* Top Desktop Grid: Featured Continue Reading + Daily Goal */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {featuredBook && (
          <div className="lg:col-span-7 bg-[#f6f3ed] rounded-2xl p-6 shadow-[0_4px_20px_rgba(44,34,30,0.05)] flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <div className="flex gap-5 items-center min-w-0 flex-1">
              <BookCover
                preset={featuredBook.coverPreset}
                title={featuredBook.title}
                author={featuredBook.authorName}
                className="w-24 h-34 rounded-xl shadow-md shrink-0"
              />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2 text-xs text-[#9f3c16] font-semibold">
                  <span>Continuar lendo</span>
                  <span aria-hidden="true">·</span>
                  <span>{featuredBook.genre}</span>
                </div>
                <h2 className="font-editorial text-xl sm:text-2xl font-semibold text-[#1c1c18] truncate">
                  {featuredBook.title}
                </h2>
                <p className="text-sm text-[#57423b] truncate">por {featuredBook.authorName}</p>
                <div className="pt-2 space-y-1.5">
                  <div className="flex justify-between text-xs text-[#57423b] tabular-nums">
                    <span>{featuredPercent}% concluído</span>
                    <span>{formatBRL(featuredBook.priceCents)}</span>
                  </div>
                  <div className="w-full h-2 bg-[#e5e2dc] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#9f3c16] rounded-full transition-all duration-300"
                      style={{ width: `${featuredPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenReader(featuredBook)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#9f3c16] text-white text-sm font-semibold hover:bg-[#bf542c] transition-colors shrink-0 min-h-[44px] cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              Abrir Leitor
            </button>
          </div>
        )}

        {/* Daily Reading Goal */}
        <div className="lg:col-span-5 bg-[#f0eee8] rounded-2xl p-6 shadow-[0_4px_20px_rgba(44,34,30,0.04)] flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#ffddbb] text-[#805521] flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-editorial text-lg font-semibold text-[#1c1c18]">
                  Sequência de {streakDays} dias
                </h2>
                <p className="text-sm text-[#57423b] tabular-nums">
                  {dailyMinutes} / {dailyGoal} min hoje
                </p>
              </div>
            </div>
            <span className="text-xl font-bold text-[#805521] tabular-nums">{dailyPct}%</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 h-2">
            {Array.from({ length: 7 }).map((_, idx) => (
              <div
                key={idx}
                className={`rounded-full ${
                  idx < Math.min(7, streakDays)
                    ? 'bg-[#9f3c16]'
                    : idx === Math.min(6, streakDays)
                      ? 'bg-[#fec485]'
                      : 'bg-[#e5e2dc]'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-xs text-[#57423b]">
              {dailyMinutes >= dailyGoal
                ? 'Meta diária concluída hoje.'
                : `Faltam ${dailyGoal - dailyMinutes} minutos para a meta.`}
            </span>
            <button
              type="button"
              onClick={() => onAddReadingMinutes(5)}
              className="px-3.5 py-2 rounded-lg bg-[#fcf9f3] text-[#1c1c18] text-xs font-semibold hover:bg-white transition-colors whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer"
            >
              +5 min lidos
            </button>
          </div>
        </div>
      </section>

      {/* Bookshelf */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-editorial text-2xl font-semibold text-[#1c1c18]">Sua Estante</h2>

          <div className="flex items-center gap-1.5 p-1 bg-[#f0eee8] rounded-xl overflow-x-auto no-scrollbar">
            {SHELF_FILTERS.map((filter) => {
              const active = activeFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#fcf9f3] text-[#9f3c16] shadow-sm'
                      : 'text-[#57423b] hover:text-[#1c1c18]'
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>

        {filteredBooks.length === 0 ? (
          <div className="bg-[#f6f3ed] rounded-2xl p-10 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-[#9f3c16] mx-auto" />
            <h3 className="font-editorial text-lg font-semibold">Nenhum livro nesta prateleira</h3>
            <p className="text-sm text-[#57423b] max-w-md mx-auto">
              Você ainda não criou livros próprios ou não há títulos nesta categoria. Crie sua primeira obra agora.
            </p>
            <button
              type="button"
              onClick={onGoPublish}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#9f3c16] text-white text-sm font-semibold hover:bg-[#bf542c] transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Escrever meu primeiro livro
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
            {filteredBooks.map((book) => {
              const pct = progressMap[book.id]?.percent ?? 0;
              const isMine = currentUserId && book.authorId === currentUserId;
              return (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => onOpenReader(book)}
                  className="group text-left flex flex-col gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9f3c16] rounded-xl cursor-pointer"
                >
                  <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                    <BookCover
                      preset={book.coverPreset}
                      title={book.title}
                      author={book.authorName}
                      className="w-full h-full group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>
                  <div className="space-y-0.5 min-w-0 w-full">
                    <div className="flex items-center gap-1.5 text-xs text-[#57423b] truncate tabular-nums">
                      <span>{book.genre}</span>
                      <span aria-hidden="true">·</span>
                      <span className={pct === 100 ? 'text-[#29674b] font-semibold' : ''}>
                        {pct > 0 ? `${pct}%` : book.status === 'draft' ? 'Rascunho' : 'Novo'}
                      </span>
                      {isMine && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#9f3c16] font-semibold">Autoral</span>
                        </>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-[#1c1c18] truncate group-hover:text-[#9f3c16] transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-[#57423b] truncate">{book.authorName}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
