import React from 'react';
import { useApp } from '../../context/AppContext';

const Notification = () => {
  const { notification } = useApp();
  if (!notification) return null;
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  return (
    <div className={`notification ${notification.type === 'error' ? 'error' : notification.type === 'warning' ? 'warning' : ''}`}>
      <span style={{ fontSize: '1.1rem' }}>{icons[notification.type] || '✅'}</span>
      <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{notification.message}</span>
    </div>
  );
};

export default Notification;
