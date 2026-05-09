import { useNavigate } from 'react-router-dom';
import logoWhite from '../assets/logo-nobg-whitever.png';
import { useState, useEffect, useRef } from 'react';
import { getNotifications, markNotificationsRead } from '../api/auth';

export default function Navbar({ onSearch, onNotificationClick }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  const [query, setQuery] = useState('');
  const [showPanel, setShowPanel] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  const displayName = user?.role === 'Organization'
    ? user?.firstName
    : `${user?.firstName} ${user?.lastName}`;

  useEffect(() => {
  if (token) {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications(token);
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const handleBellClick = async () => {
    setShowNotifications(!showNotifications);
    setShowPanel(false);
    if (!showNotifications && unreadCount > 0) {
      try {
        await markNotificationsRead(token);
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch (err) {
        console.error('Failed to mark notifications as read', err);
      }
    }
  };

  const handleSearch = () => {
    if (onSearch) onSearch(query);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleLogoClick = () => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));
    if (token && userData) {
      if (userData.role === 'Participant') {
        navigate('/dashboard/participant');
      } else {
        navigate('/dashboard/organizer');
      }
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  return (
    <>
      <header style={styles.header}>
        <div style={styles.logoWrap} onClick={handleLogoClick}>
          <img src={logoWhite} alt="Event Universe" style={styles.logo} />
        </div>

        <div style={styles.searchWrap}>
          <input
              type="text"
              placeholder="Search event..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (onSearch) onSearch(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              style={styles.searchInput}
            />
          <button onClick={handleSearch} style={styles.searchBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>

        <div style={styles.rightWrap}>

          {/* Bell button */}
          <div style={{ position: 'relative' }} ref={notifRef}>
            <button style={styles.bellBtn} onClick={handleBellClick}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f5f0e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span style={styles.notifBadge}>{unreadCount}</span>
              )}
            </button>

            {/* Notification dropdown */}
            {showNotifications && (
              <div style={styles.notifDropdown}>
                <div style={styles.notifArrow} />
                <p style={styles.notifHeader}>Notifications</p>
                {notifications.length === 0 ? (
                  <p style={styles.notifEmpty}>No notifications yet</p>
                ) : (
                  notifications.map((notif, index) => (
                      <div key={index} style={{
                        ...styles.notifItem,
                        backgroundColor: notif.read ? '#fff' : '#fef9e7',
                        cursor: notif.eventId ? 'pointer' : 'default',
                      }}
                        onClick={() => {
                          if (!notif.eventId) return;
                          setShowNotifications(false);
                          if (onNotificationClick) onNotificationClick(notif);
                        }}
                      >
                        <div style={styles.notifItemTop}>
                          <span style={styles.notifTitle}>{notif.title}</span>
                          <span style={styles.notifTime}>{formatTimeAgo(notif.createdAt)}</span>
                        </div>
                        <p style={styles.notifMessage}>{notif.message}</p>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>

          {/* Name button */}
          <div style={styles.nameWrap}>
            <span style={styles.userName} onClick={() => { setShowPanel(!showPanel); setShowNotifications(false); }}>
              {displayName}
            </span>

            {showPanel && (
              <div style={styles.dropdownPanel}>
                <div style={styles.dropdownArrow} />
                <button
                  style={styles.panelBtn}
                  onClick={() => {
                    setShowPanel(false);
                    navigate(user?.role === 'Participant' ? '/profile/participant' : '/profile/organizer');
                  }}
                >
                  Profile
                </button>
                <button
                  style={styles.panelBtnLogout}
                  onClick={() => {
                    setShowPanel(false);
                    setShowLogoutConfirm(true);
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>You are about to log out</h2>
            <button style={styles.modalBtnLogout} onClick={handleLogout}>Logout</button>
            <button style={styles.modalBtnCancel} onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  header: {
    backgroundColor: '#6b1a1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    height: '80px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logoWrap: { cursor: 'pointer', display: 'flex', alignItems: 'center' },
  logo: { width: '60px', height: '60px', objectFit: 'contain' },
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f5f0e8',
    borderRadius: '25px',
    overflow: 'hidden',
    width: '380px',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    padding: '12px 16px',
    fontSize: '15px',
    color: '#3d2b2b',
    fontFamily: 'Georgia, serif',
  },
  searchBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px 14px',
    display: 'flex',
    alignItems: 'center',
  },
  rightWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  bellBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
    position: 'relative',
  },
  nameWrap: {
    position: 'relative',
  },
  userName: {
    color: '#f5f0e8',
    fontSize: '15px',
    fontFamily: 'Georgia, serif',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  dropdownPanel: {
  position: 'absolute',
  top: '48px',
  right: 0,
  backgroundColor: '#fff',
  border: '2px solid #6b1a1a',
  borderRadius: '12px',
  boxShadow: '0 8px 24px rgba(107, 26, 26, 0.25)',
  zIndex: 200,
  minWidth: '200px',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  padding: '12px',
  gap: '10px',
},
  dropdownArrow: {
    position: 'absolute',
    top: '-8px',
    right: '16px',
    width: 0,
    height: 0,
    borderLeft: '8px solid transparent',
    borderRight: '8px solid transparent',
    borderBottom: '8px solid #fff',
  },
  panelBtn: {
  backgroundColor: '#6b1a1a',
  color: '#f5f0e8',
  border: 'none',
  borderRadius: '8px',
  padding: '14px 20px',
  fontSize: '16px',
  fontFamily: 'Georgia, serif',
  cursor: 'pointer',
  textAlign: 'center',
  fontWeight: 'bold',
},
panelBtnLogout: {
  backgroundColor: '#6b1a1a',
  color: '#f5f0e8',
  border: 'none',
  borderRadius: '8px',
  padding: '14px 20px',
  fontSize: '16px',
  fontFamily: 'Georgia, serif',
  cursor: 'pointer',
  textAlign: 'center',
  fontWeight: 'bold',
},
  // Blurred overlay
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(4px)',
    zIndex: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: '#6b1a1a',
    borderRadius: '16px',
    padding: '48px 64px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    minWidth: '400px',
  },
  modalTitle: {
    color: '#f5f0e8',
    fontSize: '24px',
    fontWeight: 'bold',
    fontFamily: 'Georgia, serif',
    margin: 0,
    textAlign: 'center',
  },
  modalBtnLogout: {
    backgroundColor: '#f5f0e8',
    color: '#6b1a1a',
    border: 'none',
    borderRadius: '8px',
    padding: '14px',
    fontSize: '18px',
    fontWeight: 'bold',
    fontFamily: 'Georgia, serif',
    cursor: 'pointer',
    width: '100%',
  },
  modalBtnCancel: {
    backgroundColor: '#f5f0e8',
    color: '#6b1a1a',
    border: 'none',
    borderRadius: '8px',
    padding: '14px',
    fontSize: '18px',
    fontWeight: 'bold',
    fontFamily: 'Georgia, serif',
    cursor: 'pointer',
    width: '100%',
  },
  notifBadge: {
  position: 'absolute',
  bottom: '-2px',
  right: '-2px',
  backgroundColor: '#e74c3c',
  color: '#fff',
  borderRadius: '50%',
  width: '18px',
  height: '18px',
  fontSize: '11px',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'Georgia, serif',
},
notifDropdown: {
  position: 'absolute',
  top: '48px',
  right: 0,
  backgroundColor: '#fff',
  border: '2px solid #6b1a1a',
  borderRadius: '12px',
  boxShadow: '0 8px 24px rgba(107,26,26,0.25)',
  zIndex: 200,
  width: '320px',
  maxHeight: '400px',
  overflowY: 'auto',
},
notifArrow: {
  position: 'absolute',
  top: '-8px',
  right: '16px',
  width: 0,
  height: 0,
  borderLeft: '8px solid transparent',
  borderRight: '8px solid transparent',
  borderBottom: '8px solid #fff',
},
notifHeader: {
  color: '#6b1a1a',
  fontWeight: 'bold',
  fontSize: '15px',
  fontFamily: 'Georgia, serif',
  padding: '12px 16px 8px 16px',
  margin: 0,
  borderBottom: '1px solid #f5f0e8',
},
notifEmpty: {
  color: '#b0a090',
  fontSize: '13px',
  fontFamily: 'Georgia, serif',
  padding: '16px',
  textAlign: 'center',
  margin: 0,
},
notifItem: {
  padding: '12px 16px',
  borderBottom: '1px solid #f5f0e8',
  cursor: 'default',
},
notifItemTop: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '4px',
},
notifTitle: {
  color: '#6b1a1a',
  fontWeight: 'bold',
  fontSize: '13px',
  fontFamily: 'Georgia, serif',
},
notifTime: {
  color: '#b0a090',
  fontSize: '11px',
  fontFamily: 'Georgia, serif',
},
notifMessage: {
  color: '#3d2b2b',
  fontSize: '12px',
  fontFamily: 'Georgia, serif',
  margin: 0,
},
};