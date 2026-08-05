import WorldCup from '@/src/layout-components/WorldCup';

export const metadata = {
  title: 'Dự đoán kết quả bóng đá | BlogSocial',
  description: 'Tham gia GamesHub để dự đoán tỉ số bóng đá, World Cup, Football Premier League và các giải đấu hấp dẫn, nhận EXP giải trí. Các hoạt động cá cược là vi phạm pháp luật Việt Nam.',
  alternates: {
    canonical: '/world-cup',
  },
  openGraph: {
    title: 'Dự đoán kết quả bóng đá | BlogSocial',
    description: 'Tham gia GamesHub để dự đoán tỉ số bóng đá, World Cup, Football Premier League và các giải đấu hấp dẫn, nhận EXP giải trí. Các hoạt động cá cược là vi phạm pháp luật Việt Nam.',
    url: '/world-cup',
    siteName: 'BlogSocial',
    images: [{ url: 'https://blogsocial.io.vn/bg.jpg', width: 1200, height: 630, alt: 'Dự đoán bóng đá - World Cup 2026' }],
    type: 'website',
  },
};

export default function Page() {
  return <WorldCup />;
}
