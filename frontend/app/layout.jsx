import '../src/index.css';
import '../src/App.css';
import { Providers } from './providers';
import ClientLayout from './client-layout';
import Script from 'next/script';

export const metadata = {
  title: 'BlogSocial - Cộng đồng mạng xã hội công nghệ',
  description: 'Tham gia BlogSocial ngay hôm nay để chia sẻ và cập nhật trải nghiệm từ chính bạn.',
  metadataBase: new URL('https://blogsocial.io.vn'),
  icons: {
    icon: '/favicon.png',
  },
  openGraph: {
    title: 'BlogSocial - Cộng đồng mạng xã hội công nghệ',
    description: 'Tham gia BlogSocial ngay hôm nay để chia sẻ và cập nhật trải nghiệm từ chính bạn.',
    url: 'https://blogsocial.io.vn',
    siteName: 'BlogSocial',
    images: [
      {
        url: '/bg.jpg',
        width: 1200,
        height: 630,
        alt: 'BlogSocial Cover Image',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BlogSocial - Cộng đồng mạng xã hội công nghệ',
    description: 'Tham gia BlogSocial ngay hôm nay để chia sẻ và cập nhật trải nghiệm từ chính bạn.',
    images: ['/bg.jpg'], // Tương tự ảnh OG
    creator: '@blogsocial_vn',
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "BlogSocial",
    "url": "https://blogsocial.io.vn",
    "description": "Cộng đồng chia sẻ trải nghiệm, bài viết công nghệ.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://blogsocial.io.vn/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "sameAs": [
      "https://gitlab.com/TrHgTung",
      "https://www.youtube.com/@blogsocial_vn",
      "https://www.pinterest.com/blogsocialvn/",
      "https://x.com/blogsocial_vn",
      "https://www.facebook.com/blogsocialvn/",
      "https://blogsocialvn9.wordpress.com/blogsocial-vn/"
    ]
  };

  return (
    <html lang="vi">
      <head>
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          strategy="beforeInteractive"
        />
        {/* Google Analytics 4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-SV6RYP0YNY"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-SV6RYP0YNY');
          `}
        </Script>
      </head>
      <body>
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}

