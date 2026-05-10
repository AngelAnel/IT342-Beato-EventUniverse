import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoWhite from '../shared/assets/logo-nobg-whitever.png';
import { updateProfile, changePassword } from '../auth/auth';

const DEPARTMENTS = [
  'College of Engineering and Architecture',
  'College of Management, Business and Accountancy',
  'College of Arts, Sciences and Education',
  'College of Nursing and Allied Health Sciences',
  'College of Computer Studies',
  'College of Criminal Justice',
];

export default function ParticipantProfile() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  const isGoogleUser = user?.authProvider === 'google';
  const needsDepartment = isGoogleUser && (!user?.department || user?.department === 'Not Specified');

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    department: user?.department === 'Not Specified' ? '' : (user?.department || ''),
    email: user?.email || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.department) {
      setError('First name, last name and department are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
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

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required.');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      }, token);

      if (res.data.success) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess('');
        }, 1500);
      } else {
        setPasswordError(res.data.message);
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setChangingPassword(false);
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
          <button style={styles.backBtn} onClick={() => navigate('/dashboard/participant')}>&#8249;</button>
          <h2 style={styles.pageTitle}>Profile</h2>
        </div>

        {/* Google user tip */}
        {needsDepartment && (
          <div style={styles.tipBox}>
            <p style={styles.tipTitle}>Do this first!</p>
            <p style={styles.tipText}>
              Please fill in the department field, otherwise you can't access features and join events.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button style={styles.tipOkBtn} onClick={() => setEditing(true)}>OK</button>
            </div>
          </div>
        )}

        {/* Profile card */}
        <div style={styles.card}>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>First Name</label>
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              disabled={!editing}
              style={{ ...styles.input, ...(editing ? styles.inputActive : styles.inputDisabled) }}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Last Name</label>
            <input
              name="lastName"
              value={form.lastName}
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
            {!isGoogleUser && (
              <button style={styles.changePassBtn} onClick={() => setShowPasswordModal(true)}>
                Change Password
              </button>
            )}
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

      {/* Password Modal */}
      {showPasswordModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Change Password</h3>
              <button style={styles.modalCloseBtn} onClick={() => {
                setShowPasswordModal(false);
                setPasswordError('');
                setPasswordSuccess('');
                setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
              }}>✕</button>
            </div>
            <label style={styles.modalLabel}>Old Password</label>
            <input
              type="password"
              value={passwordForm.oldPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
              style={styles.modalInput}
            />
            <label style={styles.modalLabel}>New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              style={styles.modalInput}
            />
            <label style={styles.modalLabel}>Confirm Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              style={styles.modalInput}
            />
            {passwordError && <p style={styles.modalError}>{passwordError}</p>}
            {passwordSuccess && <p style={styles.modalSuccess}>{passwordSuccess}</p>}
            <button
              style={styles.modalChangeBtn}
              onClick={handlePasswordChange}
              disabled={changingPassword}
            >
              {changingPassword ? 'Changing...' : 'Change'}
            </button>
          </div>
        </div>
      )}

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
  tipBox: {
    backgroundColor: '#6b1a1a',
    borderRadius: '12px',
    padding: '24px 32px',
    marginBottom: '24px',
    maxWidth: '700px',
  },
  tipTitle: {
    color: '#f5f0e8',
    fontWeight: 'bold',
    fontSize: '20px',
    fontFamily: 'Georgia, serif',
    margin: '0 0 8px 0',
  },
  tipText: {
    color: '#f5f0e8',
    fontSize: '16px',
    fontFamily: 'Georgia, serif',
    margin: 0,
  },
  tipOkBtn: {
    backgroundColor: '#a82020',
    color: '#f5f0e8',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 24px',
    fontSize: '15px',
    fontFamily: 'Georgia, serif',
    cursor: 'pointer',
    fontWeight: 'bold',
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
  inputActive: { backgroundColor: '#f5f0e8', color: '#3d2b2b' },
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
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(3px)',
    zIndex: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    backgroundColor: '#6b1a1a',
    borderRadius: '16px',
    padding: '32px 40px',
    width: '380px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  modalTitle: {
    color: '#f5f0e8',
    fontFamily: 'Georgia, serif',
    fontSize: '20px',
    margin: 0,
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#f5f0e8',
    fontSize: '18px',
    cursor: 'pointer',
  },
  modalLabel: {
    color: '#f5f0e8',
    fontSize: '14px',
    fontFamily: 'Georgia, serif',
    marginTop: '8px',
  },
  modalInput: {
    backgroundColor: '#f5f0e8',
    border: 'none',
    borderRadius: '6px',
    padding: '12px',
    fontSize: '15px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  modalError: {
    color: '#ffcccc',
    fontSize: '13px',
    textAlign: 'center',
    margin: '4px 0',
  },
  modalSuccess: {
    color: '#90ee90',
    fontSize: '13px',
    textAlign: 'center',
    margin: '4px 0',
  },
  modalChangeBtn: {
    marginTop: '16px',
    backgroundColor: '#a82020',
    color: '#f5f0e8',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '15px',
    fontFamily: 'Georgia, serif',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
  },
};