import FruitNinja from '@/src/layout-components/FruitNinja';

export const metadata = {
  title: 'Fruit Ninja | BlogSocial MiniGame',
  description: 'Trò chơi chém hoa quả cực đỉnh, tích lũy điểm số kinh nghiệm (EXP) nhanh chóng với trò chơi này nhé.',
  alternates: {
    canonical: '/fruit-ninja',
  },
  openGraph: {
    title: 'Fruit Ninja | BlogSocial MiniGame',
    description: 'Trò chơi chém hoa quả cực đỉnh, tích lũy điểm số kinh nghiệm (EXP) nhanh chóng với trò chơi này nhé.',
    url: '/fruit-ninja',
    siteName: 'BlogSocial',
    images: [{ url: 'https://blogsocial.io.vn/bg.jpg', width: 1200, height: 630, alt: 'Fruit Ninja' }],
    type: 'website',
  },
};

export default function Page() {
  return <FruitNinja />;
}
