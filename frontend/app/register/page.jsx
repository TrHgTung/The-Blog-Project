import Register from '@/src/layout-components/Register';

export const metadata = {
  title: 'Đăng ký | BlogSocial',
  description: 'Tham gia BlogSocial ngay hôm nay để trở thành một phần của cộng đồng chia sẻ.',
  alternates: {
    canonical: '/register',
  },
  openGraph: {
    title: 'Đăng ký | BlogSocial',
    description: 'Tham gia BlogSocial ngay hôm nay để trở thành một phần của cộng đồng chia sẻ.',
    url: '/register',
    siteName: 'BlogSocial',
    images: [{ url: 'https://blogsocial.io.vn/bg.jpg', width: 1200, height: 630, alt: 'Đăng ký BlogSocial' }],
    type: 'website',
  },
};

export default function Page() {
  return <Register />;
}
