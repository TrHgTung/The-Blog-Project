import GroupDetailClient from '@/src/layout-components/GroupDetailClient';
import { getGroupBySlug } from '@/lib/api';
import ProtectedRoute from '@/app/protected-route';

export async function generateMetadata({ params }) {
  const { slug } = params;
  const group = await getGroupBySlug(slug);

  if (!group) {
    return {
      title: 'Cộng đồng không tồn tại | BlogSocial',
    };
  }

  const title = `Cộng đồng ${group.name} | BlogSocial`;
  const description = group.description || `Tham gia cộng đồng ${group.name} để chia sẻ và cập nhật nội dung mới nhất.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://blogsocial.io.vn/groups/${slug}`,
    },
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title,
      description,
      url: `/groups/${slug}`,
      siteName: 'BlogSocial',
      images: [
        {
          url: group.imageUrl || 'https://blogsocial.io.vn/bg.jpg',
          width: 1200,
          height: 630,
          alt: group.name,
        }
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [group.imageUrl || 'https://blogsocial.io.vn/bg.jpg'],
    },
  };
}

export default async function Page({ params }) {
  const { slug } = params;
  const group = await getGroupBySlug(slug);

  return (
    <ProtectedRoute>
      <GroupDetailClient initialGroup={group} slug={slug} />
    </ProtectedRoute>
  );
}
