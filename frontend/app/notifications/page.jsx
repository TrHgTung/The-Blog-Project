import Notifications from '@/src/layout-components/Notifications';
import ProtectedRoute from '@/app/protected-route';

export const metadata = {
  title: 'Trung tâm thông báo | BlogSocial',
  description: 'Xem các thông báo mới về lượt tương tác hoạt động của bạn trên BlogSocial.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <ProtectedRoute>
      <Notifications />
    </ProtectedRoute>
  );
}

