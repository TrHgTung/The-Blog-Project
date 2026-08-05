'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const STATIC_EVENTS = [
  { label: 'Tết Nguyên Đán Việt Nam', date: '2027-02-06T00:00:00' },
  { label: 'Năm mới (Tết Tây)', date: '2027-01-01T00:00:00' },
  { label: 'Giỗ tổ Hùng Vương', date: '2026-04-26T00:00:00' },
  { label: 'Giải phóng miền Nam', date: '2026-04-30T00:00:00' },
  { label: 'Quốc tế Lao động', date: '2026-05-01T00:00:00' },
  { label: 'Lễ Quốc Khánh', date: '2026-09-02T00:00:00' },
  { label: 'Giáng Sinh', date: '2026-12-25T00:00:00' },
];

const getNextBirthday = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();

  // Tạo ngày sinh nhật trong năm hiện tại, gán giờ/phút/giây về 0 để so sánh chính xác hơn
  let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());

  // Nếu sinh nhật đã qua trong năm nay (so sánh ngày), chuyển sang năm sau
  if (nextBirthday < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }

  return nextBirthday;
};


const calculateTimeLeft = (targetDate) => {
  const difference = new Date(targetDate) - new Date();
  let timeLeft = {};

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };
  } else {
    timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return timeLeft;
};

const Countdown = () => {
  const { user } = useAuth();
  const [customEvent, setCustomEvent] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [isClient, setIsClient] = useState(false);

  const userBirthdayDate = getNextBirthday(user?.dateOfBirth);

  let EVENTS = userBirthdayDate
    ? [{ label: 'Sinh nhật của bạn', date: userBirthdayDate }, ...STATIC_EVENTS]
    : [{ label: 'Sinh nhật của bạn', promptSetup: true }, ...STATIC_EVENTS];

  if (customEvent) {
    if (!EVENTS.find(e => e.label === customEvent.label)) {
      EVENTS.unshift(customEvent);
    }
  }

  // Lấy sự kiện đang chọn, nếu không có thì mặc định chọn sự kiện đầu tiên
  const activeEvent = EVENTS.find(e => e.label === selectedLabel) || EVENTS[0];

  const [timeLeft, setTimeLeft] = useState(
    activeEvent.date ? calculateTimeLeft(activeEvent.date) : { days: 0, hours: 0, minutes: 0, seconds: 0 }
  );

  useEffect(() => {
    setIsClient(true);
    document.title = 'Đếm ngược sự kiện | BlogSocial';

    // Parse URL param for shared events: ?date=YYYY-MM-DD&label=Title
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const dateParam = params.get('date');
      const labelParam = params.get('label') || 'Sự kiện chia sẻ';

      if (dateParam) {
        const parsedDate = new Date(dateParam);
        if (!isNaN(parsedDate.getTime())) {
          const m = parsedDate.getMonth();
          const d = parsedDate.getDate();

          const matchedStaticEvent = STATIC_EVENTS.find(evt => {
            const staticDate = new Date(evt.date);
            return staticDate.getMonth() === m && staticDate.getDate() === d;
          });

          if (matchedStaticEvent) {
            setSelectedLabel(matchedStaticEvent.label);
          } else {
            setCustomEvent({ label: labelParam, date: parsedDate });
            setSelectedLabel(labelParam);
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!activeEvent.date) return;

    setTimeLeft(calculateTimeLeft(activeEvent.date));

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(activeEvent.date));
    }, 1000);

    return () => clearInterval(timer);
  }, [activeEvent.date]);

  const handleEventChange = (e) => {
    setSelectedLabel(e.target.value);
  };

  if (!isClient) {
    return <div className="container maybe-is-birthday-card" style={{ textAlign: 'center', padding: '5rem' }}>Đang tải bộ đếm...</div>;
  }

  return (
    <div className="container" style={{ textAlign: 'center' }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 style={{ marginBottom: '2rem' }}>Đếm ngược sự kiện</h1>
        {/* Hiện tại */}
        <div style={{ marginBottom: '1rem' }}>
          <small style={{ marginBottom: '1rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>Hiện tại là ngày {new Date().toLocaleDateString()}</small>
        </div>
        {/* main */}
        <div className='event-select-lbl-container' style={{ marginBottom: '3rem' }}>
          <label className='event-select-label' htmlFor="event-select" style={{ marginRight: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
            Chọn sự kiện cần tra:
          </label>
          <select
            id="event-select"
            value={activeEvent.label}
            onChange={handleEventChange}
            style={{
              padding: '0.8rem 1.2rem',
              fontSize: '1.1rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card-dark)',
              color: 'var(--text-light)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {EVENTS.map((event) => (
              <option key={event.label} value={event.label}>
                {event.label}
              </option>
            ))}
          </select>
        </div>

        {activeEvent.promptSetup ? (
          <div style={{
            padding: '2rem', border: '1px dashed var(--border)', borderRadius: '1rem', marginTop: '2rem',
            backgroundColor: 'rgba(255,255,255,0.02)'
          }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '1.1rem' }}>
              {user ? "Bạn chưa nhập ngày sinh trên hệ thống." : "Trở thành thành viên để BlogSocial nhắc về sinh nhật của bạn!"}
            </p>
            {user ? (
              <button
                onClick={() => window.location.href = `/profile/${user.id}`}
                className="auth-btn"
                style={{ display: 'inline-block', width: 'fit-content', textDecoration: 'none' }}>
                Cập nhật ngay hồ sơ
              </button>
            ) : (
              <button
                onClick={() => window.location.href = '/login'}
                className="auth-btn"
                style={{ display: 'inline-block', width: 'fit-content', textDecoration: 'none' }}>
                Đăng nhập tài khoản
              </button>
            )}
          </div>
        ) : (
          <>
            <div className='marginBottom4'>
              <span>Tính từ hôm nay, chỉ còn </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              {[
                { label: 'Ngày', value: timeLeft.days },
                { label: 'Giờ', value: timeLeft.hours },
                { label: 'Phút', value: timeLeft.minutes },
                { label: 'Giây', value: timeLeft.seconds },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  style={{
                    backgroundColor: 'var(--card-dark)',
                    border: '1px solid var(--border)',
                    borderRadius: '1rem',
                    padding: '2rem',
                    minWidth: '120px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <span style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)', lineHeight: 1 }}>
                    {item.value}
                  </span>
                  <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </div>

            <div className='marginTop4'>
              <span>nữa là đến ngày lễ {activeEvent.label}</span>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Countdown;
