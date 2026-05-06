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
cd 2026-05-04-csaf

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
