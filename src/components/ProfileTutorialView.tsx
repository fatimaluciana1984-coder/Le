import {
  Award,
  BookOpen,
  Clock,
  Database,
  Flame,
  LogIn,
  LogOut,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { CreatorPayout, UserProfile } from '../types/book';

interface ProfileTutorialViewProps {
  currentUser: {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  } | null;
  userProfile: UserProfile | null;
  payoutProfile: CreatorPayout | null;
  myBooksCount: number;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onGoPublishMonetization: () => void;
}

export function ProfileTutorialView({
  currentUser,
  userProfile,
  payoutProfile,
  myBooksCount,
  onSignIn,
  onSignOut,
  onGoPublishMonetization,
}: ProfileTutorialViewProps) {
  const booksRead = userProfile?.annualBooksRead ?? 18;
  const booksGoal = userProfile?.annualBooksGoal ?? 24;
  const goalPct = Math.min(100, Math.round((booksRead / booksGoal) * 100));
  const streakDays = userProfile?.streakDays ?? 14;
  const isAdultVerified = Boolean(payoutProfile?.age18Confirmed && payoutProfile?.termsAccepted);

  return (
    <div className="space-y-8">
      {/* Account & Profile Header */}
      <section className="bg-[#f6f3ed] rounded-2xl p-6 shadow-[0_4px_20px_rgba(44,34,30,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4 min-w-0">
          {currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={currentUser.displayName || 'Foto do usuário'}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover ring-2 ring-[#dec0b7] shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#ffdbcf] text-[#9f3c16] flex items-center justify-center font-editorial text-2xl font-bold shrink-0">
              {(currentUser?.displayName || 'L')[0]}
            </div>
          )}

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#9f3c16] font-semibold">
              <span>{currentUser ? 'Conta Google Conectada' : 'Modo Visitante'}</span>
              {isAdultVerified && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#29674b]">Autor Verificado (+18)</span>
                </>
              )}
            </div>
            <h1 className="font-editorial text-2xl font-semibold text-[#1c1c18] truncate">
              {currentUser?.displayName || 'Leitor(a) do Ateliê'}
            </h1>
            <p className="text-xs text-[#57423b] truncate">
              {currentUser?.email || 'Entre com uma conta Google para salvar livros e ganhos'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {currentUser ? (
            <>
              <button
                type="button"
                onClick={onGoPublishMonetization}
                className="px-4 py-2.5 rounded-lg bg-[#ebe8e2] text-[#1c1c18] text-xs font-semibold hover:bg-[#e5e2dc] min-h-[44px] cursor-pointer"
              >
                {isAdultVerified ? 'Meus Dados (+18)' : 'Cadastrar PIX (+18)'}
              </button>
              <button
                type="button"
                onClick={() => void onSignOut()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#dec0b7] text-[#1c1c18] text-xs font-semibold hover:bg-[#fcf9f3] min-h-[44px] cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void onSignIn()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#9f3c16] text-white text-sm font-semibold hover:bg-[#bf542c] min-h-[44px] cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Entrar com Conta Google
            </button>
          )}
        </div>
      </section>

      {/* Reading Goal & Stats */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 bg-[#f6f3ed] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-xl font-semibold">Meta Anual de Leitura</h2>
            <span className="text-sm font-bold text-[#9f3c16] tabular-nums">
              {booksRead} / {booksGoal} livros
            </span>
          </div>
          <div className="w-full h-3 bg-[#e5e2dc] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#9f3c16] rounded-full transition-all duration-500"
              style={{ width: `${goalPct}%` }}
            />
          </div>
          <p className="text-xs text-[#57423b] tabular-nums">
            {goalPct}% concluído · {myBooksCount} obra(s) autorais criadas por você.
          </p>
        </div>

        <div className="lg:col-span-6 grid grid-cols-3 gap-4">
          <div className="bg-[#f6f3ed] rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <BookOpen className="w-5 h-5 text-[#9f3c16] mb-2" />
            <span className="font-editorial text-2xl font-semibold tabular-nums">{booksRead}</span>
            <span className="text-xs text-[#57423b] mt-1">Livros Lidos</span>
          </div>
          <div className="bg-[#f6f3ed] rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <Clock className="w-5 h-5 text-[#805521] mb-2" />
            <span className="font-editorial text-2xl font-semibold tabular-nums">45h</span>
            <span className="text-xs text-[#57423b] mt-1">Tempo Lido</span>
          </div>
          <div className="bg-[#f6f3ed] rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <Flame className="w-5 h-5 text-[#29674b] mb-2" />
            <span className="font-editorial text-2xl font-semibold tabular-nums">{streakDays}d</span>
            <span className="text-xs text-[#57423b] mt-1">Sequência</span>
          </div>
        </div>
      </section>

      {/* Complete Tutorial inside the App */}
      <section className="bg-[#f6f3ed] rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <h2 className="font-editorial text-2xl font-semibold text-[#1c1c18]">
            Tutorial: Conta Google, Banco de Dados e Monetização (+18)
          </h2>
          <p className="text-sm text-[#57423b]">
            Passo a passo de como funciona sua conta, o armazenamento dos livros no banco de dados Firestore e o cadastro de autor maior de 18 anos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#fcf9f3] rounded-xl p-5 border border-[#dec0b7]/60 space-y-2.5">
            <div className="w-10 h-10 rounded-lg bg-[#ffdbcf] text-[#9f3c16] flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="font-editorial text-lg font-semibold">01. Criar e Conectar Conta Google</h3>
            <ol className="text-xs text-[#57423b] space-y-1.5 list-decimal pl-4 leading-relaxed">
              <li>Acesse <strong>accounts.google.com</strong> e clique em &quot;Criar conta&quot; (caso ainda não tenha um Gmail).</li>
              <li>Informe seu nome, data de nascimento e confirme seu telefone para segurança.</li>
              <li>Aqui no aplicativo, clique em <strong>Entrar com Google</strong>: o Firebase Auth autentica você com um clique sem precisar criar outra senha.</li>
            </ol>
          </div>

          <div className="bg-[#fcf9f3] rounded-xl p-5 border border-[#dec0b7]/60 space-y-2.5">
            <div className="w-10 h-10 rounded-lg bg-[#ffddbb] text-[#805521] flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-editorial text-lg font-semibold">02. Pequeno Banco de Dados (Firestore)</h3>
            <ul className="text-xs text-[#57423b] space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>
                <strong>books</strong>: guarda título, sinopse, gênero, preço e texto completo dos livros (rascunhos privados ou publicados).
              </li>
              <li>
                <strong>users</strong>: armazena suas metas diárias e anuais de leitura.
              </li>
              <li>
                <strong>creatorPayouts</strong>: cofre isolado por UID para seus dados +18.
              </li>
              <li>
                <strong>purchases</strong>: registra cada venda vinculada ao autor.
              </li>
            </ul>
          </div>

          <div className="bg-[#fcf9f3] rounded-xl p-5 border border-[#dec0b7]/60 space-y-2.5">
            <div className="w-10 h-10 rounded-lg bg-[#b0f1cd] text-[#002113] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-editorial text-lg font-semibold">03. Monetização Exclusiva (+18 Anos)</h3>
            <ol className="text-xs text-[#57423b] space-y-1.5 list-decimal pl-4 leading-relaxed">
              <li>Vá na aba <strong>Publicar &gt; Monetização (+18)</strong>.</li>
              <li>Preencha nome completo, data de nascimento (validada para 18+ anos no cliente e nas regras do Firestore), CPF e chave PIX.</li>
              <li>Ao concluir, você já pode definir preços em R$ nos seus livros e acompanhar suas vendas em tempo real.</li>
            </ol>
          </div>
        </div>

        {/* Achievements strip */}
        <div className="pt-4 border-t border-[#dec0b7]/60 flex flex-wrap items-center gap-6 text-xs text-[#57423b]">
          <span className="inline-flex items-center gap-2 font-semibold text-[#1c1c18]">
            <Award className="w-4 h-4 text-[#9f3c16]" />
            Conquistas desbloqueadas:
          </span>
          <span>Leitor Noturno</span>
          <span aria-hidden="true">·</span>
          <span>Maratona de Fim de Semana</span>
          <span aria-hidden="true">·</span>
          <span>Bibliófilo Ávido</span>
        </div>
      </section>
    </div>
  );
}
