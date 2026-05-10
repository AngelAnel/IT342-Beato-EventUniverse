import { useNavigate } from 'react-router-dom';
import logo from '../shared/assets/logo-nobg.png';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>

      {/* Logo top left */}
      <div style={styles.logoWrap}>
        <img src={logo} alt="Logo" style={styles.logo} />
      </div>

      {/* Main content */}
      <div style={styles.content}>

        {/* Title */}
        <h1 style={styles.title}>EVENT<br />UNIVERSE</h1>
        <p style={styles.tagline}>A wildcat experience</p>
        <p style={styles.description}>
          Event Universe is a web-based platform that streamlines event management
          for both organizers and participants. Organizers can create and manage events,
          while participants can easily browse, register, and track events in one centralized system.
        </p>

        {/* Cards row */}
        <div style={styles.cardsRow}>

          {/* Login card */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Login</h2>
            <button style={styles.cardBtn} onClick={() => navigate('/login/participant')}>
              Login as Participant
            </button>
            <button style={styles.cardBtn} onClick={() => navigate('/login/organizer')}>
              Login as Organizer
            </button>
          </div>

          {/* Register card */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Register</h2>
            <button style={styles.cardBtn} onClick={() => navigate('/register/participant')}>
              Register as Participant
            </button>
            <button style={styles.cardBtn} onClick={() => navigate('/register/organizer')}>
              Register as Organizer
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f5f0e8',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    padding: '40px 20px',
  },
  logoWrap: {
    position: 'absolute',
    top: '20px',
    left: '24px',
  },
  logo: {
    width: '52px',
    height: '52px',
    objectFit: 'contain',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '20px',
    width: '100%',
    maxWidth: '900px',
  },
  title: {
    fontSize: '80px',
    fontWeight: '900',
    color: '#6b1a1a',
    lineHeight: '1.0',
    fontFamily: 'Georgia, serif',
    letterSpacing: '4px',
    textAlign: 'center',
    margin: 0,
  },
  tagline: {
    marginTop: '12px',
    fontSize: '24px',
    color: '#8b6b4a',
    fontWeight: '600',
    fontFamily: 'Georgia, serif',
  },
  description: {
    marginTop: '20px',
    fontSize: '16px',
    color: '#6b1a1a',
    fontFamily: 'Georgia, serif',
    textAlign: 'center',
    maxWidth: '680px',
    lineHeight: '1.7',
  },
  cardsRow: {
    display: 'flex',
    gap: '40px',
    marginTop: '40px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#6b1a1a',
    borderRadius: '16px',
    padding: '40px 48px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    minWidth: '260px',
  },
  cardTitle: {
    color: '#f5f0e8',
    fontSize: '32px',
    fontWeight: 'bold',
    fontFamily: 'Georgia, serif',
    margin: 0,
  },
  cardBtn: {
    backgroundColor: '#f5f0e8',
    color: '#6b1a1a',
    border: 'none',
    borderRadius: '8px',
    padding: '14px 28px',
    fontSize: '15px',
    fontFamily: 'Georgia, serif',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
    transition: 'opacity 0.2s',
  },
};