import CreatePost from '@/src/layout-components/CreatePost';
import ProtectedRoute from '@/app/protected-route';

export const metadata = {
  title: 'Chỉnh sửa bài viết | BlogSocial',
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

