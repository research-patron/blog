const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

// WordPress API設定
const WP_URL = process.env.WP_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

// メール設定
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// 日付をYYYY-MM-DD形式に変換
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// WordPressに投稿
async function createPost(title, content, excerpt, categories, tags) {
  const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');
  
  const response = await fetch(`${WP_URL}/wp-json/wp/v2/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`
    },
    body: JSON.stringify({
      title,
      content,
      excerpt,
      status: 'publish',
      categories,
      tags
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create post: ${response.statusText}`);
  }

  return await response.json();
}

// メール送信
async function sendNotification(title, url) {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.SMTP_USER,
    subject: '新しい記事が投稿されました',
    text: `
記事「${title}」が正常に投稿されました。
URL: ${url}
    `,
    html: `
<h2>新しい記事が投稿されました</h2>
<p>記事「${title}」が正常に投稿されました。</p>
<p><a href="${url}">記事を確認する</a></p>
    `
  });
}

// メイン処理
async function main() {
  try {
    // 今日の日付を取得
    const today = formatDate(new Date());
    
    // 記事ディレクトリを再帰的に検索
    async function findTodaysPost(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const found = await findTodaysPost(fullPath);
          if (found) return found;
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const content = await fs.readFile(fullPath, 'utf8');
          const { data } = matter(content);
          
          if (data.date === today) {
            return { path: fullPath, content };
          }
        }
      }
      
      return null;
    }
    
    const post = await findTodaysPost(path.join(process.cwd(), '成果物'));
    
    if (!post) {
      console.log('今日の日付の記事が見つかりませんでした。');
      return;
    }
    
    // Markdownの解析
    const { data, content } = matter(post.content);
    
    // HTMLに変換
    const htmlContent = marked(content);
    
    // WordPressに投稿
    const result = await createPost(
      data.title,
      htmlContent,
      data.description,
      [data.category],
      data.keywords
    );
    
    // 投稿完了を通知
    await sendNotification(data.title, result.link);
    
    console.log(`記事「${data.title}」を投稿しました。`);
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

main();
