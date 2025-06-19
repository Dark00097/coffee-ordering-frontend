import { useState, useEffect, useRef } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Divider,
  CircularProgress,
  Button,
} from '@mui/material';
import { Notifications as NotificationsIcon, Receipt, TableBar, CheckCircle } from '@mui/icons-material';
import { api } from '../services/api';
import { toast } from 'react-toastify';

const notificationStyles = {
  notificationList: {
    width: '360px',
    maxHeight: '400px',
    overflowY: 'auto',
    padding: 0,
  },
  notificationItem: {
    padding: '12px 16px',
    borderBottom: '1px solid #f3f4f6',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-out',
    '&:hover': {
      backgroundColor: '#f9fafb',
    },
  },
  unread: {
    backgroundColor: '#eff6ff',
    fontWeight: '500',
  },
  read: {
    backgroundColor: '#ffffff',
    color: '#6b7280',
  },
  icon: {
    fontSize: 20,
    color: '#6b7280',
  },
  timestamp: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '4px',
  },
  emptyMessage: {
    padding: '16px',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '14px',
  },
  bellButton: {
    padding: '8px',
  },
  popover: {
    marginTop: '8px',
  },
  header: {
    padding: '12px 16px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
  },
  clearButton: {
    padding: '6px 12px',
    fontSize: '13px',
    textTransform: 'none',
    color: '#2563eb',
    '&:hover': {
      backgroundColor: '#eff6ff',
    },
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '16px',
  },
};

function NotificationBell({ user, navigate, notifications, handleNewNotification }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);
  const hasInteracted = useRef(false);

  useEffect(() => {
    const audioPath = '/assets/notification.mp3';
    audioRef.current = new Audio(audioPath);
    audioRef.current.preload = 'auto';

    fetch(audioPath, { method: 'HEAD' })
      .then((response) => {
        if (!response.ok) {
          console.error(`Audio file not found at ${audioPath}`);
          toast.error('Notification sound file is missing. Please check the audio file path.');
        } else {
          console.log(`Audio file confirmed at ${audioPath}`);
        }
      })
      .catch((err) => {
        console.error('Error checking audio file:', err);
        toast.error('Failed to load notification sound file.');
      });

    const handleInteraction = () => {
      hasInteracted.current = true;
      console.log('User interaction detected, audio playback enabled');
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  useEffect(() => {
    if (notifications.length > 0 && !notifications[0].is_read && hasInteracted.current) {
      console.log('New unread notification received:', notifications[0]);
      const playSound = async () => {
        try {
          await audioRef.current.play();
          console.log('Notification sound played successfully');
        } catch (err) {
          console.error('Audio play error:', err);
          toast.warn('Notification sound blocked by browser. Please interact with the page to enable sounds.');
        }
      };
      playSound();
    } else {
      console.log('No sound played: ', {
        hasNotifications: notifications.length > 0,
        isUnread: notifications.length > 0 && !notifications[0].is_read,
        hasInteracted: hasInteracted.current,
      });
    }
  }, [notifications]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    hasInteracted.current = true;
    console.log('Notification bell clicked, hasInteracted set to true');
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.is_read) {
        await api.markNotificationRead(notification.id);
        handleNewNotification({ ...notification, is_read: 1 });
      }
      handleClose();
      if (notification.type === 'order' && notification.reference_id) {
        navigate(`/staff?expandOrder=${notification.reference_id}&scrollTo=${notification.reference_id}`);
      } else if (notification.type === 'order') {
        console.warn('Invalid order notification: missing reference_id', notification);
        toast.error('Cannot navigate to order: invalid order ID');
        navigate('/staff');
      } else if (notification.type === 'reservation') {
        navigate(`/reservation/${notification.reference_id}`);
      }
    } catch (err) {
      console.error('Error processing notification:', err);
      toast.error('Failed to process notification');
    }
  };

  const handleClearNotifications = async () => {
    try {
      setIsLoading(true);
      const unreadNotifications = notifications.filter((n) => !n.is_read);
      for (const notification of unreadNotifications) {
        await api.markNotificationRead(notification.id);
        handleNewNotification({ ...notification, is_read: 1 });
      }
    } catch (err) {
      console.error('Error clearing notifications:', err);
      toast.error('Failed to clear notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const open = Boolean(anchorEl);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <IconButton onClick={handleClick} sx={notificationStyles.bellButton}>
        <Badge badgeContent={unreadCount} color="primary">
          <NotificationsIcon sx={{ color: '#374151' }} />
        </Badge>
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={notificationStyles.popover}
      >
        <Box sx={notificationStyles.header}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography sx={notificationStyles.title}>Notifications</Typography>
            {notifications.length > 0 && (
              <Button
                onClick={handleClearNotifications}
                sx={notificationStyles.clearButton}
                disabled={isLoading}
              >
                Clear All
              </Button>
            )}
          </Box>
        </Box>
        {isLoading ? (
          <Box sx={notificationStyles.loadingContainer}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Typography sx={notificationStyles.emptyMessage}>
            No notifications yet
          </Typography>
        ) : (
          <List sx={notificationStyles.notificationList}>
            {notifications.map((notification) => {
              const isUnread = !notification.is_read;
              return (
                <ListItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    ...notificationStyles.notificationItem,
                    ...(isUnread ? notificationStyles.unread : notificationStyles.read),
                  }}
                >
                  <ListItemIcon>
                    {notification.type === 'order' ? (
                      <Receipt sx={notificationStyles.icon} />
                    ) : (
                      <TableBar sx={notificationStyles.icon} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={notification.message}
                    secondary={
                      <Typography sx={notificationStyles.timestamp}>
                        {new Date(notification.created_at).toLocaleString()}
                      </Typography>
                    }
                  />
                  {isUnread && <CheckCircle sx={{ color: '#2563eb', fontSize: 16 }} />}
                </ListItem>
              );
            })}
          </List>
        )}
      </Popover>
    </>
  );
}

export default NotificationBell;