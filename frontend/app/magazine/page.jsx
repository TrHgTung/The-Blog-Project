import Magazine from '@/src/layout-components/Magazine';
import ProtectedRoute from '@/app/protected-route';

export const metadata = {
  title: 'Tạp chí | BlogSocial',
  description: 'Khám phá những câu chuyện tuyệt vời từ khắp mọi nơi, khơi gợi sự sáng tạo của mọi người. Và hãy chia sẻ những câu chuyện của chính bạn đến với họ.',
  alternates: {
    canonical: '/magazine',
  },
  openGraph: {
    title: 'Tạp chí BlogSocial',
    description: 'Khám phá những câu chuyện tuyệt vời từ khắp mọi nơi, khơi gợi sự sáng tạo của mọi người. Và hãy chia sẻ những câu chuyện của chính bạn đến với họ..',
    url: '/magazine',
    siteName: 'BlogSocial',
    images: [
      {
        url: 'https://blogsocial.io.vn/bg.jpg',
        width: 1200,
        height: 630,
        alt: 'Tạp chí BlogSocial',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tạp chí BlogSocial',
    description: 'Khám phá những câu chuyện tuyệt vời từ khắp mọi nơi, khơi gợi sự sáng tạo của mọi người. Và hãy chia sẻ những câu chuyện của chính bạn đến với họ..',
    images: ['https://blogsocial.io.vn/bg.jpg'],
  },
};

export default function Page() {
  return (
    <Magazine />
  );
}

