import SearchResults from '@/src/layout-components/SearchResults';

export const metadata = {
  title: 'Kết quả tìm kiếm | BlogSocial',
  description: 'Tìm kiếm bài viết và thành viên trên BlogSocial.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <SearchResults />;
}

