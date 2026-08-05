import PrivacyPolicyClient from '@/src/layout-components/PrivacyPolicy';

export const metadata = {
  title: 'Chính sách bảo mật | BlogSocial',
  description: 'Tìm hiểu về cách BlogSocial bảo vệ thông tin cá nhân và dữ liệu của bạn.',
  alternates: {
    canonical: '/privacy-policy',
  },
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />;
}
