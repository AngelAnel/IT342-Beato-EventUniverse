import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import logoWhite from '../assets/logo-nobg-whitever.png';

export default function Navbar({ onSearch }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [query, setQuery] = useState('');

  const displayName = user?.role === 'Organization'
    ? user?.firstName
    : `${user?.firstName} ${user?.lastName}`;

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
      navigate('/login');
    }
  };

  return (
    <header style={styles.header}>
      <div style={styles.logoWrap} onClick={handleLogoClick}>
        <img src={logoWhite} alt="Event Universe" style={styles.logo} />
      </div>

      <div style={styles.searchWrap}>
        <input
          type="text"
          placeholder="Search event..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
        <button style={styles.bellBtn} title="Notifications">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f5f0e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
        <span style={styles.userName}>{displayName}</span>
      </div>
    </header>
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
  rightWrap: { display: 'flex', alignItems: 'center', gap: '12px' },
  bellBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
  },
  userName: {
    color: '#f5f0e8',
    fontSize: '15px',
    fontFamily: 'Georgia, serif',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};