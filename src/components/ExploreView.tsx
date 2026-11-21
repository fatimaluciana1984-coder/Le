import { useMemo, useState } from 'react';
import { BookOpen, Check, Flame, Search, ShoppingBag, Star } from 'lucide-react';
import { BOOK_GENRES, BookItem, formatBRL } from '../types/book';
import { BookCover } from './BookCover';

interface ExploreViewProps {
  publishedBooks: BookItem[];
  purchasedBookIds: Set<string>;
  currentUserId: string | null;
  onOpenReader: (book: BookItem) => void;
  onPurchaseBook: (book: BookItem) => Promise<void>;
  onRequireSignIn: () => void;
}

export function ExploreView({
  publishedBooks,
  purchasedBookIds,
  currentUserId,
  onOpenReader,
  onPurchaseBook,
  onRequireSignIn,
}: ExploreViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('Todos');
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const filteredBooks = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return publishedBooks.filter((book) => {
      const matchesGenre = selectedGenre === 'Todos' || book.genre === selectedGenre;
      const matchesQuery =
        !q ||
        book.title.toLowerCase().includes(q) ||
        book.authorName.toLowerCase().includes(q) ||
        book.genre.toLowerCase().includes(q);
      return matchesGenre && matchesQuery;
    });
  }, [publishedBooks, searchTerm, selectedGenre]);

  const spotlight = publishedBooks[1] || publishedBooks[0];

  const handleBuy = async (book: BookItem) => {
    if (!currentUserId) {
      onRequireSignIn();
      return;
    }
    setBuyingId(book.id);
    try {
      await onPurchaseBook(book);
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Search */}
      <section className="space-y-5">
        <div>
          <p className="text-sm text-[#57423b]">Catálogo aberto da comunidade</p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#1c1c18] mt-1">
            Explorar o Catálogo
          </h1>
        </div>

        <div className="relative max-w-2xl">
          <Search className="w-5 h-5 text-[#8a726a] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Busque por título, autor ou gênero..."
            aria-label="Buscar livros"
            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#f6f3ed] border border-[#dec0b7]/60 text-sm text-[#1c1c18] placeholder:text-[#8a726a] focus:outline-none focus:ring-2 focus:ring-[#9f3c16]"
          />
        </div>

        {/* Category Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {['Todos', ...BOOK_GENRES].map((genre) => {
            const active = selectedGenre === genre;
            return (
              <button
                key={genre}
                type="button"
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors min-h-[40px] cursor-pointer ${
                  active
                    ? 'bg-[#9f3c16] text-white'
                    : 'bg-[#ebe8e2] text-[#57423b] hover:bg-[#e5e2dc] hover:text-[#1c1c18]'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Spotlight */}
      {spotlight && !searchTerm && selectedGenre === 'Todos' && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#9f3c16]">
            <Flame className="w-4 h-4" />
            <span>Destaque da Semana</span>
          </div>

          <div className="bg-[#f6f3ed] rounded-2xl p-6 shadow-[0_4px_20px_rgba(44,34,30,0.05)] flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <BookCover
              preset={spotlight.coverPreset}
              title={spotlight.title}
              author={spotlight.authorName}
              className="w-28 h-40 rounded-xl shadow-md shrink-0"
            />
            <div className="flex-1 min-w-0 space-y-2.5">
              <div className="flex items-center gap-2 text-xs text-[#57423b]">
                <span className="font-semibold text-[#9f3c16]">#1 em {spotlight.genre}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  {spotlight.rating?.toFixed(1) ?? '4.8'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-[#1c1c18] tabular-nums">
                  {formatBRL(spotlight.priceCents)}
                </span>
              </div>
              <h2 className="font-editorial text-2xl font-semibold text-[#1c1c18]">
                {spotlight.title}
              </h2>
              <p className="text-sm text-[#57423b] leading-relaxed max-w-2xl line-clamp-2">
                {spotlight.synopsis}
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onOpenReader(spotlight)}
                  className="px-5 py-2.5 rounded-lg bg-[#9f3c16] text-white text-sm font-semibold hover:bg-[#bf542c] transition-colors whitespace-nowrap min-h-[44px] cursor-pointer"
                >
                  Ler Amostra
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Catalog Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-2xl font-semibold text-[#1c1c18]">
            Livros Publicados
          </h2>
          <span className="text-xs text-[#57423b] tabular-nums">
            {filteredBooks.length} título(s)
          </span>
        </div>

        {filteredBooks.length === 0 ? (
          <div className="bg-[#f6f3ed] rounded-2xl p-10 text-center space-y-2">
            <BookOpen className="w-7 h-7 text-[#9f3c16] mx-auto" />
            <p className="font-editorial text-lg font-semibold">Nenhum título encontrado</p>
            <p className="text-sm text-[#57423b]">
              Tente outro termo de busca ou explore todas as categorias.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => {
              const isAuthor = currentUserId === book.authorId;
              const isOwned =
                book.priceCents === 0 || isAuthor || purchasedBookIds.has(book.id);
              const isCurated = Boolean(book.isCurated);

              return (
                <article
                  key={book.id}
                  className="bg-[#f6f3ed] rounded-2xl p-4 shadow-[0_4px_20px_rgba(44,34,30,0.04)] flex gap-4 items-stretch"
                >
                  <BookCover
                    preset={book.coverPreset}
                    title={book.title}
                    author={book.authorName}
                    className="w-24 h-36 rounded-xl shadow-sm shrink-0"
                  />
                  <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-[#57423b] truncate">
                        <span>{book.genre}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-[#9f3c16] tabular-nums">
                          {formatBRL(book.priceCents)}
                        </span>
                      </div>
                      <h3 className="font-editorial text-lg font-semibold text-[#1c1c18] line-clamp-1">
                        {book.title}
                      </h3>
                      <p className="text-xs text-[#57423b] truncate">{book.authorName}</p>
                      <p className="text-xs text-[#57423b] line-clamp-2 pt-1 leading-relaxed">
                        {book.synopsis}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-3">
                      <button
                        type="button"
                        onClick={() => onOpenReader(book)}
                        className="flex-1 px-3 py-2 rounded-lg bg-[#ebe8e2] text-[#1c1c18] text-xs font-semibold hover:bg-[#e5e2dc] transition-colors whitespace-nowrap min-h-[40px] cursor-pointer"
                      >
                        {isOwned ? 'Ler Agora' : 'Ler Amostra'}
                      </button>

                      {book.priceCents > 0 && !isCurated && !isAuthor && (
                        <button
                          type="button"
                          disabled={isOwned || buyingId === book.id}
                          onClick={() => void handleBuy(book)}
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap min-h-[40px] transition-colors ${
                            isOwned
                              ? 'bg-[#b0f1cd] text-[#002113] cursor-default'
                              : 'bg-[#9f3c16] text-white hover:bg-[#bf542c] cursor-pointer'
                          }`}
                        >
                          {isOwned ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Adquirido
                            </>
                          ) : buyingId === book.id ? (
                            'Processando...'
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5" />
                              Adquirir
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
