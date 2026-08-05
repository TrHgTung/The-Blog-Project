import CreatePost from '@/src/layout-components/CreatePost';
import ProtectedRoute from '@/app/protected-route';

export const metadata = {
  title: 'Tạo bài viết mới | BlogSocial',
  description: 'Chia sẻ câu chuyện và trải nghiệm của bạn với cộng đồng BlogSocial.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <ProtectedRoute>
      <CreatePost />
    </ProtectedRoute>
  );
}

