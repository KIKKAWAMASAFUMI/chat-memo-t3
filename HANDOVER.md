# ChatMemo T3スタック移植 - 引き継ぎ作業指示書

## プロジェクト概要

**目的**: ChatMemo（React + Vite + Supabase）をT3スタック（Next.js + tRPC + Prisma + NextAuth.js）に移植

**リポジトリ**: https://github.com/KIKKAWAMASAFUMI/chat-memo-t3

**元プロジェクト**: `/Users/kikkawamasafumi/Developer/Projects/WebApps/ChatMemo`

---

## 完了済み作業

### 1. プロジェクト基盤
- [x] T3プロジェクト初期化（create-t3-app）
- [x] PostgreSQL用にPrismaスキーマを設定
- [x] 環境変数テンプレート（.env.example）作成
- [x] GitHubリポジトリ作成・プッシュ

### 2. Prismaスキーマ（11テーブル）
**ファイル**: `prisma/schema.prisma`

| テーブル | 用途 | 状態 |
|---------|------|------|
| User | ユーザー（NextAuth拡張） | 完了 |
| Account | OAuth連携 | 完了 |
| Session | セッション管理 | 完了 |
| VerificationToken | メール認証用 | 完了 |
| Snippet | メモ本体 | 完了 |
| Message | メッセージ | 完了 |
| Tag | タグマスター | 完了 |
| SnippetTag | スニペット-タグ中間 | 完了 |
| AIProvider | AIプロバイダー | 完了 |
| UserActiveAI | ユーザーのアクティブAI | 完了 |
| UserSettings | ユーザー設定 | 完了 |

### 3. NextAuth.js設定
**ファイル**: `src/server/auth/config.ts`

- [x] Google OAuthプロバイダー
- [x] Credentialsプロバイダー（メール/パスワード）
- [x] JWT戦略でのセッション管理
- [x] PrismaAdapterでDB連携

### 4. tRPCルーター
**ディレクトリ**: `src/server/api/routers/`

| ルーター | プロシージャ | 状態 |
|---------|-------------|------|
| snippet | getAll, getById, create, update, delete, search, filterByTags | 完了 |
| message | getBySnippetId, create, update, delete | 完了 |
| tag | getAll, create, update, delete, addToSnippet, removeFromSnippet, getForSnippet | 完了 |
| aiProvider | getAll, getDefaults, createCustom, delete, ensureDefaults, getActiveAIs, toggleActive | 完了 |
| settings | get, update, updateUserName, updateDisplayMode, addCustomAI, removeCustomAI | 完了 |

### 5. UIコンポーネント（基本）
**ディレクトリ**: `src/components/`

| コンポーネント | パス | 状態 |
|---------------|------|------|
| LoginForm | components/auth/login-form.tsx | 完了（基本実装） |
| SidebarWrapper | components/layout/sidebar-wrapper.tsx | 完了（基本実装） |
| MainContentWrapper | components/layout/main-content-wrapper.tsx | 完了 |
| MemoContent | components/layout/memo-content.tsx | 完了（基本実装） |
| MessageBubble | components/message/message-bubble.tsx | 完了（基本実装） |

### 6. ページ構造
**ディレクトリ**: `src/app/`

```
app/
├── (auth)/
│   └── login/page.tsx        # ログインページ
├── (main)/
│   ├── layout.tsx            # 認証ガード付きレイアウト
│   ├── page.tsx              # ダッシュボード（ウェルカム画面）
│   └── memo/[id]/page.tsx    # メモ詳細ページ
├── api/
│   ├── auth/
│   │   ├── [...nextauth]/route.ts  # NextAuth APIルート
│   │   └── register/route.ts       # ユーザー登録API
│   └── trpc/[trpc]/route.ts        # tRPC APIルート
└── layout.tsx                # ルートレイアウト
```

---

## 未完了作業（優先度順）

### 高優先度

#### 1. 環境変数の設定
```bash
# .envファイルを作成し、以下を設定
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
```

#### 2. データベースマイグレーション
```bash
npx prisma generate
npx prisma migrate dev --name init
```

#### 3. 設定モーダルの移植
**参照元**: `ChatMemo/src/components/layout/SettingsModal.tsx`

必要な機能：
- [ ] ユーザー名変更
- [ ] AI有効/無効切り替え
- [ ] カスタムAI追加/削除
- [ ] デフォルト表示モード変更
- [ ] タグ管理
- [ ] ログアウト

#### 4. Markdownレンダリング
**参照元**: `ChatMemo/src/components/snippet/MarkdownRenderer.tsx`

必要なパッケージ：
```bash
npm install react-markdown remark-gfm react-syntax-highlighter
npm install -D @types/react-syntax-highlighter
```

