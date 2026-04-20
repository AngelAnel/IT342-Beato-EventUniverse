import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../api/auth';
import logo from '../assets/logo-nobg.png';

const DEPARTMENTS = [
  'College of Engineering and Architecture',
  'College of Management, Business and Accountancy',
  'College of Arts, Sciences and Education',
  'College of Nursing and Allied Health Sciences',
  'College of Computer Studies',
  'College of Criminal Justice',
];

export default function RegisterOrganizer() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '', email: '',
    password: '', confirmPassword: '', department: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { firstName, email, password, confirmPassword, department } = form;
    if (!firstName || !email || !password || !confirmPassword || !department) {
      setError('All fields are required.'); return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.'); return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.'); return;
    }
    setLoading(true);
    try {
      const res = await registerUser({
        firstName,
        lastName: firstName,
        email, password, confirmPassword, department,
        role: 'Organization',
      });
      if (res.data.success) {
        navigate('/login/organizer');
      } else {
        setError(res.data.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>

      <div style={styles.logoWrap}>
        <img src={logo} alt="Logo" style={styles.logo} />
      </div>

      <div style={styles.wrapper}>
        <button style={styles.backBtn} onClick={() => navigate('/')}>&#8249;</button>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Register as Organizer</h2>

          <form onSubmit={handleSubmit} style={styles.form}>

            <label style={styles.label}>Organizational Name</label>
            <input name="firstName" value={form.firstName} onChange={handleChange} style={styles.input} />

            <label style={styles.label}>Institutional Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} style={styles.input} />

            <div style={styles.row}>
              <div style={styles.half}>
                <label style={styles.label}>Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} style={styles.input} />
              </div>
              <div style={styles.half}>
                <label style={styles.label}>Confirm Password</label>
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} style={styles.input} />
              </div>
            </div>

            <label style={styles.label}>Department</label>
            <select name="department" value={form.department} onChange={handleChange} style={styles.select}>
              <option value="">Choose Department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            {error && <p style={styles.error}>{error}</p>}

            <button type="submit" style={styles.btn} disabled={loading}>
              {loading ? 'registering...' : 'register'}
            </button>

          </form>
        </div>

        <p style={styles.loginLink}>
          Already have an account?{' '}
          <Link to="/login/organizer" style={styles.link}>Login here</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f5f0e8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: '40px 20px',
  },
  logoWrap: { position: 'absolute', top: '20px', left: '24px' },
  logo: { width: '52px', height: '52px', objectFit: 'contain' },
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    width: '620px',
    maxWidth: '95vw',
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
  },
  card: {
    backgroundColor: '#6b1a1a',
    borderRadius: '16px',
    padding: '36px 48px',
    width: '100%',
  },
  cardTitle: {
    color: '#f5f0e8',
    fontSize: '26px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '24px',
    fontFamily: 'Georgia, serif',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '6px' },
  row: { display: 'flex', gap: '16px' },
  half: { flex: 1, display: 'flex', flexDirection: 'column' },
  label: {
    color: '#f5f0e8',
    fontWeight: 'bold',
    fontSize: '14px',
    marginTop: '10px',
    marginBottom: '4px',
  },
  input: {
    backgroundColor: '#f5f0e8',
    border: 'none',
    borderRadius: '6px',
    padding: '12px',
    fontSize: '15px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  select: {
    backgroundColor: '#f5f0e8',
    border: 'none',
    borderRadius: '6px',
    padding: '12px',
    fontSize: '15px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    cursor: 'pointer',
  },
  error: { color: '#ffcccc', fontSize: '13px', marginTop: '10px', textAlign: 'center' },
  btn: {
    marginTop: '24px',
    backgroundColor: '#a82020',
    color: '#f5f0e8',
    border: 'none',
    borderRadius: '8px',
    padding: '14px',
    fontSize: '16px',
    cursor: 'pointer',
    width: '40%',
    alignSelf: 'center',
    fontFamily: 'Georgia, serif',
  },
  loginLink: { marginTop: '16px', fontSize: '13px', color: '#8b6b4a' },
  link: { color: '#6b1a1a', textDecoration: 'underline', fontWeight: 'bold' },
};