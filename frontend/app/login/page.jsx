import Login from '@/src/layout-components/Login';

export const metadata = {
  title: 'Đăng nhập | BlogSocial',
  description: 'Đăng nhập vào tài khoản BlogSocial của bạn để bắt đầu chia sẻ.',
  alternates: {
    canonical: '/login',
  },
  openGraph: {
    title: 'Đăng nhập | BlogSocial',
    description: 'Đăng nhập vào tài khoản BlogSocial của bạn để bắt đầu chia sẻ.',
    url: '/login',
    siteName: 'BlogSocial',
    images: [{ url: 'https://blogsocial.io.vn/bg.jpg', width: 1200, height: 630, alt: 'Đăng nhập BlogSocial' }],
    type: 'website',
  },
};

export default function Page() {
  return <Login />;
}
