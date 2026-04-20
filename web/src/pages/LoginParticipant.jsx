import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../api/auth';
import logo from '../assets/logo-nobg.png';

export default function LoginParticipant() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await loginUser(form);
      if (res.data.success) {
        localStorage.setItem('token', res.data.data.accessToken);
        localStorage.setItem('user', JSON.stringify(res.data.data.user));
        const role = res.data.data.user.role;
        if (role !== 'Participant') {
          setError('This account is not a participant account.');
          localStorage.clear();
          return;
        }
        navigate('/dashboard/participant');
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  };

  return (
    <div style={styles.page}>

      {/* Logo top left */}
      <div style={styles.logoWrap}>
        <img src={logo} alt="Logo" style={styles.logo} />
      </div>

      {/* Left branding */}
      <div style={styles.branding}>
        <h1 style={styles.brandTitle}>EVENT<br />UNIVERSE</h1>
        <p style={styles.brandSub}>A wildcat experience</p>
      </div>

      {/* Right side */}
      <div style={styles.rightSide}>

        {/* Back button */}
        <button style={styles.backBtn} onClick={() => navigate('/')}>&#8249;</button>

        {/* Login card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Login</h2>

          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              style={styles.input}
            />

            <label style={styles.label}>Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              style={styles.input}
            />

            {error && <p style={styles.error}>{error}</p>}

            <button type="submit" style={styles.btn} disabled={loading}>
              {loading ? 'logging in...' : 'login'}
            </button>
          </form>

          {/* Divider */}
          <div style={styles.dividerRow}>
            <div style={styles.dividerLine} />
          </div>

          {/* Google login */}
          <div style={styles.googleRow}>
            <span style={styles.loginWithText}>Login with:</span>
            <button onClick={handleGoogleLogin} style={styles.googleBtn} title="Login with Google">
              <svg width="28" height="28" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Register link */}
        <p style={styles.registerLink}>
          Still don't have an account?{' '}
          <Link to="/register/participant" style={styles.link}>Register here</Link>
        </p>

      </div>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f0e8',
    position: 'relative',
    padding: '20px',
    gap: '80px',
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
  branding: {
    textAlign: 'center',
  },
  brandTitle: {
    fontSize: '72px',
    fontWeight: '900',
    color: '#6b1a1a',
    lineHeight: '1.0',
    fontFamily: 'Georgia, serif',
    letterSpacing: '4px',
  },
  brandSub: {
    marginTop: '12px',
    fontSize: '22px',
    color: '#8b6b4a',
    fontWeight: '600',
    fontFamily: 'Georgia, serif',
  },
  rightSide: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: '-48px',
    top: '12px',
    backgroundColor: '#6b1a1a',
    color: '#f5f0e8',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    fontSize: '22px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Georgia, serif',
  },
  card: {
    backgroundColor: '#6b1a1a',
    borderRadius: '16px',
    padding: '48px 40px 32px',
    width: '420px',
    display: 'flex',
    flexDirection: 'column',
  },
  cardTitle: {
    color: '#f5f0e8',
    fontSize: '36px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '28px',
    fontFamily: 'Georgia, serif',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    color: '#f5f0e8',
    fontWeight: 'bold',
    fontSize: '15px',
    marginTop: '12px',
    marginBottom: '4px',
  },
  input: {
    backgroundColor: '#f5f0e8',
    border: 'none',
    borderRadius: '6px',
    padding: '14px 12px',
    fontSize: '15px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  error: {
    color: '#ffcccc',
    fontSize: '13px',
    marginTop: '8px',
    textAlign: 'center',
  },
  btn: {
    marginTop: '24px',
    backgroundColor: '#a82020',
    color: '#f5f0e8',
    border: 'none',
    borderRadius: '8px',
    padding: '14px',
    fontSize: '16px',
    cursor: 'pointer',
    width: '60%',
    alignSelf: 'center',
    fontFamily: 'Georgia, serif',
  },
  dividerRow: {
    display: 'flex',
    alignItems: 'center',
    margin: '20px 0 12px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: 'rgba(245, 240, 232, 0.3)',
  },
  googleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  loginWithText: {
    color: '#f5f0e8',
    fontSize: '14px',
    fontFamily: 'Georgia, serif',
  },
  googleBtn: {
    background: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: '6px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
  },
  registerLink: {
    marginTop: '16px',
    textAlign: 'center',
    color: '#8b6b4a',
    fontSize: '13px',
  },
  link: {
    color: '#6b1a1a',
    textDecoration: 'underline',
    fontWeight: 'bold',
  },
};