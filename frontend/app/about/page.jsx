import AboutAuthor from '@/src/layout-components/AboutAuthor';

export const metadata = {
  title: 'Về tác giả | BlogSocial',
  description: 'Tìm hiểu thêm về đội ngũ phát triển và sứ mệnh của BlogSocial.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'Về tác giả BlogSocial',
    description: 'Hành trình xây dựng BlogSocial - Nơi chia sẻ trải nghiệm số.',
    url: '/about',
    siteName: 'BlogSocial',
    images: [{ url: 'https://blogsocial.io.vn/bg.jpg', width: 1200, height: 630, alt: 'Về BlogSocial' }],
    type: 'website',
  },
};

export default function Page() {
  return <AboutAuthor />;
}
