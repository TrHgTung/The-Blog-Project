import { Link } from '@/next-compat';

export default function NotFound() {
  return (
    <div className="container not-found-container" style={{ textAlign: 'center', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Uh Oh! Không tìm thấy nội dung</h1>
      <div className='back-to-home-404'>
        <Link href="/" style={{ display: 'inline-block', marginTop: '1rem', color: 'var(--text-muted)', textDecoration: 'none', border: '1px solid var(--text-muted)', padding: '0.5rem 1rem', borderRadius: '30px' }}>
          Quay lại trang chủ
        </Link>
      </div>
    </div>
  );
}
