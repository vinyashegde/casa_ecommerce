// Toast utility using react-hot-toast for beautiful notifications
import toast from 'react-hot-toast';

export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  const toastOptions = {
    duration: 3000,
    position: 'top-center' as const,
    style: {
      background: type === 'success' ? '#10B981' : 
                 type === 'error' ? '#EF4444' : 
                 '#3B82F6',
      color: 'white',
      fontWeight: '500',
      borderRadius: '8px',
      padding: '12px 16px',
    },
  };

  switch (type) {
    case 'success':
      toast.success(message, toastOptions);
      break;
    case 'error':
      toast.error(message, toastOptions);
      break;
    case 'info':
      toast(message, toastOptions);
      break;
    default:
      toast(message, toastOptions);
  }
};

export const showSuccessToast = (message: string) => showToast(message, 'success');
export const showErrorToast = (message: string) => showToast(message, 'error');
export const showInfoToast = (message: string) => showToast(message, 'info');
