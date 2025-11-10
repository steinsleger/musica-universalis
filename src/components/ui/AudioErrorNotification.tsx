import React, { useEffect, useState } from 'react';
import { useAudioControls } from '../../hooks/useAudioControls';

const AudioErrorNotificationComponent: React.FC = () => {
  const { audioError, setAudioError, audioHealthStatus } = useAudioControls();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (audioError) {
      setIsVisible(true);
    }
  }, [audioError]);

  const handleDismiss = (): void => {
    setIsVisible(false);
    setTimeout(() => {
      setAudioError(null);
    }, 300);
  };

  if (!isVisible || !audioError) {
    return null;
  }

  const getColorScheme = (): { background: string; border: string; icon: string } => {
    switch (audioHealthStatus) {
      case 'failed':
        return {
          background: 'rgba(211, 47, 47, 0.9)',
          border: '#d32f2f',
          icon: '⚠'
        };
      case 'degraded':
        return {
          background: 'rgba(255, 152, 0, 0.9)',
          border: '#ff9800',
          icon: '⚡'
        };
      default:
        return {
          background: 'rgba(0, 0, 0, 0.8)',
          border: '#666',
          icon: 'ℹ'
        };
    }
  };

  const colors = getColorScheme();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: colors.background,
        border: `2px solid ${colors.border}`,
        color: 'white',
        padding: '16px',
        borderRadius: '8px',
        zIndex: 1001,
        maxWidth: '300px',
        animation: 'slideIn 0.3s ease-in-out',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}
      role="alert"
      aria-live="assertive"
    >
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>{colors.icon}</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px' }}>
            {audioHealthStatus === 'failed' ? 'Audio Error' : 'Audio Notice'}
          </p>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.4 }}>{audioError}</p>
        </div>
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '0',
            flexShrink: 0,
            opacity: 0.7,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.7';
          }}
          aria-label="Dismiss error notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export const AudioErrorNotification = React.memo(AudioErrorNotificationComponent);
