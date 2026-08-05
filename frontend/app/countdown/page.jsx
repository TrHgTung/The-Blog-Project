import Countdown from '@/src/layout-components/Countdown';

export const metadata = {
  title: 'Đếm ngược sự kiện | BlogSocial',
  description: 'Đếm ngược đến sự kiện đặc biệt tiếp theo trên BlogSocial.',
  alternates: {
    canonical: '/countdown',
  },
  openGraph: {
    title: 'Đếm ngược sự kiện | BlogSocial',
    description: 'Đếm ngược đến sự kiện đặc biệt tiếp theo trên BlogSocial.',
    url: '/countdown',
    siteName: 'BlogSocial',
    images: [{ url: 'https://blogsocial.io.vn/bg.jpg', width: 1200, height: 630, alt: 'Đếm ngược sự kiện' }],
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return <Countdown />;
}