必要な機能：
- [ ] Markdownパース・表示
- [ ] コードブロックのシンタックスハイライト
- [ ] GFM（GitHub Flavored Markdown）対応

### 中優先度

#### 5. タグモーダルの移植
**参照元**: `ChatMemo/src/components/layout/TagModal.tsx`

- [ ] スニペットへのタグ付け
- [ ] タグ一覧表示
- [ ] タグ追加/削除

#### 6. AI選択モーダルの移植
**参照元**: `ChatMemo/src/components/layout/SelectAIModal.tsx`

- [ ] メッセージ送信時のAI選択ポップアップ
- [ ] カスタムAI対応

#### 7. タグフィルタリング機能
- [ ] サイドバーでのタグフィルタ
- [ ] 複数タグでのAND検索

### 低優先度

#### 8. UIの詳細調整
- [ ] モバイルレスポンシブ対応
- [ ] 長押しジェスチャー（モバイル）
- [ ] トースト通知システム
- [ ] 確認ダイアログ
- [ ] ローディング状態の改善

#### 9. データ移行スクリプト
**作成場所**: `scripts/migrate-data.ts`

既存Supabaseデータから新スキーマへの移行：
- [ ] ユーザーデータ移行
- [ ] スニペット・メッセージ移行
- [ ] タグ移行
- [ ] 設定移行

---

## 参照すべき元ファイル

| 機能 | 元ファイルパス |
|------|---------------|
| 認証 | `ChatMemo/src/hooks/useAuth.ts` |
| 設定管理 | `ChatMemo/src/hooks/useSettings.ts` |
| スニペットCRUD | `ChatMemo/src/db/snippetRepository.ts` |
| タグ・AI管理 | `ChatMemo/src/db/tagAndAIRepository.ts` |
| ユーザー設定 | `ChatMemo/src/db/settingsRepository.ts` |
| 型定義 | `ChatMemo/src/types/database.ts` |
| メインApp | `ChatMemo/src/App.tsx` |
| サイドバー | `ChatMemo/src/components/layout/Sidebar.tsx` |
| メインコンテンツ | `ChatMemo/src/components/layout/MainContent.tsx` |
| メッセージバブル | `ChatMemo/src/components/snippet/MessageBubble.tsx` |
| Markdownレンダラー | `ChatMemo/src/components/snippet/MarkdownRenderer.tsx` |
| 設定モーダル | `ChatMemo/src/components/layout/SettingsModal.tsx` |
| 認証ページ | `ChatMemo/src/components/auth/AuthPage.tsx` |

---

## 開発環境セットアップ

```bash
# 1. プロジェクトディレクトリへ移動
cd /Users/kikkawamasafumi/Developer/Projects/WebApps/chat-memo-t3

# 2. 依存関係インストール（済み）
npm install

# 3. 環境変数設定
cp .env.example .env
# .envを編集

# 4. Prismaクライアント生成
npx prisma generate

# 5. データベースマイグレーション
npx prisma migrate dev --name init

# 6. 開発サーバー起動
npm run dev
```

---

## 技術スタック

| 層 | 技術 | バージョン |
|---|------|----------|
| フレームワーク | Next.js (App Router) | 14+ |
| 言語 | TypeScript | 5.x |
| API | tRPC | 11.x |
| ORM | Prisma | 6.x |
| 認証 | NextAuth.js | 5.x (Auth.js) |
| スタイリング | Tailwind CSS | 4.x |
| データベース | PostgreSQL (Supabase) | - |
| アイコン | Lucide React | - |

---

## 注意事項

1. **Prisma Generated**
   - `generated/`ディレクトリは`.gitignore`に含まれている
   - クローン後は必ず`npx prisma generate`を実行

2. **環境変数**
   - `.env`ファイルはコミットしない
   - Supabaseの接続情報は管理者から取得

3. **認証**
   - Credentials認証にはbcryptjsでのパスワードハッシュ化を使用
   - Google OAuth使用時はGoogle Cloud Consoleでの設定が必要

4. **元プロジェクトとの違い**
   - RLS（Row Level Security）→ tRPCプロシージャ内での認可チェック
   - Supabase Auth → NextAuth.js
   - クライアントサイドルーティング → Next.js App Router

---

## 連絡先・リソース

- **元プロジェクトリポジトリ**: https://github.com/KIKKAWAMASAFUMI/AI-CHAT-MEMO
- **T3プロジェクトリポジトリ**: https://github.com/KIKKAWAMASAFUMI/chat-memo-t3
- **T3ドキュメント**: https://create.t3.gg/
- **tRPCドキュメント**: https://trpc.io/
- **Prismaドキュメント**: https://www.prisma.io/docs
- **NextAuth.jsドキュメント**: https://authjs.dev/

---

*作成日: 2026-01-30*
*作成者: Claude Code (Claude Opus 4.5)*
