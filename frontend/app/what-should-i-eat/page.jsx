import FoodStall from '@/src/layout-components/FoodStall';

export const metadata = {
    title: 'Hôm nay ăn gì | BlogSocial',
    description: 'Hệ thống bản đồ ẩm thực Việt Nam giúp bạn tìm được quán ăn phù hợp với vị giác của bạn',
    alternates: {
        canonical: '/what-should-i-eat',
    },
    openGraph: {
        title: 'Hôm nay ăn gì | BlogSocial',
        description: 'Hệ thống bản đồ ẩm thực Việt Nam giúp bạn tìm được quán ăn phù hợp với vị giác của bạn',
        url: '/what-should-i-eat',
        siteName: 'BlogSocial',
        images: [{ url: 'https://blogsocial.io.vn/bg.jpg', width: 1200, height: 630, alt: 'Về BlogSocial' }],
        type: 'website',
    },
};

export default function Page() {
    return <FoodStall />;
}
