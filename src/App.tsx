import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { BookOpen, Compass, Feather, Library, User as UserIcon } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ExploreView } from './components/ExploreView';
import { LibraryView } from './components/LibraryView';
import { ProfileTutorialView } from './components/ProfileTutorialView';
import { PublishStudioView } from './components/PublishStudioView';
import { ReaderView } from './components/ReaderView';
import { CURATED_BOOKS } from './data/curatedBooks';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './lib/firebase';
import {
  BookGenre,
  BookItem,
  CoverPreset,
  CreatorPayout,
  PixKeyType,
  PurchaseRecord,
  ReadingProgressRecord,
  UserProfile,
} from './types/book';

type AppTab = 'biblioteca' | 'explorar' | 'leitor' | 'publicar' | 'perfil';

function createSafeId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${random}`;
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<AppTab>('biblioteca');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [payoutProfile, setPayoutProfile] = useState<CreatorPayout | null>(null);
  const [publishedRemoteBooks, setPublishedRemoteBooks] = useState<BookItem[]>([]);
  const [myBooks, setMyBooks] = useState<BookItem[]>([]);
  const [myPurchases, setMyPurchases] = useState<PurchaseRecord[]>([]);
  const [mySales, setMySales] = useState<PurchaseRecord[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, ReadingProgressRecord>>({});
  const [selectedBookId, setSelectedBookId] = useState<string>(CURATED_BOOKS[1].id);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  // 1. Auth state listener & initial UserProfile bootstrap
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthReady(true);

      if (!user) {
        setUserProfile(null);
        setPayoutProfile(null);
        setMyBooks([]);
        setMyPurchases([]);
        setMySales([]);
        setProgressMap({});
        return;
      }

      const userPath = `users/${user.uid}`;
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            displayName: (user.displayName || 'Autor do Ateliê').slice(0, 100),
            email: (user.email || 'leitor@atelie.app').slice(0, 200),
            photoURL: (user.photoURL || '').slice(0, 500),
            dailyMinutes: 18,
            dailyGoalMinutes: 25,
            annualBooksRead: 18,
            annualBooksGoal: 24,
            streakDays: 5,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, userPath);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Public published books stream
  useEffect(() => {
    const q = query(collection(db, 'books'), where('status', '==', 'published'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: BookItem[] = snapshot.docs.map((d) => d.data() as BookItem);
        setPublishedRemoteBooks(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'books');
      }
    );
    return () => unsub();
  }, []);

  // 3. Authenticated user private listeners
  useEffect(() => {
    if (!authReady || !currentUser) return;
    const uid = currentUser.uid;

    const unsubUser = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          setUserProfile(snap.data() as UserProfile);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, `users/${uid}`)
    );

    const unsubPayout = onSnapshot(
      doc(db, 'creatorPayouts', uid),
      (snap) => {
        if (snap.exists()) {
          setPayoutProfile(snap.data() as CreatorPayout);
        } else {
          setPayoutProfile(null);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, `creatorPayouts/${uid}`)
    );

    const unsubMyBooks = onSnapshot(
      query(collection(db, 'books'), where('authorId', '==', uid)),
      (snap) => {
        setMyBooks(snap.docs.map((d) => d.data() as BookItem));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'books')
    );

    const unsubPurchases = onSnapshot(
      query(collection(db, 'purchases'), where('buyerId', '==', uid)),
      (snap) => {
        setMyPurchases(snap.docs.map((d) => d.data() as PurchaseRecord));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'purchases')
    );

    const unsubSales = onSnapshot(
      query(collection(db, 'purchases'), where('authorId', '==', uid)),
      (snap) => {
        setMySales(snap.docs.map((d) => d.data() as PurchaseRecord));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'purchases')
    );

    const unsubProgress = onSnapshot(
      query(collection(db, 'readingProgress'), where('userId', '==', uid)),
      (snap) => {
        const nextMap: Record<string, ReadingProgressRecord> = {};
        snap.docs.forEach((d) => {
          const item = d.data() as ReadingProgressRecord;
          nextMap[item.bookId] = item;
        });
        setProgressMap(nextMap);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'readingProgress')
    );

    return () => {
      unsubUser();
      unsubPayout();
      unsubMyBooks();
      unsubPurchases();
      unsubSales();
      unsubProgress();
    };
  }, [authReady, currentUser]);

  // Combined books for Library & Catalog
  const allPublishedBooks = useMemo(() => {
    const map = new Map<string, BookItem>();
    for (const b of CURATED_BOOKS) map.set(b.id, b);
    for (const b of publishedRemoteBooks) map.set(b.id, b);
    return Array.from(map.values());
  }, [publishedRemoteBooks]);

  const libraryBooks = useMemo(() => {
    const map = new Map<string, BookItem>();
    for (const b of myBooks) map.set(b.id, b);
    for (const b of allPublishedBooks) {
      if (!map.has(b.id)) map.set(b.id, b);
    }
    return Array.from(map.values());
  }, [myBooks, allPublishedBooks]);

  const purchasedBookIds = useMemo(
    () => new Set(myPurchases.map((p) => p.bookId)),
    [myPurchases]
  );

  const selectedBook = useMemo(() => {
    return libraryBooks.find((b) => b.id === selectedBookId) || CURATED_BOOKS[0];
  }, [libraryBooks, selectedBookId]);

  const handleSignIn = async () => {
    setAuthMessage(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Falha ao conectar conta Google.';
      setAuthMessage(msg);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleOpenReader = (book: BookItem) => {
    setSelectedBookId(book.id);
    setActiveTab('leitor');
  };

  const handleAddReadingMinutes = async (minutes: number) => {
    if (!currentUser || !userProfile) {
      await handleSignIn();
      return;
    }
    const nextMinutes = Math.min(1440, Math.round(userProfile.dailyMinutes + minutes));
    const userPath = `users/${currentUser.uid}`;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        dailyMinutes: nextMinutes,
        streakDays: Math.round(userProfile.streakDays),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, userPath);
    }
  };

  const handleUpdateProgress = async (bookId: string, percent: number, bookmarked: boolean) => {
    const cleanPercent = Math.max(0, Math.min(100, Math.round(percent)));
    if (!currentUser) {
      setProgressMap((prev) => ({
        ...prev,
        [bookId]: {
          id: `guest_${bookId}`,
          userId: 'guest',
          bookId,
          percent: cleanPercent,
          bookmarked,
        },
      }));
      return;
    }

    const progressId = `${currentUser.uid}_${bookId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    const path = `readingProgress/${progressId}`;
    const ref = doc(db, 'readingProgress', progressId);
    try {
      const existing = await getDoc(ref);
      if (!existing.exists()) {
        await setDoc(ref, {
          id: progressId,
          userId: currentUser.uid,
          bookId,
          percent: cleanPercent,
          bookmarked,
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(ref, {
          percent: cleanPercent,
          bookmarked,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleSaveBook = async (payload: {
    id?: string;
    title: string;
    synopsis: string;
    genre: BookGenre;
    coverPreset: CoverPreset;
    content: string;
    priceCents: number;
    status: 'draft' | 'published';
  }) => {
    if (!currentUser) {
      await handleSignIn();
      return;
    }
    const bookId = payload.id || createSafeId('book');
    const bookPath = `books/${bookId}`;
    const ref = doc(db, 'books', bookId);
    const adultMonetized = payload.priceCents > 0;

    try {
      if (payload.id) {
        await updateDoc(ref, {
          title: payload.title,
          synopsis: payload.synopsis,
          genre: payload.genre,
          coverPreset: payload.coverPreset,
          content: payload.content,
          priceCents: Math.round(payload.priceCents),
          status: payload.status,
          adultMonetized,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          id: bookId,
          authorId: currentUser.uid,
          authorName: (currentUser.displayName || 'Autor Independente').slice(0, 100),
          title: payload.title,
          synopsis: payload.synopsis,
          genre: payload.genre,
          coverPreset: payload.coverPreset,
          content: payload.content,
          priceCents: Math.round(payload.priceCents),
          status: payload.status,
          adultMonetized,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, bookPath);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!currentUser) return;
    const path = `books/${bookId}`;
    try {
      await deleteDoc(doc(db, 'books', bookId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleSavePayoutProfile = async (payload: {
    fullName: string;
    birthDate: string;
    age18Confirmed: boolean;
    cpf: string;
    pixKeyType: PixKeyType;
    pixKey: string;
    bankName: string;
    termsAccepted: boolean;
  }) => {
    if (!currentUser) {
      await handleSignIn();
      return;
    }
    const path = `creatorPayouts/${currentUser.uid}`;
    const ref = doc(db, 'creatorPayouts', currentUser.uid);

    try {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          userId: currentUser.uid,
          fullName: payload.fullName,
          birthDate: payload.birthDate,
          age18Confirmed: payload.age18Confirmed,
          cpf: payload.cpf,
          pixKeyType: payload.pixKeyType,
          pixKey: payload.pixKey,
          bankName: payload.bankName,
          termsAccepted: payload.termsAccepted,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(ref, {
          fullName: payload.fullName,
          birthDate: payload.birthDate,
          age18Confirmed: payload.age18Confirmed,
          cpf: payload.cpf,
          pixKeyType: payload.pixKeyType,
          pixKey: payload.pixKey,
          bankName: payload.bankName,
          termsAccepted: payload.termsAccepted,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handlePurchaseBook = async (book: BookItem) => {
    if (!currentUser) {
      await handleSignIn();
      return;
    }
    const purchaseId = createSafeId('purchase');
    const path = `purchases/${purchaseId}`;
    try {
      await setDoc(doc(db, 'purchases', purchaseId), {
        id: purchaseId,
        bookId: book.id,
        bookTitle: book.title.slice(0, 140),
        buyerId: currentUser.uid,
        authorId: book.authorId,
        amountCents: Math.round(book.priceCents),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const navItems: { id: AppTab; label: string; icon: typeof Library }[] = [
    { id: 'biblioteca', label: 'Biblioteca', icon: Library },
    { id: 'explorar', label: 'Explorar', icon: Compass },
    { id: 'leitor', label: 'Leitor', icon: BookOpen },
    { id: 'publicar', label: 'Publicar', icon: Feather },
    { id: 'perfil', label: 'Perfil', icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-[#fcf9f3] text-[#1c1c18] flex flex-col">
      {/* 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-40 h-14 sm:h-16 bg-[#fcf9f3]/90 backdrop-blur-md border-b border-[#dec0b7]/40">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('biblioteca')}
            className="font-editorial text-lg sm:text-xl font-semibold text-[#1c1c18] tracking-tight whitespace-nowrap shrink-0 cursor-pointer"
          >
            Ateliê Literário
          </button>

          {/* Zone 2: Desktop Concise Nav Links */}
          <nav aria-label="Navegação principal" className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                    active
                      ? 'border-[#9f3c16] text-[#9f3c16] font-semibold'
                      : 'border-transparent text-[#57423b] hover:text-[#1c1c18]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center shrink-0">
            {currentUser ? (
              <button
                type="button"
                onClick={() => setActiveTab('perfil')}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#f0eee8] hover:bg-[#e5e2dc] text-xs font-semibold text-[#1c1c18] whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Perfil'}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-[#9f3c16] text-white flex items-center justify-center text-xs">
                    {(currentUser.displayName || 'L')[0]}
                  </span>
                )}
                <span className="max-w-[110px] truncate">
                  {currentUser.displayName?.split(' ')[0] || 'Perfil'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleSignIn()}
                className="px-4 py-2 rounded-lg bg-[#9f3c16] text-white text-xs sm:text-sm font-semibold hover:bg-[#bf542c] transition-colors whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer"
              >
                Entrar com Google
              </button>
            )}
          </div>
        </div>
      </header>

      {authMessage && (
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-4">
          <div className="bg-[#ffdbcf]/60 border border-[#dec0b7] rounded-xl px-4 py-3 text-xs text-[#390c00] flex items-center justify-between gap-4">
            <span>{authMessage}</span>
            <button
              type="button"
              onClick={() => setAuthMessage(null)}
              className="font-bold underline cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12">
        {activeTab === 'biblioteca' && (
          <LibraryView
            books={libraryBooks}
            progressMap={progressMap}
            userProfile={userProfile}
            currentUserId={currentUser?.uid || null}
            onOpenReader={handleOpenReader}
            onAddReadingMinutes={(mins) => void handleAddReadingMinutes(mins)}
            onGoPublish={() => setActiveTab('publicar')}
          />
        )}

        {activeTab === 'explorar' && (
          <ExploreView
            publishedBooks={allPublishedBooks}
            purchasedBookIds={purchasedBookIds}
            currentUserId={currentUser?.uid || null}
            onOpenReader={handleOpenReader}
            onPurchaseBook={handlePurchaseBook}
            onRequireSignIn={() => void handleSignIn()}
          />
        )}

        {activeTab === 'leitor' && (
          <ReaderView
            book={selectedBook}
            progress={progressMap[selectedBook.id]}
            onUpdateProgress={(id, pct, mark) => void handleUpdateProgress(id, pct, mark)}
            onBackToLibrary={() => setActiveTab('biblioteca')}
          />
        )}

        {activeTab === 'publicar' && (
          <PublishStudioView
            currentUserId={currentUser?.uid || null}
            currentUserName={currentUser?.displayName || 'Autor Independente'}
            myBooks={myBooks}
            payoutProfile={payoutProfile}
            mySales={mySales}
            onSaveBook={handleSaveBook}
            onDeleteBook={handleDeleteBook}
            onSavePayoutProfile={handleSavePayoutProfile}
            onOpenReader={handleOpenReader}
            onRequireSignIn={() => void handleSignIn()}
          />
        )}

        {activeTab === 'perfil' && (
          <ProfileTutorialView
            currentUser={
              currentUser
                ? {
                    uid: currentUser.uid,
                    displayName: currentUser.displayName,
                    email: currentUser.email,
                    photoURL: currentUser.photoURL,
                  }
                : null
            }
            userProfile={userProfile}
            payoutProfile={payoutProfile}
            myBooksCount={myBooks.length}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
            onGoPublishMonetization={() => setActiveTab('publicar')}
          />
        )}
      </main>

      {/* Mobile Bottom Tab Bar (<= 15% mobile viewport sticky cap) */}
      <nav
        aria-label="Navegação móvel"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 pb-safe bg-[#fcf9f3]/95 backdrop-blur-md border-t border-[#dec0b7]/50"
      >
        <div className="grid grid-cols-5 h-full items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 h-full transition-colors cursor-pointer ${
                  active ? 'text-[#9f3c16] font-bold' : 'text-[#57423b]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] leading-tight whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
