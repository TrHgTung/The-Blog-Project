// Ưu tiên dùng INTERNAL_API_URL khi chạy trên server (nhanh hơn, không qua Caddy)
const IS_SERVER = typeof window === 'undefined';
const API_URL = (IS_SERVER && process.env.INTERNAL_API_URL)
  ? process.env.INTERNAL_API_URL
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://blogsocial.io.vn';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function sitemap() {
  const now = new Date();

  // --- Bài viết (Posts) ---
  let postUrls = [];
  try {
    const postsRes = await fetch(`${API_URL}/posts?page=1&limit=500`, {
      cache: 'no-store',
    });
    if (postsRes.ok) {
      const data = await postsRes.json();
      const posts = Array.isArray(data) ? data : (data?.posts ?? data?.items ?? []);
      postUrls = posts
        .filter((p) => p?.slug)
        .map((post) => ({
          url: `${BASE_URL}/post/${post.slug}`,
          lastModified: new Date(post.updatedAt || post.createdAt || now),
          changeFrequency: 'monthly',
          priority: 0.6,
        }));
    }
  } catch (e) {
    console.error('[sitemap] Lỗi fetch posts:', e);
  }

  // --- Tạp chí (Magazines) ---
  let magazineUrls = [];
  try {
    const magazinesRes = await fetch(`${API_URL}/magazine?page=1&limit=500`, {
      cache: 'no-store',
    });
    if (magazinesRes.ok) {
      const data = await magazinesRes.json();
      const magazines = Array.isArray(data) ? data : (data?.magazines ?? data?.items ?? []);
      magazineUrls = magazines
        .filter((m) => m?.slug)
        .map((magazine) => ({
          url: `${BASE_URL}/magazine/${magazine.slug}`,
          lastModified: new Date(magazine.createdAt || now),
          changeFrequency: 'weekly',
          priority: 0.7,
        }));
    }
  } catch (e) {
    console.error('[sitemap] Lỗi fetch magazines:', e);
  }

  // --- Static routes ---
  const staticRoutes = [
    { path: '', priority: 1.0, changeFrequency: 'daily' },
    { path: '/login', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/register', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/magazine', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/landing-page', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/search', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/game-center', priority: 0.9, changeFrequency: 'yearly' },
    { path: '/what-should-i-eat', priority: 0.8, changeFrequency: 'yearly' },
    { path: '/countdown', priority: 0.7, changeFrequency: 'yearly' },
    { path: '/world-cup', priority: 0.8, changeFrequency: 'yearly' },
    { path: '/fruit-ninja', priority: 0.8, changeFrequency: 'yearly' },
    { path: '/mini-game', priority: 0.8, changeFrequency: 'yearly' },
  ].map(({ path, priority, changeFrequency }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  return [...staticRoutes, ...postUrls, ...magazineUrls];
}

