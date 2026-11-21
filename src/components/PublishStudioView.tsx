import React, { useMemo, useState } from 'react';
import {
  BadgeCheck,
  BookPlus,
  Code2,
  Download,
  Lock,
  ShieldAlert,
  Trash2,
  Wallet,
} from 'lucide-react';
import {
  BOOK_GENRES,
  BookGenre,
  BookItem,
  calculateAge,
  COVER_PRESET_INFO,
  CoverPreset,
  CreatorPayout,
  formatBRL,
  PixKeyType,
  PurchaseRecord,
  VALIDATION_BOUNDS,
} from '../types/book';
import { downloadBookHtml, generateBookHtml } from '../utils/htmlExport';
import { BookCover } from './BookCover';

interface PublishStudioViewProps {
  currentUserId: string | null;
  currentUserName: string;
  myBooks: BookItem[];
  payoutProfile: CreatorPayout | null;
  mySales: PurchaseRecord[];
  onSaveBook: (payload: {
    id?: string;
    title: string;
    synopsis: string;
    genre: BookGenre;
    coverPreset: CoverPreset;
    content: string;
    priceCents: number;
    status: 'draft' | 'published';
  }) => Promise<void>;
  onDeleteBook: (bookId: string) => Promise<void>;
  onSavePayoutProfile: (payload: {
    fullName: string;
    birthDate: string;
    age18Confirmed: boolean;
    cpf: string;
    pixKeyType: PixKeyType;
    pixKey: string;
    bankName: string;
    termsAccepted: boolean;
  }) => Promise<void>;
  onOpenReader: (book: BookItem) => void;
  onRequireSignIn: () => void;
}

