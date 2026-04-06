import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../api/auth';
import logo from '../assets/logo-nobg.png';

export default function Login() {
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
        if (role === 'Participant') {
          navigate('/dashboard/participant');
        } else {
          navigate('/dashboard/organizer');
        }
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.logoWrap} onClick={() => {
              const token = localStorage.getItem('token');
              const user = JSON.parse(localStorage.getItem('user'));
              if (token && user) {
                navigate(user.role === 'Participant' ? '/dashboard/participant' : '/dashboard/organizer');
              } else {
                navigate('/login');
              }
            }} role="button">
        <img src={logo} alt="Logo" style={styles.logo} />
      </div>
      <div style={styles.branding}>
        <h1 style={styles.brandTitle}>EVENT<br />UNIVERSE</h1>
        <p style={styles.brandSub}>A wildcat experience</p>
      </div>
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Login</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} style={styles.input} />
          <label style={styles.label}>Password</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} style={styles.input} />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'logging in...' : 'login'}
          </button>
        </form>
        <p style={styles.registerLink}>
          Still don't have an account?{' '}
          <Link to="/register" style={styles.link}>Register here</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f5f0e8', position: 'relative', padding: '20px', gap: '80px' },
  logoWrap: { position: 'absolute', top: '20px', left: '24px', cursor: 'pointer' },
  logo: { width: '52px', height: '52px', objectFit: 'contain' },
  branding: { textAlign: 'center' },
  brandTitle: { fontSize: '72px', fontWeight: '900', color: '#6b1a1a', lineHeight: '1.0', fontFamily: 'Georgia, serif', letterSpacing: '4px' },
  brandSub: { marginTop: '12px', fontSize: '22px', color: '#8b6b4a', fontWeight: '600', fontFamily: 'Georgia, serif' },
  card: { backgroundColor: '#6b1a1a', borderRadius: '16px', padding: '48px 40px 32px', width: '400px', display: 'flex', flexDirection: 'column' },
  cardTitle: { color: '#f5f0e8', fontSize: '36px', fontWeight: 'bold', textAlign: 'center', marginBottom: '28px', fontFamily: 'Georgia, serif' },
  form: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { color: '#f5f0e8', fontWeight: 'bold', fontSize: '15px', marginTop: '12px', marginBottom: '4px' },
  input: { backgroundColor: '#f5f0e8', border: 'none', borderRadius: '6px', padding: '14px 12px', fontSize: '15px', outline: 'none', width: '100%' },
  error: { color: '#ffcccc', fontSize: '13px', marginTop: '8px', textAlign: 'center' },
  btn: { marginTop: '24px', backgroundColor: '#a82020', color: '#f5f0e8', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '16px', cursor: 'pointer', width: '60%', alignSelf: 'center', fontFamily: 'Georgia, serif' },
  registerLink: { marginTop: '20px', textAlign: 'center', color: '#c9b89a', fontSize: '13px' },
  link: { color: '#f5f0e8', textDecoration: 'underline' },
};