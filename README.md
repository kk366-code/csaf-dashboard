# CSAF Dashboard

CSAF (Common Security Advisory Framework) アドバイザリを管理・公開するためのフルスタック Web アプリケーションです。セキュリティチームがアドバイザリを作成し、レビュー・承認・公開のワークフローを経て、標準的な CSAF JSON 形式で配信できます。

## 機能

- **Advisory ライフサイクル管理** — draft → review → approved → published のワークフロー
- **ロールベースアクセス制御** — admin / editor / viewer の 3 ロール
- **CSAF JSON 生成** — 公開済み advisory を標準 CSAF 形式でエクスポート
- **RSS フィード** — 公開済み advisory の RSS 配信 (`/rss.xml`)
- **監査ログ** — すべての操作を記録・検索可能
- **ダッシュボード** — severity / status 別の統計とグラフ

## 技術スタック

| 領域 | 技術 |
|------|------|
| Backend | Python 3.14, APIFlask, SQLAlchemy 2.x, PostgreSQL 17 |
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS v4, TanStack Query v5, Zustand v5 |
| Auth | Flask-JWT-Extended (JWT) |
| Infra | Docker, Docker Compose |
| Codegen | Orval (OpenAPI → TypeScript client) |

## クイックスタート（Docker Compose）

```bash
git clone <repository-url>
cd csaf-dashboard
cp frontend/.env.example frontend/.env
docker compose up
```

| サービス | URL |
|---------|-----|
| フロントエンド | http://localhost:5173 |
| バックエンド API | http://localhost:5001 |
| Swagger UI | http://localhost:5001/docs |

### デフォルトユーザー

| ユーザー名 | パスワード | ロール |
|-----------|-----------|--------|
| admin | admin1234 | admin |
| editor | editor1234 | editor |
| viewer | viewer1234 | viewer |

## ローカル開発セットアップ

### 前提条件

- Python 3.14 + [uv](https://docs.astral.sh/uv/)
- Node.js 20+

### バックエンド

```bash
cd backend
uv sync
uv run python run.py
```

### フロントエンド

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### API クライアント再生成（バックエンド起動後）

```bash
cd frontend
npm run generate-api
```

## 環境変数

### バックエンド

| 変数 | デフォルト | 説明 |
|------|-----------|------|
| `DATABASE_URL` | `postgresql://csaf_user:csaf_password@db:5432/csaf_db` | PostgreSQL 接続文字列 |
| `JWT_SECRET_KEY` | `dev-secret-key` | JWT 署名キー（**本番では必ず変更**） |

### フロントエンド（`frontend/.env`）

| 変数 | デフォルト | 説明 |
|------|-----------|------|
| `BACKEND_URL` | `http://localhost:5001` | バックエンド API の URL |

## 開発コマンド

```bash
# Python フォーマット・リント
cd backend
uv run ruff format .
uv run ruff check --fix .

# uv.lock 更新
cd backend
uv lock
```

## API ドキュメント

バックエンド起動後に以下でアクセスできます。

- Swagger UI: http://localhost:5001/docs
- OpenAPI JSON: http://localhost:5001/openapi.json

## フロントエンド操作と API の対応

開発時に「どの画面操作がどの API を叩いているか」を確認するためのリファレンスです。
本アプリケーション（CSAF Dashboard）のログイン後における、画面上の操作とAPIコールの対応関係を整理して説明します。

---

### 1. ダッシュボード (Dashboard)

ログイン直後に表示される画面です。

| 操作・表示内容 | 対応するAPIコール | 説明 |
| :--- | :--- | :--- |
| **画面読み込み時** | `GET /advisories/stats` | 全体件数や重大度別の統計データを取得します。 |
| **最新アドバイザリ一覧** | `GET /advisories/?page=1&per_page=5` | 最新の5件を取得して表示します。 |
| **アドバイザリ選択** | (画面遷移) | クリックすると詳細画面へ遷移します。 |

---

### 2. アドバイザリ一覧 (Advisories List)

左メニューの「アドバイザリ」からアクセスします。

| 操作・表示内容 | 対応するAPIコール | 説明 |
| :--- | :--- | :--- |
| **検索・フィルタ操作** | `GET /advisories/` | キーワード、重大度、ステータス、ページ番号をクエリパラメータに含めてリクエストします。 |
| **「新規作成」ボタン** | (画面遷移) | `AdvisoryForm` 画面へ遷移します。 |
| **ゴミ箱アイコン** | `DELETE /advisories/{id}` | アドバイザリを削除します（下書き状態のみ可）。 |

---

### 3. アドバイザリ登録・編集 (Advisory Form)

アドバイザリの作成および既存データの編集を行う画面です。

| 操作・表示内容 | 対応するAPIコール | 説明 |
| :--- | :--- | :--- |
| **「作成する」ボタン** | `POST /advisories/` | 入力されたタイトルやCVE IDなどを送信し、新規作成します。 |
| **「更新する」ボタン** | `PUT /advisories/{id}` | 既存のアドバイザリ情報を更新します。 |

---

### 4. アドバイザリ詳細 (Advisory Detail)

個別の脆弱性情報の確認と、ワークフロー（承認など）の操作を行う画面です。

| ボタン・操作 | 対応するAPIコール | 必要なロール / 条件 |
| :--- | :--- | :--- |
| **「レビュー申請」** | `POST /advisories/{id}/submit` | ステータスを `draft` → `review` へ変更します。 |
| **「承認」** | `POST /advisories/{id}/approve` | ステータスを `review` → `approved` へ変更します（Admin/Editor）。 |
| **「差し戻し」** | `POST /advisories/{id}/reject` | ステータスを `draft` へ戻します（Admin/Editor）。 |
| **「公開」** | `POST /advisories/{id}/publish` | ステータスを `published` にし、RSSへ反映させます（Adminのみ）。 |

---

### 5. 管理者機能 (Admin Functions)

左メニューの「管理」セクションにある機能です（管理者のみ利用可能）。

#### ユーザー管理 (Users)

| 操作 | 対応するAPIコール |
| :--- | :--- |
| **ユーザー一覧表示** | `GET /users/` |
| **「作成」ボタン** | `POST /users/` |
| **有効/無効切り替え** | `PUT /users/{id}` (is_activeパラメーターを送信) |
| **削除アイコン** | `DELETE /users/{id}` |

#### 監査ログ (Audit Logs)

| 操作 | 対応するAPIコール |
| :--- | :--- |
| **ログ一覧表示** | `GET /audit-logs/` |
| **操作種別フィルタ** | `GET /audit-logs/?action={action}` |

---

### 共通・その他

*   **認証:** 全てのAPIリクエストには、ログイン時に取得したJWTトークンが `Authorization: Bearer {token}` ヘッダーとして付与されます。
*   **自動ログアウト:** APIが `401 Unauthorized` を返した場合、フロントエンドは自動的にログイン画面へリダイレクトします。
*   **RSS:** サイドバーの「RSS フィード」リンクは `GET /rss.xml` を直接呼び出します。

ログイン後の主なワークフローは、**「作成 (POST) → 申請 (submit) → 承認 (approve) → 公開 (publish)」** というAPIコールの連鎖で構成されています。