export function PublishStudioView({
  currentUserId,
  currentUserName,
  myBooks,
  payoutProfile,
  mySales,
  onSaveBook,
  onDeleteBook,
  onSavePayoutProfile,
  onOpenReader,
  onRequireSignIn,
}: PublishStudioViewProps) {
  const [studioTab, setStudioTab] = useState<'editor' | 'monetization' | 'html'>('editor');

  // Book editor state
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [genre, setGenre] = useState<BookGenre>('Ficção');
  const [coverPreset, setCoverPreset] = useState<CoverPreset>('stories');
  const [priceReais, setPriceReais] = useState('0');
  const [content, setContent] = useState(
    '## Capítulo 1: O Início\n\nEscreva aqui o primeiro capítulo da sua história...'
  );
  const [bookMsg, setBookMsg] = useState<string | null>(null);
  const [savingBook, setSavingBook] = useState(false);

  // 18+ Payout form state
  const [fullName, setFullName] = useState(payoutProfile?.fullName || '');
  const [birthDate, setBirthDate] = useState(payoutProfile?.birthDate || '');
  const [cpf, setCpf] = useState(payoutProfile?.cpf || '');
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>(payoutProfile?.pixKeyType || 'cpf');
  const [pixKey, setPixKey] = useState(payoutProfile?.pixKey || '');
  const [bankName, setBankName] = useState(payoutProfile?.bankName || '');
  const [age18Confirmed, setAge18Confirmed] = useState(Boolean(payoutProfile?.age18Confirmed));
  const [termsAccepted, setTermsAccepted] = useState(Boolean(payoutProfile?.termsAccepted));
  const [payoutMsg, setPayoutMsg] = useState<string | null>(null);
  const [savingPayout, setSavingPayout] = useState(false);

  // HTML preview state
  const [copiedHtml, setCopiedHtml] = useState(false);

  const isAdultVerified = Boolean(payoutProfile?.age18Confirmed && payoutProfile?.termsAccepted);

  const totalGrossCents = useMemo(
    () => mySales.reduce((acc, s) => acc + s.amountCents, 0),
    [mySales]
  );
  const authorNetCents = Math.round(totalGrossCents * 0.85);

  const previewBook: BookItem = {
    id: editingId || 'preview-draft',
    authorId: currentUserId || 'guest',
    authorName: currentUserName || 'Autor Independente',
    title: title.trim() || 'Meu Livro Digital',
    synopsis:
      synopsis.trim() ||
      'Sinopse da obra pronta para leitura em navegador ou exportação em arquivo HTML5.',
    genre,
    coverPreset,
    content,
    priceCents: Math.max(0, Math.round((Number(priceReais.replace(',', '.')) || 0) * 100)),
    status: 'draft',
    adultMonetized: false,
  };

  const generatedHtml = useMemo(() => generateBookHtml(previewBook), [previewBook]);

  const loadBookIntoEditor = (book: BookItem) => {
    setEditingId(book.id);
    setTitle(book.title);
    setSynopsis(book.synopsis);
    setGenre(book.genre);
    setCoverPreset(book.coverPreset);
    setPriceReais((book.priceCents / 100).toFixed(2).replace('.', ','));
    setContent(book.content);
    setBookMsg(null);
    setStudioTab('editor');
  };

  const resetEditor = () => {
    setEditingId(undefined);
    setTitle('');
    setSynopsis('');
    setGenre('Ficção');
    setCoverPreset('stories');
    setPriceReais('0');
    setContent('## Capítulo 1: O Início\n\nEscreva aqui o primeiro capítulo da sua história...');
    setBookMsg(null);
  };

  const handleBookSubmit = async (targetStatus: 'draft' | 'published') => {
    setBookMsg(null);
    if (!currentUserId) {
      onRequireSignIn();
      return;
    }

    const cleanTitle = title.trim();
    const cleanSynopsis = synopsis.trim();
    const cleanContent = content.trim();
    const parsedPrice = Number(priceReais.replace(',', '.'));
    const priceCents = Number.isFinite(parsedPrice) && parsedPrice > 0 ? Math.round(parsedPrice * 100) : 0;

    if (cleanTitle.length < VALIDATION_BOUNDS.TITLE_MIN || cleanTitle.length > VALIDATION_BOUNDS.TITLE_MAX) {
      setBookMsg(`O título deve ter entre ${VALIDATION_BOUNDS.TITLE_MIN} e ${VALIDATION_BOUNDS.TITLE_MAX} caracteres.`);
      return;
    }
    if (
      cleanSynopsis.length < VALIDATION_BOUNDS.SYNOPSIS_MIN ||
      cleanSynopsis.length > VALIDATION_BOUNDS.SYNOPSIS_MAX
    ) {
      setBookMsg(
        `A sinopse deve ter entre ${VALIDATION_BOUNDS.SYNOPSIS_MIN} e ${VALIDATION_BOUNDS.SYNOPSIS_MAX} caracteres.`
      );
      return;
    }
    if (
      cleanContent.length < VALIDATION_BOUNDS.CONTENT_MIN ||
      cleanContent.length > VALIDATION_BOUNDS.CONTENT_MAX
    ) {
      setBookMsg(
        `O conteúdo do livro deve ter entre ${VALIDATION_BOUNDS.CONTENT_MIN} e ${VALIDATION_BOUNDS.CONTENT_MAX} caracteres.`
      );
      return;
    }
    if (priceCents > VALIDATION_BOUNDS.MAX_PRICE_CENTS) {
      setBookMsg('O preço máximo permitido é R$ 9.999,00.');
      return;
    }

    if (priceCents > 0 && !isAdultVerified) {
      setBookMsg(
        'Para publicar livros pagos e receber dinheiro, preencha primeiro o cadastro de maioridade (+18 anos) e dados PIX na aba "Monetização (+18)".'
      );
      setStudioTab('monetization');
      return;
    }

    setSavingBook(true);
    try {
      await onSaveBook({
        id: editingId,
        title: cleanTitle,
        synopsis: cleanSynopsis,
        genre,
        coverPreset,
        content: cleanContent,
        priceCents,
        status: targetStatus,
      });
      setBookMsg(
        targetStatus === 'published'
          ? 'Livro publicado no catálogo e salvo no banco de dados Firestore!'
          : 'Rascunho salvo com segurança no Firestore.'
      );
      if (!editingId) resetEditor();
    } catch (err) {
      setBookMsg(err instanceof Error ? err.message : 'Erro ao salvar livro.');
    } finally {
      setSavingBook(false);
    }
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutMsg(null);
    if (!currentUserId) {
      onRequireSignIn();
      return;
    }

    const cleanCpf = cpf.replace(/\D/g, '');
    const age = calculateAge(birthDate);

    if (fullName.trim().length < VALIDATION_BOUNDS.FULL_NAME_MIN) {
      setPayoutMsg('Informe seu nome completo conforme documento oficial.');
      return;
    }
    if (age < 18) {
      setPayoutMsg(
        'Cadastro bloqueado: a monetização e o recebimento de valores são permitidos apenas para maiores de 18 anos.'
      );
      return;
    }
    if (!age18Confirmed || !termsAccepted) {
      setPayoutMsg('Você precisa confirmar que é maior de 18 anos e aceitar os termos de repasse.');
      return;
    }
    if (cleanCpf.length !== 11) {
      setPayoutMsg('Informe um CPF válido com 11 dígitos numéricos.');
      return;
    }
    if (pixKey.trim().length < VALIDATION_BOUNDS.PIX_KEY_MIN) {
      setPayoutMsg('Informe uma chave PIX válida para receber seus pagamentos.');
      return;
    }
    if (bankName.trim().length < VALIDATION_BOUNDS.BANK_NAME_MIN) {
      setPayoutMsg('Informe o nome da sua instituição financeira / banco.');
      return;
    }

    setSavingPayout(true);
    try {
      await onSavePayoutProfile({
        fullName: fullName.trim().slice(0, VALIDATION_BOUNDS.FULL_NAME_MAX),
        birthDate,
        age18Confirmed,
        cpf: cleanCpf,
        pixKeyType,
        pixKey: pixKey.trim().slice(0, VALIDATION_BOUNDS.PIX_KEY_MAX),
        bankName: bankName.trim().slice(0, VALIDATION_BOUNDS.BANK_NAME_MAX),
        termsAccepted,
      });
      setPayoutMsg('Dados salvos com criptografia e isolamento no Firestore! Você já pode publicar livros pagos.');
    } catch (err) {
      setPayoutMsg(err instanceof Error ? err.message : 'Erro ao salvar dados de recebimento.');
    } finally {
      setSavingPayout(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[#57423b]">Estúdio do Autor &amp; Exportação HTML5</p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#1c1c18] mt-1">
            Criar, Publicar &amp; Receber
          </h1>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-[#f0eee8] rounded-xl overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setStudioTab('editor')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              studioTab === 'editor' ? 'bg-[#fcf9f3] text-[#9f3c16] shadow-sm' : 'text-[#57423b]'
            }`}
          >
            Escrever Livro
          </button>
          <button
            type="button"
            onClick={() => setStudioTab('monetization')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              studioTab === 'monetization'
                ? 'bg-[#fcf9f3] text-[#9f3c16] shadow-sm'
                : 'text-[#57423b]'
            }`}
          >
            Monetização (+18)
          </button>
          <button
            type="button"
            onClick={() => setStudioTab('html')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              studioTab === 'html' ? 'bg-[#fcf9f3] text-[#9f3c16] shadow-sm' : 'text-[#57423b]'
            }`}
          >
            Código HTML Completo
          </button>
        </div>
      </section>

      {!currentUserId && (
        <div className="bg-[#ffdbcf]/50 border border-[#dec0b7] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-editorial text-lg font-semibold text-[#390c00]">
              Entre com sua conta Google para salvar no banco de dados
            </h2>
            <p className="text-sm text-[#57423b]">
              Você pode escrever e gerar o código HTML livremente agora, ou entrar com o Google para publicar livros e cadastrar seus dados de pagamento (+18).
            </p>
          </div>
          <button
            type="button"
            onClick={onRequireSignIn}
            className="px-5 py-2.5 rounded-lg bg-[#9f3c16] text-white text-sm font-semibold hover:bg-[#bf542c] transition-colors whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer"
          >
            Entrar com Google
          </button>
        </div>
      )}

      {/* TAB 1: BOOK EDITOR */}
      {studioTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 bg-[#f6f3ed] rounded-2xl p-6 space-y-5 shadow-[0_4px_20px_rgba(44,34,30,0.04)]">
            <div className="flex items-center justify-between">
              <h2 className="font-editorial text-xl font-semibold text-[#1c1c18] inline-flex items-center gap-2">
                <BookPlus className="w-5 h-5 text-[#9f3c16]" />
                {editingId ? 'Editando Livro' : 'Novo Manuscrito'}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={resetEditor}
                  className="text-xs font-semibold text-[#9f3c16] hover:underline cursor-pointer"
                >
                  Criar novo em branco
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1.5 block">
                <span className="text-xs font-semibold text-[#57423b]">Título do Livro</span>
                <input
                  type="text"
                  maxLength={VALIDATION_BOUNDS.TITLE_MAX}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Cartas de um Outono"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fcf9f3] border border-[#dec0b7] text-sm focus:outline-none focus:ring-2 focus:ring-[#9f3c16]"
                />
              </label>

              <label className="space-y-1.5 block">
                <span className="text-xs font-semibold text-[#57423b]">Gênero Literário</span>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value as BookGenre)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fcf9f3] border border-[#dec0b7] text-sm focus:outline-none focus:ring-2 focus:ring-[#9f3c16]"
                >
                  {BOOK_GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1.5 block">
                <span className="text-xs font-semibold text-[#57423b]">Capa Editorial</span>
                <select
                  value={coverPreset}
                  onChange={(e) => setCoverPreset(e.target.value as CoverPreset)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fcf9f3] border border-[#dec0b7] text-sm focus:outline-none focus:ring-2 focus:ring-[#9f3c16]"
                >
                  {(Object.keys(COVER_PRESET_INFO) as CoverPreset[]).map((key) => (
                    <option key={key} value={key}>
                      {COVER_PRESET_INFO[key].label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5 block">
                <span className="text-xs font-semibold text-[#57423b]">
                  Preço em R$ (0 = Gratuito · Pago exige +18)
                </span>
                <input
                  type="text"
                  value={priceReais}
                  onChange={(e) => setPriceReais(e.target.value)}
                  placeholder="0,00 ou 29,90"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fcf9f3] border border-[#dec0b7] text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#9f3c16]"
                />
              </label>
            </div>

            <label className="space-y-1.5 block">
              <span className="text-xs font-semibold text-[#57423b]">Sinopse</span>
              <textarea
                rows={3}
                maxLength={VALIDATION_BOUNDS.SYNOPSIS_MAX}
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="Descreva a história ou proposta do seu livro..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fcf9f3] border border-[#dec0b7] text-sm focus:outline-none focus:ring-2 focus:ring-[#9f3c16]"
              />
            </label>

            <label className="space-y-1.5 block">
              <span className="text-xs font-semibold text-[#57423b]">
                Texto do Livro (use &quot;## Nome do Capítulo&quot; para dividir capítulos)
              </span>
              <textarea
                rows={10}
                maxLength={VALIDATION_BOUNDS.CONTENT_MAX}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl bg-[#fcf9f3] border border-[#dec0b7] text-sm font-editorial leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#9f3c16]"
              />
            </label>

            {bookMsg && (
              <p className="text-sm font-medium text-[#9f3c16] bg-[#ffdbcf]/40 px-4 py-2.5 rounded-xl">
                {bookMsg}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                disabled={savingBook}
                onClick={() => void handleBookSubmit('draft')}
                className="px-4 py-2.5 rounded-lg bg-[#ebe8e2] text-[#1c1c18] text-sm font-semibold hover:bg-[#e5e2dc] transition-colors min-h-[44px] cursor-pointer"
              >
                Salvar Rascunho
              </button>
              <button
                type="button"
                disabled={savingBook}
                onClick={() => void handleBookSubmit('published')}
                className="px-5 py-2.5 rounded-lg bg-[#9f3c16] text-white text-sm font-semibold hover:bg-[#bf542c] transition-colors min-h-[44px] cursor-pointer"
              >
                {savingBook ? 'Publicando...' : 'Publicar Livro'}
              </button>
              <button
                type="button"
                onClick={() => downloadBookHtml(previewBook)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#dec0b7] text-[#1c1c18] text-sm font-semibold hover:bg-[#fcf9f3] transition-colors min-h-[44px] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Baixar HTML
              </button>
            </div>
          </div>

          {/* Live Card Preview & Author's Books */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-[#f6f3ed] rounded-2xl p-5 space-y-4">
              <h3 className="font-editorial text-lg font-semibold">Prévia da Capa</h3>
              <div className="flex gap-4 items-center">
                <BookCover
                  preset={coverPreset}
                  title={previewBook.title}
                  author={previewBook.authorName}
                  className="w-20 h-28 rounded-xl shadow-sm shrink-0"
                />
                <div className="min-w-0 space-y-1">
                  <p className="text-xs text-[#57423b]">
                    {genre} · {formatBRL(previewBook.priceCents)}
                  </p>
                  <p className="font-editorial font-semibold text-base truncate">
                    {previewBook.title}
                  </p>
                  <p className="text-xs text-[#57423b] truncate">{previewBook.authorName}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#f6f3ed] rounded-2xl p-5 space-y-4">
              <h3 className="font-editorial text-lg font-semibold">
                Seus Livros no Banco ({myBooks.length})
              </h3>
              {myBooks.length === 0 ? (
                <p className="text-xs text-[#57423b]">
                  Você ainda não salvou livros no Firestore. Crie ao lado para começar.
                </p>
              ) : (
                <div className="space-y-3">
                  {myBooks.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-xl bg-[#fcf9f3] border border-[#dec0b7]/60 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{b.title}</p>
                        <p className="text-xs text-[#57423b] tabular-nums">
                          {b.status === 'published' ? 'Publicado' : 'Rascunho'} · {formatBRL(b.priceCents)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => loadBookIntoEditor(b)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#ebe8e2] text-xs font-semibold hover:bg-[#e5e2dc] cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenReader(b)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#ffdbcf] text-[#390c00] text-xs font-semibold cursor-pointer"
                        >
                          Ler
                        </button>
                        <button
                          type="button"
                          aria-label={`Excluir ${b.title}`}
                          onClick={() => void onDeleteBook(b.id)}
                          className="p-1.5 rounded-lg text-[#57423b] hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* TAB 2: 18+ MONETIZATION & PAYOUT FORM */}
      {studioTab === 'monetization' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handlePayoutSubmit}
            className="lg:col-span-7 bg-[#f6f3ed] rounded-2xl p-6 space-y-5 shadow-[0_4px_20px_rgba(44,34,30,0.04)]"
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#dec0b7]/60">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#9f3c16]">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Exclusivo para Maiores de 18 Anos</span>
                </div>
                <h2 className="font-editorial text-2xl font-semibold text-[#1c1c18]">
                  Dados para Receber Dinheiro (PIX &amp; CPF)
                </h2>
                <p className="text-xs text-[#57423b] leading-relaxed">
                  Seus dados pessoais ficam isolados na coleção privada do Firestore, acessíveis apenas pela sua conta Google verificada.
                </p>
              </div>
              {isAdultVerified && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#29674b] shrink-0">
                  <BadgeCheck className="w-4 h-4" />
                  Verificado +18
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1.5 block">
                <span className="text-xs font-semibold text-[#57423b]">Nome Completo</span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nome completo sem abreviações"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fcf9f3] border border-[#dec0b7] text-sm focus:outline-none focus:ring-2 focus:ring-[#9f3c16]"
                />
              </label>

              <label className="space-y-1.5 block">
                <span className="text-xs font-semibold text-[#57423b]">
                  Data de Nascimento (+18 obrigatório)
                </span>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fcf9f3] border border-[#dec0b7] text-sm focus:outline-none focus:ring-2 focus:ring-[#9f3c16]"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1.5 block">
                <span className="text-xs font-semibold text-[#57423b]">CPF (somente números)</span>
                <input
                  type="text"
                  required
                  maxLength={14}
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="00000000000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fcf9f3] border border-[#dec0b7] text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#9f3c16]"
                />
              </label>

              <label className="space-y-1.5 block">
                <span className="text-xs font-semibold text-[#57423b]">Banco / Instituição</span>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Ex.: Banco do Brasil, Nubank, Caixa"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fcf9f3] border border-[#dec0b7] text-sm focus:outline-none focus:ring-2 focus:ring-[#9f3c16]"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1.5 block">
                <span className="text-xs font-semibold text-[#57423b]">Tipo de Chave PIX</span>
                <select
                  value={pixKeyType}
                  onChange={(e) => setPixKeyType(e.target.value as PixKeyType)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fcf9f3] border border-[#dec0b7] text-sm focus:outline-none focus:ring-2 focus:ring-[#9f3c16]"
                >
                  <option value="cpf">CPF</option>
                  <option value="email">E-mail</option>
                  <option value="telefone">Telefone</option>
                  <option value="aleatoria">Chave Aleatória</option>
                </select>
              </label>

              <label className="space-y-1.5 block">
                <span className="text-xs font-semibold text-[#57423b]">Chave PIX</span>
                <input
                  type="text"
                  required
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="Informe sua chave PIX"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fcf9f3] border border-[#dec0b7] text-sm focus:outline-none focus:ring-2 focus:ring-[#9f3c16]"
                />
              </label>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={age18Confirmed}
                  onChange={(e) => setAge18Confirmed(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-[#9f3c16]"
                />
                <span className="text-xs text-[#1c1c18] leading-relaxed">
                  Declaro sob responsabilidade legal que tenho <strong>18 anos ou mais</strong> e que os dados bancários e CPF pertencem a mim.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-[#9f3c16]"
                />
                <span className="text-xs text-[#57423b] leading-relaxed">
                  Concordo com o repasse de 85% das vendas líquidas para minha chave PIX cadastrada e confirmo que sou o autor legítimo das obras publicadas.
                </span>
              </label>
            </div>

            {payoutMsg && (
              <p className="text-sm font-medium text-[#9f3c16] bg-[#ffdbcf]/40 px-4 py-2.5 rounded-xl">
                {payoutMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={savingPayout}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#9f3c16] text-white text-sm font-semibold hover:bg-[#bf542c] transition-colors min-h-[44px] cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              {savingPayout ? 'Validando e Salvando...' : 'Salvar Dados Financeiros (+18)'}
            </button>
          </form>

          {/* Earnings Summary */}
          <aside className="lg:col-span-5 space-y-6">
            <div className="bg-[#f0eee8] rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#b0f1cd] text-[#002113] flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-[#57423b]">Ganhos Líquidos do Autor (85%)</p>
                  <p className="font-editorial text-2xl font-semibold text-[#1c1c18] tabular-nums">
                    {authorNetCents === 0 ? 'R$ 0,00' : formatBRL(authorNetCents)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#dec0b7]/60 text-xs">
                <div>
                  <p className="text-[#57423b]">Vendas Realizadas</p>
                  <p className="text-base font-bold text-[#1c1c18] tabular-nums mt-0.5">
                    {mySales.length}
                  </p>
                </div>
                <div>
                  <p className="text-[#57423b]">Bruto Total</p>
                  <p className="text-base font-bold text-[#1c1c18] tabular-nums mt-0.5">
                    {totalGrossCents === 0 ? 'R$ 0,00' : formatBRL(totalGrossCents)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#f6f3ed] rounded-2xl p-6 space-y-3">
              <h3 className="font-editorial text-lg font-semibold">Histórico de Vendas</h3>
              {mySales.length === 0 ? (
                <p className="text-xs text-[#57423b] leading-relaxed">
                  Quando outros leitores adquirirem seus livros pagos na aba Explorar, cada compra será registrada no Firestore e aparecerá aqui em tempo real.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {mySales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between text-xs py-2 border-b border-[#dec0b7]/40 last:border-0"
                    >
                      <span className="font-semibold text-[#1c1c18] truncate pr-2">
                        {sale.bookTitle}
                      </span>
                      <span className="font-bold text-[#29674b] tabular-nums shrink-0">
                        +{formatBRL(Math.round(sale.amountCents * 0.85))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* TAB 3: COMPLETE HTML5 CODE GENERATOR */}
      {studioTab === 'html' && (
        <section className="bg-[#f6f3ed] rounded-2xl p-6 space-y-4 shadow-[0_4px_20px_rgba(44,34,30,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-editorial text-2xl font-semibold inline-flex items-center gap-2">
                <Code2 className="w-5 h-5 text-[#9f3c16]" />
                Código Completo para Criar HTML
              </h2>
              <p className="text-xs text-[#57423b]">
                Este código HTML5 completo reflete o livro que você está editando agora. Copie ou baixe o arquivo `.html` pronto para abrir em qualquer navegador.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(generatedHtml);
                  setCopiedHtml(true);
                  setTimeout(() => setCopiedHtml(false), 2000);
                }}
                className="px-4 py-2.5 rounded-lg bg-[#ebe8e2] text-[#1c1c18] text-xs font-semibold hover:bg-[#e5e2dc] cursor-pointer"
              >
                {copiedHtml ? 'Copiado!' : 'Copiar HTML'}
              </button>
              <button
                type="button"
                onClick={() => downloadBookHtml(previewBook)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#9f3c16] text-white text-xs font-semibold hover:bg-[#bf542c] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Baixar .html
              </button>
            </div>
          </div>

          <pre className="p-5 rounded-xl bg-[#fcf9f3] border border-[#dec0b7] text-xs font-mono text-[#1c1c18] overflow-auto max-h-[520px] leading-relaxed">
            {generatedHtml}
          </pre>
        </section>
      )}
    </div>
  );
}
