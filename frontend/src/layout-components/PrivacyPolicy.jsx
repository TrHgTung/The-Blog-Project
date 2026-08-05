'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, Bell, Mail, Activity } from 'lucide-react';

const PrivacyPolicy = () => {
  const sections = [
    {
      icon: <Database className="w-6 h-6 text-blue-400" />,
      title: '1. Về dữ liệu người dùng',
      content: 'Chào mừng bạn đến với BlogSocial. Đầu tiên, BlogSocial miễn trừ trách nhiệm đối với dữ liệu thông tin của bạn. Nền tảng này không sử dụng thông tin của bạn với mục đích xấu nào cả, nhưng sẽ không chịu trách nhiệm nếu thông tin bị tấn công và đánh cắp. Vì vậy, chúng tôi khuyên bạn và bắt buộc bạn sử dụng dữ liệu ảo để tham gia, ngoại trừ các thông tin như Tên hiển thị có thể dùng tên thật để dễ dàng tiếp cận tương tác.'
    },
    {
      icon: <Activity className="w-6 h-6 text-blue-400" />,
      title: '2. Về các hoạt động trên nền tảng',
      content: 'Chúng tôi cũng miễn trừ trách nhiệm dối với các hoạt dộng trên nền web, như đăng bài, tạp chí, các hoạt động trò chơi được tích hợp. Các tính năng trên được tạo ra với mục đích giải trí, vui vẻ, không được dùng với mục đích khác và không lợi nhuận, cũng như không mang lại yếu tố phạm pháp, chống phá nào cả.'
    },
    {
      icon: <Mail className="w-6 h-6 text-cyan-400" />,
      title: '3. Liên hệ',
      content: 'Chúc vui vẻ với BlogSocial. Nếu có bất kỳ câu hỏi nào về chính sách bảo mật này, vui lòng liên hệ với tác giả! Lần cuối cập nhật: 31/05/2026 (23:45 - GMT+7)'
    }
  ];

  return (
    <div className="privacy-policy-page" style={{ 
      paddingTop: '80px', 
      paddingBottom: '100px',
      minHeight: '100vh',
      background: 'transparent'
    }}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '60px' }}
        >
          <h1 style={{ 
            textAlign: 'center',
            fontSize: '3rem', 
            fontWeight: '800', 
            marginBottom: '1rem',
            background: 'linear-gradient(to right, #ffffff, #64748b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Chính sách bảo mật
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            BlogSocial Community
          </p>
        </motion.div>

        <div className="policy-sections" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              style={{
                background: 'rgba(30, 41, 59, 0.3)',
                backdropFilter: 'blur(10px)',
                borderRadius: '1.5rem',
                padding: '2rem',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                {section.icon}
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#f8fafc' }}>{section.title}</h3>
              </div>
              <p style={{ color: '#94a3b8', lineHeight: '1.7', fontSize: '1rem' }}>
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          style={{ 
            marginTop: '60px', 
            textAlign: 'center', 
            padding: '2rem',
            borderTop: '1px solid var(--border)'
          }}
        >
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Cảm ơn bạn đã tin tưởng và sử dụng BlogSocial. Chúng tôi luôn nỗ lực để bảo vệ dữ liệu của bạn một cách tốt nhì.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
