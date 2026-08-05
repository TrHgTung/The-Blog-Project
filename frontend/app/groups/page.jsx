import Groups from '@/src/layout-components/Groups';
import ProtectedRoute from '@/app/protected-route';

export const metadata = {
  title: 'Khám phá cộng đồng | BlogSocial',
  description: 'Khám phá và tham gia các Cộng đồng trên BlogSocial theo sở thích của bạn.',
  alternates: {
    canonical: '/groups',
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Cộng đồng BlogSocial',
    description: 'Kết nối và chia sẻ trong các hội nhóm thú vị trên BlogSocial.',
    url: '/groups',
    siteName: 'BlogSocial',
    locale: 'vi_VN',
    images: [
      {
        url: 'https://blogsocial.io.vn/bg.jpg',
        width: 1200,
        height: 630,
        alt: 'Cộng đồng BlogSocial',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cộng đồng BlogSocial',
    description: 'Kết nối và chia sẻ trong các hội nhóm thú vị trên BlogSocial.',
    images: ['https://blogsocial.io.vn/bg.jpg'],
  },
};

export default function Page() {
  return (
    <ProtectedRoute>
      <Groups />
    </ProtectedRoute>
  );
}
