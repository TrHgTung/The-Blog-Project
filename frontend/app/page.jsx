import HomeClient from '@/src/layout-components/HomeClient';
import { getPosts } from '@/lib/api';

export const metadata = {
  title: 'Thế giới mở dành cho mọi người | BlogSocial',
  description: 'Hàng ngàn bài viết đang chờ bạn khám phá trên BlogSocial - Nền tảng cộng đồng chia sẻ trải nghiệm mới nổi.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'BlogSocial - Cộng đồng mạng xã hội công nghệ',
    description: 'Chia sẻ trải nghiệm, bài viết công nghệ và kết nối cộng đồng.',
    url: 'https://blogsocial.io.vn',
    siteName: 'BlogSocial',
    images: [
      {
        url: 'https://blogsocial.io.vn/bg.jpg',
        width: 1200,
        height: 630,
        alt: 'BlogSocial - Cộng đồng mạng xã hội công nghệ',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BlogSocial - Cộng đồng mạng xã hội công nghệ',
    description: 'Chia sẻ trải nghiệm, bài viết công nghệ và kết nối cộng đồng.',
    images: ['https://blogsocial.io.vn/bg.jpg'],
  },
};

export default async function HomePage() {
  const initialPosts = await getPosts(1, 10);
  
  return <HomeClient initialPosts={initialPosts} />;
}
