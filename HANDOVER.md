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
| SidebarWrapper | components/layout/sidebar-wrapper.tsx | 完了（モバイル対応・長押し対応） |
| SidebarContext | components/layout/sidebar-context.tsx | 完了（サイドバー開閉状態管理） |
| MainContentWrapper | components/layout/main-content-wrapper.tsx | 完了 |
| MemoContent | components/layout/memo-content.tsx | 完了（モバイル対応・スケルトンUI） |
| MessageBubble | components/message/message-bubble.tsx | 完了（Markdown対応） |
| Modal | components/ui/modal.tsx | 完了 |
| CodeBlock | components/ui/code-block.tsx | 完了 |
| MarkdownRenderer | components/ui/markdown-renderer.tsx | 完了 |
| Skeleton | components/ui/skeleton.tsx | 完了（スケルトンローディングUI） |
| SettingsModal | components/settings/settings-modal.tsx | 完了 |
| TagModal | components/tag/tag-modal.tsx | 完了 |
| SelectAIModal | components/ai/select-ai-modal.tsx | 完了 |
| ToastProvider | components/ui/toast.tsx | 完了 |
| ConfirmModal | components/ui/confirm-modal.tsx | 完了 |
| Providers | components/providers.tsx | 完了 |

### 7. 定数ファイル
**ファイル**: `src/constants/index.ts`

- [x] 制限値（MAX_CUSTOM_AIS, MAX_TAGS, etc.）
- [x] デフォルト値（DEFAULT_USERNAME, DEFAULT_AI_PRESETS, etc.）

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

### 8. データベース設定 ✅ 完了
**Supabaseプロジェクト**: chat-memo-t3
**プロジェクトID**: tfflfuljtuzoftaueeaw
**リージョン**: ap-northeast-1 (Tokyo)

- [x] Supabaseプロジェクト作成
- [x] 環境変数設定（.env）
- [x] データベースマイグレーション（11テーブル）
- [x] ユーザー登録・ログイン動作確認
- [x] メッセージ保存動作確認

**接続URL形式**（Supabase Dashboard > Connect > ORMs > Prismaから取得）:
```
DATABASE_URL: aws-1-ap-northeast-1.pooler.supabase.com:6543 (pgbouncer)
DIRECT_URL: aws-1-ap-northeast-1.pooler.supabase.com:5432 (direct)
```

---

## 未完了作業（優先度順）

### 高優先度

#### 1. Google OAuth設定
```bash
# .envファイルに追加
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
```
Google Cloud Consoleで認証情報を作成し設定が必要

#### 3. 設定モーダルの移植 ✅ 完了
**ファイル**: `src/components/settings/settings-modal.tsx`

実装済み機能：
- [x] ユーザー名変更
- [x] AI有効/無効切り替え
- [x] カスタムAI追加/削除
- [x] デフォルト表示モード変更
- [x] タグ管理
- [x] ログアウト

#### 4. Markdownレンダリング ✅ 完了
**ファイル**: `src/components/ui/markdown-renderer.tsx`, `src/components/ui/code-block.tsx`

インストール済みパッケージ：
- react-markdown
- remark-gfm
- react-syntax-highlighter
- dompurify

実装済み機能：
- [x] Markdownパース・表示
- [x] コードブロックのシンタックスハイライト（Prism + oneDark）
- [x] GFM（GitHub Flavored Markdown）対応
- [x] XSS対策（DOMPurify）

### 中優先度

#### 5. タグモーダルの移植 ✅ 完了
**ファイル**: `src/components/tag/tag-modal.tsx`

実装済み機能：
- [x] スニペットへのタグ付け
- [x] タグ一覧表示
- [x] タグ追加/削除（新規作成も可能）
- [x] 最大4タグまでの制限

#### 6. AI選択モーダルの移植 ✅ 完了
**ファイル**: `src/components/ai/select-ai-modal.tsx`

実装済み機能：
- [x] メッセージ送信時のAI選択ポップアップ
- [x] アクティブAI一覧の表示
- [x] デフォルトAIフォールバック

#### 7. タグフィルタリング機能 ✅ 完了
**ファイル**: `src/components/layout/sidebar-wrapper.tsx`（統合済み）

実装済み機能：
- [x] サイドバーでのタグフィルタ
- [x] 複数タグでのOR検索
- [x] タグバッジ表示
- [x] フィルタークリア機能

### 低優先度

#### 8. UIの詳細調整
- [x] モバイルレスポンシブ対応 ✅ 完了
  - `src/components/layout/sidebar-context.tsx` - サイドバー開閉状態管理
  - モバイルオーバーレイ + スライドインサイドバー
  - ハンバーガーメニューボタン（モバイル時）
- [x] 長押しジェスチャー（モバイル） ✅ 完了（`sidebar-wrapper.tsx`内に実装）
- [x] トースト通知システム ✅ 完了（`src/components/ui/toast.tsx`）
- [x] 確認ダイアログ ✅ 完了（`src/components/ui/confirm-modal.tsx`）
- [x] ローディング状態の改善 ✅ 完了
  - `src/components/ui/skeleton.tsx` - スケルトンローディングUI
  - MemoContent / SidebarWrapper にスケルトンUI適用

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

# 3. 環境変数設定（.envは設定済み）
# 新規セットアップの場合: cp .env.example .env && .envを編集

# 4. Prismaクライアント生成
npx prisma generate

# 5. データベースマイグレーション（済み - 11テーブル作成済み）
# 新規マイグレーション時のみ: npx prisma migrate dev --name [migration_name]

# 6. 開発サーバー起動
npm run dev
```

**注意**: Supabaseへの直接接続（prisma migrate dev）がローカルからブロックされる場合は、
Supabase MCP経由でSQLを実行するか、Supabase Dashboardから直接SQLを実行してください。

---

## 技術スタック

| 層 | 技術 | バージョン |
|---|------|----------|
| フレームワーク | Next.js (App Router) | 15.x |
| 言語 | TypeScript | 5.x |
| API | tRPC | 11.x |
| ORM | Prisma | 6.x |
| 認証 | NextAuth.js | 5.x (Auth.js) |
| スタイリング | Tailwind CSS | 4.x |
| データベース | PostgreSQL (Supabase) | - |
| アイコン | Lucide React | - |
| Markdown | react-markdown + remark-gfm | - |
| シンタックスハイライト | react-syntax-highlighter | - |
| セキュリティ | DOMPurify | - |

---

## 注意事項

1. **Prisma Generated**
   - `generated/`ディレクトリは`.gitignore`に含まれている
   - クローン後は必ず`npx prisma generate`を実行

2. **環境変数**
   - `.env`ファイルはコミットしない
   - Supabaseの接続情報はDashboard > Connect > ORMs > Prismaから取得
   - **重要**: pooler URLは `aws-1-ap-northeast-1.pooler.supabase.com`（`aws-0`ではない）

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
*更新日: 2026-01-30*
*作成者: Claude Code (Claude Opus 4.5)*
