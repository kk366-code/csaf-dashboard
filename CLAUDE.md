# CSAF Dashboard — 開発ガイド

## パッケージ管理
- **uv** を使用する（`pip install` は使わない）
- 依存追加: `uv add <package>`
- 依存同期: `uv sync`
- スクリプト実行: `uv run python run.py`
- ロックファイル `uv.lock` はコミットすること

## Python バージョン
- ターゲット: **Python 3.14**
- `pyproject.toml` に `requires-python = ">=3.14"` を明記
- `.python-version` ファイルで `3.14` を指定

## フォーマット・リント
- **Ruff** を使用（black / flake8 / isort は使わない）
- フォーマット: `uv run ruff format .`
- リント: `uv run ruff check .`
- 設定は `pyproject.toml` の `[tool.ruff]` セクションで管理

## モダン Python の書き方
- `Optional[X]` ではなく `X | None` を使う
- `List[T]`, `Dict[K, V]` ではなく `list[T]`, `dict[K, V]` を使う
- SQLAlchemy 2.x スタイル: `Mapped[T]` + `mapped_column()` を使う
- 古い `Column(Integer, ...)` スタイルは使わない
- 前方参照には `TYPE_CHECKING` ブロックを使う
- 長い `if/elif` より `match` 文を優先する

## フロントエンド
- TypeScript + React 19 + Vite
- Tailwind CSS v4（設定は CSS ファイル内の `@theme` で行う）
- TanStack Query v5 でサーバー状態管理
- Orval で OpenAPI spec から API クライアントを自動生成: `npm run generate-api`
- 状態管理: Zustand v5

## 開発コマンド
```bash
# 初回セットアップ（Docker 起動前に必須）
cd backend && uv lock              # uv.lock を生成してからコミットすること
cp frontend/.env.example frontend/.env  # .env は gitignore 済み、各自で作成すること

# バックエンド起動（ローカル）
cd backend
uv sync
uv run python run.py

# Docker 起動
docker compose up

# API クライアント生成（バックエンド起動後に実行）
cd frontend
npm run generate-api

# フォーマット・リント
uv run ruff format .
uv run ruff check --fix .
```
