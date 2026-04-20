import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoWhite from '../assets/logo-nobg-whitever.png';
import { updateProfile } from '../api/auth';

const DEPARTMENTS = [
  'College of Engineering and Architecture',
  'College of Management, Business and Accountancy',
  'College of Arts, Sciences and Education',
  'College of Nursing and Allied Health Sciences',
  'College of Computer Studies',
  'College of Criminal Justice',
];

export default function OrganizerProfile() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    department: user?.department || '',
    email: user?.email || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!form.firstName || !form.department) {
      setError('Organizational name and department are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await updateProfile({
        firstName: form.firstName,
        lastName: form.firstName,
        department: form.department,
      }, token);

      if (res.data.success) {
        const updatedUser = { ...user, ...res.data.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setSuccess('Profile saved successfully!');
        setEditing(false);
      } else {
        setError(res.data.message || 'Failed to save.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.page}>

      {/* Header */}
      <header style={styles.header}>
        <img src={logoWhite} alt="Logo" style={styles.logo} />
      </header>

      {/* Body */}
      <div style={styles.body}>

        {/* Back + Title */}
        <div style={styles.titleRow}>
          <button style={styles.backBtn} onClick={() => navigate('/dashboard/organizer')}>&#8249;</button>
          <h2 style={styles.pageTitle}>Profile</h2>
        </div>

        {/* Profile card */}
        <div style={styles.card}>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Organizational Name</label>
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              disabled={!editing}
              style={{ ...styles.input, ...(editing ? styles.inputActive : styles.inputDisabled) }}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Department</label>
            <select
              name="department"
              value={form.department}
              onChange={handleChange}
              disabled={!editing}
              style={{ ...styles.input, ...(editing ? styles.inputActive : styles.inputDisabled) }}
            >
              <option value="">Choose Department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email</label>
            <input
              name="email"
              value={form.email}
              disabled={true}
              style={{ ...styles.input, ...styles.inputDisabled }}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}
          {success && <p style={styles.successMsg}>{success}</p>}

          <div style={styles.bottomRow}>
            <button style={styles.changePassBtn}>Change Password</button>
            {!editing ? (
              <button style={styles.editBtn} onClick={() => setEditing(true)}>Edit</button>
            ) : (
              <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f5f0e8' },
  header: {
    backgroundColor: '#6b1a1a',
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 32px',
  },
  logo: { width: '60px', height: '60px', objectFit: 'contain' },
  body: { padding: '40px 48px' },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
  },
  backBtn: {
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
  pageTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#6b1a1a',
    fontFamily: 'Georgia, serif',
    margin: 0,
  },
  card: {
    backgroundColor: '#6b1a1a',
    borderRadius: '16px',
    padding: '36px 48px',
    maxWidth: '700px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: {
    color: '#f5f0e8',
    fontSize: '15px',
    fontFamily: 'Georgia, serif',
    marginTop: '8px',
  },
  input: {
    border: 'none',
    borderRadius: '8px',
    padding: '14px 16px',
    fontSize: '15px',
    fontFamily: 'Georgia, serif',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  inputActive: {
    backgroundColor: '#f5f0e8',
    color: '#3d2b2b',
  },
  inputDisabled: {
    backgroundColor: 'rgba(245, 240, 232, 0.15)',
    color: '#f5f0e8',
    cursor: 'not-allowed',
  },
  bottomRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
  },
  changePassBtn: {
    backgroundColor: 'transparent',
    color: '#f5f0e8',
    border: '1px solid #f5f0e8',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontFamily: 'Georgia, serif',
    cursor: 'pointer',
  },
  editBtn: {
    backgroundColor: '#f5f0e8',
    color: '#6b1a1a',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 28px',
    fontSize: '15px',
    fontFamily: 'Georgia, serif',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  saveBtn: {
    backgroundColor: '#a82020',
    color: '#f5f0e8',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 28px',
    fontSize: '15px',
    fontFamily: 'Georgia, serif',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  error: { color: '#ffcccc', fontSize: '13px', textAlign: 'center' },
  successMsg: { color: '#90ee90', fontSize: '13px', textAlign: 'center' },
};