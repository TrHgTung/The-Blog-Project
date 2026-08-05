import MiniGame from '@/src/layout-components/MiniGame';

export const metadata = {
  title: 'Emoji Ping Pong Game | BlogSocial MiniGame',
  description: 'Emoji Ping Pong Game giải trí nhẹ nhàng cùng cộng đồng BlogSocial, tích lũy điểm số kinh nghiệm (EXP) nhanh chóng với trò chơi này nhé.',
  alternates: {
    canonical: '/mini-game',
  },
  openGraph: {
    title: 'Emoji Ping Pong Game | BlogSocial MiniGame',
    description: 'Emoji Ping Pong Game giải trí nhẹ nhàng cùng cộng đồng BlogSocial, tích lũy điểm số kinh nghiệm (EXP) nhanh chóng với trò chơi này nhé.',
    url: '/mini-game',
    siteName: 'BlogSocial',
    images: [{ url: 'https://blogsocial.io.vn/bg.jpg', width: 1200, height: 630, alt: 'Emoji Ping Pong Game' }],
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return <MiniGame />;
}

