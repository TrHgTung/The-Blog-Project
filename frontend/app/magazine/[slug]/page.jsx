import MagazineDetailsClient from '@/src/layout-components/MagazineDetailsClient';
import { getMagazineBySlug } from '@/lib/api';
import '@/src/component-css/PostDetails.css';
import '@/src/component-css/MagazineDetails.css';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { slug } = params;
  const magazine = await getMagazineBySlug(slug);

  if (!magazine) {
    return {
      title: 'Tạp chí không tồn tại | BlogSocial',
      description: 'Xin lỗi, tạp chí bạn tìm kiếm hiện không có sẵn.',
    };
  }

  const title = `${magazine.magazineName} | Tạp chí BlogSocial`;

  // Use first paragraph if available, else a default message
  const firstPage = magazine.pages?.[0];
  const description = firstPage?.firstParagraph?.substring(0, 150) || `Khám phá tạp chí "${magazine.magazineName}" của tác giả ${magazine.authorName} trên BlogSocial.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://blogsocial.io.vn/magazine/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://blogsocial.io.vn/magazine/${slug}`,
      siteName: 'BlogSocial',
      images: [
        {
          url: magazine.coverImage || 'https://blogsocial.io.vn/bg.jpg',
          width: 1200,
          height: 630,
          alt: magazine.magazineName,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [magazine.coverImage || 'https://blogsocial.io.vn/bg.jpg'],
    },
  };
}

export default async function Page({ params }) {
  const { slug } = params;
  const magazine = await getMagazineBySlug(slug);

  if (!magazine) {
    notFound();
  }

  return <MagazineDetailsClient initialMagazine={magazine} slug={slug} />;
}
