# Especificação de Segurança Firestore (Fase 0)

## 1. Invariantes de Dados
1. **Isolamento de PII e Dados Financeiros (+18)**: Documentos em `/creatorPayouts/{userId}` contêm CPF, data de nascimento e dados PIX/bancários. Apenas o próprio proprietário autenticado (`request.auth.uid == userId`) com e-mail verificado pode ler, criar ou atualizar seu próprio registro. `list` é estritamente proibido.
2. **Maioridade Obrigatória (+18)**: Para criar/atualizar `/creatorPayouts/{userId}`, `age18Confirmed` deve ser `true`, `termsAccepted` deve ser `true`, `birthDate` deve respeitar `YYYY-MM-DD` e o autor deve ter no mínimo 18 anos (`request.time` comparado ou validação estrita de ano/data), além de `cpf` ter exatamente 11 dígitos.
3. **Monetização Vinculada ao Cadastro +18**: Um livro pago (`priceCents > 0` ou `adultMonetized == true`) só pode ser publicado (`status == 'published'`) se existir o documento `/creatorPayouts/$(request.auth.uid)` com `age18Confirmed == true` e `termsAccepted == true`.
4. **Integridade de Identidade e Rascunhos**: Rascunhos (`status == 'draft'`) em `/books/{bookId}` só podem ser lidos ou listados pelo respectivo `authorId`. Livros publicados são legíveis apenas quando `status == 'published'`.
5. **Integridade de Compras**: Uma compra em `/purchases/{purchaseId}` exige que o livro exista em `/books/{bookId}`, esteja publicado (`status == 'published'`), e que `amountCents` e `authorId` correspondam exatamente ao documento do livro no Firestore. Compras são imutáveis (`allow update, delete: if false`).
6. **Timbragem Temporal Segura**: Todos os campos `createdAt` e `updatedAt` exigem `request.time`.

## 2. Payloads Adversariais ("Dirty Dozen")
1. **Shadow Field em `/creatorPayouts`**: `{ ...valid, isVerifiedByAdmin: true }` -> `PERMISSION_DENIED` (bloqueado por `hasOnly`).
2. **Menor de 18 anos em `/creatorPayouts`**: `{ ...valid, age18Confirmed: false }` -> `PERMISSION_DENIED`.
3. **Data de nascimento de menor (`2012-05-10`) em `/creatorPayouts`**: `PERMISSION_DENIED` (regra valida ano <= limite 18+).
4. **Leitura de `/creatorPayouts` de outro usuário**: `get(/creatorPayouts/otherUid)` -> `PERMISSION_DENIED`.
5. **Listagem em massa de `/creatorPayouts`**: `list(/creatorPayouts)` -> `PERMISSION_DENIED`.
6. **Publicar livro pago sem cadastro +18**: `create(/books/b1, { priceCents: 2990, status: 'published', ... })` sem `/creatorPayouts/{uid}` -> `PERMISSION_DENIED`.
7. **Falsificação de `authorId` em `/books`**: `{ authorId: 'victimUid', ... }` -> `PERMISSION_DENIED`.
8. **Listagem irrestrita de rascunhos em `/books`**: `getDocs(collection(db, 'books'))` sem filtro `status == 'published'` ou `authorId == uid` -> `PERMISSION_DENIED`.
9. **ID poisoning em `/books/{bookId}`**: `bookId` com 500 caracteres ou `$` -> `PERMISSION_DENIED` (`isValidId`).
10. **Manipulação de valor em `/purchases`**: `amountCents: 0` para um livro de `priceCents: 3990` -> `PERMISSION_DENIED`.
11. **Timestamp forjado**: `createdAt: Timestamp(2020-01-01)` -> `PERMISSION_DENIED` (`createdAt == request.time`).
12. **E-mail não verificado**: Escrita com `email_verified: false` -> `PERMISSION_DENIED`.
