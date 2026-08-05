import Chat from '@/src/layout-components/Chat';
import ProtectedRoute from '@/app/protected-route';

export const metadata = {
  title: 'Trò chuyện | BlogSocial',
  description: 'Kết nối và trò chuyện trực tuyến với bạn bè trên nền tảng BlogSocial.',
  alternates: {
    canonical: '/chat',
  },
  openGraph: {
    title: 'Chat BlogSocial',
    description: 'Nền tảng nhắn tin thời gian thực nhanh và bảo mật.',
    url: '/chat',
    type: 'website',
  },
};

export default function Page() {
  return (
    <ProtectedRoute>
      <Chat />
    </ProtectedRoute>
  );
}

