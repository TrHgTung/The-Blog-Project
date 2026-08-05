import LandingPage from '@/src/layout-components/LandingPage';

export const metadata = {
  title: 'BlogSocial - Nền tảng kết nối & Chia sẻ trải nghiệm thế hệ mới',
  description: 'Khám phá BlogSocial, nơi bạn kết nối với nhau, tham gia cộng đồng với những người cùng đam mê.',
  keywords: 'blogsocial, blogsocial vn, blog social, blog social vn, mạng xã hội, tạp chí online, chia sẻ trải nghiệm, viết blog',
  alternates: {
    canonical: '/landing-page',
  },
  openGraph: {
    title: 'BlogSocial - Nền tảng kết nối & Chia sẻ trải nghiệm',
    description: 'Khám phá BlogSocial, nơi bạn kết nối với nhau, tham gia cộng đồng với những người cùng đam mê.',
    url: 'https://blogsocial.io.vn/landing-page',
    siteName: 'BlogSocial',
    images: [
      {
        url: 'https://blogsocial.io.vn/bg.jpg',
        width: 1200,
        height: 630,
        alt: 'BlogSocial Landing Page',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BlogSocial - Nền tảng kết nối & Chia sẻ trải nghiệm',
    description: 'Khám phá BlogSocial, nơi bạn kết nối với nhau, tham gia cộng đồng với những người cùng đam mê.',
    images: ['https://blogsocial.io.vn/bg.jpg'],
  },
};

export default function Page() {
  return <LandingPage />;
}
