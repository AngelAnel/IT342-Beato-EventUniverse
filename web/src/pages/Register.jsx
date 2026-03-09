import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const ROLES = ['Participant', 'Organization'];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    password: '', confirmPassword: '', department: '', role: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const { firstName, lastName, email, password, confirmPassword, department, role } = form;
    if (!firstName || !lastName || !email || !password || !confirmPassword || !department || !role) {
      setError('All fields are required. Please fill in every field.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser(form);
      if (res.data.success) {
        navigate('/login');
      } else {
        setError(res.data.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Logo */}
      <div style={styles.logoWrap} onClick={() => navigate('/login')} role="button">
        <img src={logo} alt="Logo" style={styles.logo} />
      </div>

      {/* Card */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Register</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Row: First + Last */}
          <div style={styles.row}>
            <div style={styles.half}>
              <label style={styles.label}>First Name</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} style={styles.input} />
            </div>
            <div style={styles.half}>
              <label style={styles.label}>Last Name</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} style={styles.input} />
            </div>
          </div>

          <label style={styles.label}>Institutional Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} style={styles.input} />

          {/* Row: Password + Confirm */}
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

          <label style={styles.label}>Role</label>
          <select name="role" value={form.role} onChange={handleChange} style={{ ...styles.select, width: '50%' }}>
            <option value="">Choose Role</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'registering...' : 'register'}
          </button>
        </form>
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
    padding: '40px 20px',
  },
  logoWrap: {
    position: 'absolute',
    top: '20px',
    left: '24px',
    cursor: 'pointer',
  },
  logo: {
    width: '52px',
    height: '52px',
    objectFit: 'contain',
  },
  card: {
    backgroundColor: '#6b1a1a',
    borderRadius: '16px',
    padding: '40px 48px',
    width: '680px',
    maxWidth: '95vw',
  },
  cardTitle: {
    color: '#f5f0e8',
    fontSize: '36px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '24px',
    fontFamily: 'Georgia, serif',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  row: {
    display: 'flex',
    gap: '16px',
  },
  half: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
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
    padding: '12px',
    fontSize: '15px',
    outline: 'none',
    width: '100%',
  },
  select: {
    backgroundColor: '#f5f0e8',
    border: 'none',
    borderRadius: '6px',
    padding: '12px',
    fontSize: '15px',
    outline: 'none',
    width: '100%',
    cursor: 'pointer',
    appearance: 'auto',
  },
  error: {
    color: '#ffcccc',
    fontSize: '13px',
    marginTop: '10px',
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
    width: '40%',
    alignSelf: 'center',
    fontFamily: 'Georgia, serif',
  },
};