import GameCenter from '@/src/layout-components/GameCenter';

export const metadata = {
  title: 'Trung tâm trò chơi GamesHub | BlogSocial',
  description: 'Khám phá bộ sưu tập trò chơi giải trí thú vị và chinh phục trên bảng xếp hạng EXP.',
  alternates: {
    canonical: '/game-center',
  },
  openGraph: {
    title: 'Trung tâm trò chơi GamesHub | BlogSocial',
    description: 'Khám phá bộ sưu tập trò chơi giải trí thú vị và chinh phục trên bảng xếp hạng EXP.',
    url: '/game-center',
    siteName: 'BlogSocial',
    images: [{ url: 'https://blogsocial.io.vn/bg.jpg', width: 1200, height: 630, alt: 'GamesHub' }],
    type: 'website',
  },
};

export default function Page() {
  return <GameCenter />;
}
