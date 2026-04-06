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

export default function Register() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Participant');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [participantForm, setParticipantForm] = useState({
    firstName: '', lastName: '', email: '',
    password: '', confirmPassword: '', department: '',
  });

  const [organizerForm, setOrganizerForm] = useState({
    firstName: '', email: '',
    password: '', confirmPassword: '', department: '',
  });

  const handleParticipantChange = (e) => {
    setParticipantForm({ ...participantForm, [e.target.name]: e.target.value });
    setError('');
  };

  const handleOrganizerChange = (e) => {
    setOrganizerForm({ ...organizerForm, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    let payload = {};

    if (activeTab === 'Participant') {
      const { firstName, lastName, email, password, confirmPassword, department } = participantForm;
      if (!firstName || !lastName || !email || !password || !confirmPassword || !department) {
        setError('All fields are required.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
      payload = { firstName, lastName, email, password, confirmPassword, department, role: 'Participant' };
    } else {
      const { firstName, email, password, confirmPassword, department } = organizerForm;
      if (!firstName || !email || !password || !confirmPassword || !department) {
        setError('All fields are required.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
      payload = {
        firstName,
        lastName: firstName,
        email, password, confirmPassword, department,
        role: 'Organization'
      };
    }

    setLoading(true);
    try {
      const res = await registerUser(payload);
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

      {}
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

      {}
      <div style={styles.container}>

        {}
        <h1 style={styles.pageTitle}>CREATE AN ACCOUNT</h1>

        {/* Tab buttons ABOVE the card */}
        <div style={styles.tabRow}>
          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'Participant' ? styles.tabBtnActive : styles.tabBtnInactive) }}
            onClick={() => { setActiveTab('Participant'); setError(''); }}>
            Participant
          </button>
          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'Organizer' ? styles.tabBtnActive : styles.tabBtnInactive) }}
            onClick={() => { setActiveTab('Organizer'); setError(''); }}>
            Organizer
          </button>
        </div>

        {/* Card */}
        <div style={styles.card}>

          {/* Form title inside card */}
          <h2 style={styles.cardTitle}>
            {activeTab === 'Participant' ? 'Register as Participant' : 'Register as Organizer'}
          </h2>

          <form onSubmit={handleSubmit} style={styles.form}>

            {/* ── PARTICIPANT FORM ── */}
            {activeTab === 'Participant' && (
              <>
                <div style={styles.row}>
                  <div style={styles.half}>
                    <label style={styles.label}>First Name</label>
                    <input
                      name="firstName"
                      value={participantForm.firstName}
                      onChange={handleParticipantChange}
                      style={styles.input} />
                  </div>
                  <div style={styles.half}>
                    <label style={styles.label}>Last Name</label>
                    <input
                      name="lastName"
                      value={participantForm.lastName}
                      onChange={handleParticipantChange}
                      style={styles.input} />
                  </div>
                </div>

                <label style={styles.label}>Institutional Email</label>
                <input
                  name="email"
                  type="email"
                  value={participantForm.email}
                  onChange={handleParticipantChange}
                  style={styles.input} />

                <div style={styles.row}>
                  <div style={styles.half}>
                    <label style={styles.label}>Password</label>
                    <input
                      name="password"
                      type="password"
                      value={participantForm.password}
                      onChange={handleParticipantChange}
                      style={styles.input} />
                  </div>
                  <div style={styles.half}>
                    <label style={styles.label}>Confirm Password</label>
                    <input
                      name="confirmPassword"
                      type="password"
                      value={participantForm.confirmPassword}
                      onChange={handleParticipantChange}
                      style={styles.input} />
                  </div>
                </div>

                <label style={styles.label}>Choose Department</label>
                <select
                  name="department"
                  value={participantForm.department}
                  onChange={handleParticipantChange}
                  style={styles.select}>
                  <option value="">Choose Department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </>
            )}

            {/* ── ORGANIZER FORM ── */}
            {activeTab === 'Organizer' && (
              <>
                <label style={styles.label}>Organizational Name</label>
                <input
                  name="firstName"
                  value={organizerForm.firstName}
                  onChange={handleOrganizerChange}
                  style={styles.input} />

                <label style={styles.label}>Institutional Email</label>
                <input
                  name="email"
                  type="email"
                  value={organizerForm.email}
                  onChange={handleOrganizerChange}
                  style={styles.input} />

                <div style={styles.row}>
                  <div style={styles.half}>
                    <label style={styles.label}>Password</label>
                    <input
                      name="password"
                      type="password"
                      value={organizerForm.password}
                      onChange={handleOrganizerChange}
                      style={styles.input} />
                  </div>
                  <div style={styles.half}>
                    <label style={styles.label}>Confirm Password</label>
                    <input
                      name="confirmPassword"
                      type="password"
                      value={organizerForm.confirmPassword}
                      onChange={handleOrganizerChange}
                      style={styles.input} />
                  </div>
                </div>

                <label style={styles.label}>Choose Department</label>
                <select
                  name="department"
                  value={organizerForm.department}
                  onChange={handleOrganizerChange}
                  style={styles.select}>
                  <option value="">Choose Department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </>
            )}

            {error && <p style={styles.error}>{error}</p>}

            <button type="submit" style={styles.btn} disabled={loading}>
              {loading ? 'registering...' : 'register'}
            </button>

          </form>
        </div>

        {/* Login link below card */}
        <p style={styles.loginLink}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>Login here</Link>
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
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '680px',
    maxWidth: '95vw',
  },
  pageTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#6b1a1a',
    fontFamily: 'Georgia, serif',
    letterSpacing: '2px',
    marginBottom: '20px',
  },
  tabRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '0px',
  },
  tabBtn: {
    padding: '10px 28px',
    borderRadius: '20px',
    fontSize: '15px',
    fontFamily: 'Georgia, serif',
    cursor: 'pointer',
    border: '2px solid #6b1a1a',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    marginBottom: '24px',
  },

  tabBtnActive: {
    backgroundColor: '#6b1a1a',
    color: '#f5f0e8',
    boxShadow: '0 4px 0 #3d0f0f',
    transform: 'translateY(-2px)',
  },
  tabBtnInactive: {
    backgroundColor: '#f5f0e8',
    color: '#6b1a1a',
  },
  card: {
    backgroundColor: '#6b1a1a',
    borderRadius: '0 16px 16px 16px',
    padding: '36px 48px',
    width: '100%',
  },
  cardTitle: {
    color: '#f5f0e8',
    fontSize: '22px',
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
    cursor: 'pointer',
    appearance: 'auto',
    boxSizing: 'border-box',
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
  loginLink: {
    marginTop: '16px',
    fontSize: '13px',
    color: '#8b6b4a',
    alignSelf: 'center',
  },
  link: {
    color: '#6b1a1a',
    textDecoration: 'underline',
    fontWeight: 'bold',
  },
};