import VerifyEmail from '@/src/layout-components/VerifyEmail';

export const metadata = {
  title: 'Xác minh Email | BlogSocial',
  description: 'Vui lòng xác minh địa chỉ email của bạn để sử dụng BlogSocial.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <VerifyEmail />;
}

