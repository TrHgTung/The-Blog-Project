import Profile from '@/src/layout-components/Profile';
import { getUserById } from '@/lib/api';

export async function generateMetadata({ params }) {
  const { id } = params;
  const user = await getUserById(id);

  if (!user) {
    return {
      title: 'Tài khoản bị vô hiệu hóa | BlogSocial',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `Trang cá nhân của ${user.displayName} | BlogSocial`;
  const description = user.bio || `Xem trang cá nhân của ${user.displayName} trên BlogSocial.`;
  const imageUrl = user.profilePicture || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/cartoon/${user.cartoonCharacter || 1}.png`;

  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `https://blogsocial.io.vn/profile/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `/profile/${id}`,
      siteName: 'BlogSocial',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: user.displayName,
        },
      ],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function Page() {
  return <Profile />;
}
