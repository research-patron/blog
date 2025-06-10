# WordPress自動投稿システム

セメント技術ブログの記事を自動的にWordPressに投稿するシステムです。

## 機能

- 指定した日付の記事を自動投稿
- Markdownからワードプレス形式への変換
- メールでの投稿通知
- GitHub Actionsによる自動実行（毎日午前0時）

## セットアップ手順

1. WordPressの設定

```bash
# REST APIの有効化を確認
curl https://student-subscription.com/wp-json/

# 投稿エンドポイントの確認
curl https://student-subscription.com/wp-json/wp/v2/posts
```

2. アプリケーションパスワードの作成

WordPressの管理画面で：
1. ユーザー → プロフィール に移動
2. 「アプリケーションパスワード」セクションまでスクロール
3. 名前を入力（例：「Auto Blog Post」）
4. 「追加」をクリック
5. 生成されたパスワードを保存

3. 環境変数の設定

`.env.example`をコピーして`.env`を作成し、以下の情報を設定：

```bash
# WordPressの設定
WP_URL=https://student-subscription.com
WP_USERNAME=your-username
WP_APP_PASSWORD=your-application-password

# メール設定
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=s.kosei0626@gmail.com
SMTP_PASS=your-app-specific-password
```

4. GitHubシークレットの設定

GitHubリポジトリの Settings → Secrets and variables → Actions で以下のシークレットを追加：

- `WP_URL`
- `WP_USERNAME`
- `WP_APP_PASSWORD`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

5. 依存関係のインストール

```bash
npm install
```

## 記事のフォーマット

記事は以下のフロントマター形式で作成します：

```markdown
---
title: 記事タイトル
description: 記事の説明
keywords: [キーワード1, キーワード2]
category: カテゴリー名
date: YYYY-MM-DD
---

# 記事の内容
```

## 手動実行

GitHub Actionsのワークフローを手動で実行する場合：

1. GitHubリポジトリの「Actions」タブを開く
2. 「Daily Blog Post」ワークフローを選択
3. 「Run workflow」をクリック

## トラブルシューティング

### 投稿に失敗する場合

1. WordPressのREST API設定を確認
2. アプリケーションパスワードが正しいか確認
3. 記事のフロントマター形式が正しいか確認

### メール通知が届かない場合

1. SMTPの設定を確認
2. Gmailの「安全性の低いアプリ」の設定を確認
3. アプリパスワードが正しいか確認
