import ForgotPassword from '@/src/layout-components/ForgotPassword';

export const metadata = {
  title: 'Khôi phục mật khẩu | BlogSocial',
  description: 'Khôi phục mật khẩu tài khoản BlogSocial của bạn.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <ForgotPassword />;
}

