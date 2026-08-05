import PostDetailsClient from '@/src/layout-components/PostDetailsClient';
import { getPostBySlug, getComments } from '@/lib/api';
import '@/src/component-css/PostDetails.css';
import { notFound } from 'next/navigation';


export async function generateMetadata({ params }) {
  const { slug } = params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Bài viết không tồn tại | BlogSocial',
    };
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const baseUrl = apiUrl.replace('/api', '');
  const imageUrl = post.imageUrl
    ? (post.imageUrl.startsWith('http') ? post.imageUrl : `${baseUrl}${post.imageUrl}`)
    : 'https://blogsocial.io.vn/bg.jpg';

  const cleanContent = post.content ? post.content.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim() : '';
  const description = cleanContent.substring(0, 150) || 'Xem chi tiết bài viết trên BlogSocial';

  return {
    title: `${post.title} | BlogSocial`,
    description: description,
    alternates: {
      canonical: `https://blogsocial.io.vn/post/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: description,
      url: `/post/${slug}`,
      siteName: 'BlogSocial',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      type: 'article',
      publishedTime: post.createdAt,
      authors: [post.authorName || 'BlogSocial'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: description,
      images: [imageUrl],
    },
  };
}

export default async function Page({ params }) {
  const { slug } = params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const comments = await getComments(post.id);

  return <PostDetailsClient initialPost={post} initialComments={comments} />;
}
