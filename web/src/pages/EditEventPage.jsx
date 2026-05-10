import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import defaultEventImg from '../assets/default-event.png';
import { updateEvent, deleteEvent } from '../api/auth';

const DEPARTMENTS = [
  'College of Engineering and Architecture',
  'College of Management, Business and Accountancy',
  'College of Arts, Sciences and Education',
  'College of Nursing and Allied Health Sciences',
  'College of Computer Studies',
  'College of Criminal Justice',
];

export default function EditEventPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const event = location.state?.event;
  const token = localStorage.getItem('token');

  const fileInputRef = useRef(null);

  const [picture, setPicture] = useState(null);
  const [picturePreview, setPicturePreview] = useState(event?.picture || null);
  const [eventName, setEventName] = useState(event?.eventName || '');
  const [selectedDepartments, setSelectedDepartments] = useState(
    event?.departments ? event.departments.split('|').map(d => d.trim()) : []
  );
  const [venue, setVenue] = useState(event?.venue || '');
  const [eventDateTime, setEventDateTime] = useState(
    event?.eventDateTime ? event.eventDateTime.slice(0, 16) : ''
  );

  // Read-only fields
  const attachmentEnabled = event?.attachmentEnabled || false;
  const attachmentInstructions = event?.attachmentInstructions || '';
  const maxParticipantsEnabled = event?.maxParticipantsEnabled || false;
  const maxParticipants = event?.maxParticipants || '';
  const categoriesEnabled = event?.categoriesEnabled || false;
  const categories = (() => {
    try { return JSON.parse(event?.categories || '[]'); }
    catch { return []; }
  })();
  const gcashEnabled = event?.gcashEnabled || false;
  const onsiteEnabled = event?.onsiteEnabled || false;

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!event) {
    navigate('/dashboard/organizer');
    return null;
  }

  const handlePictureClick = () => fileInputRef.current.click();
  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPicture(file);
      setPicturePreview(URL.createObjectURL(file));
    }
  };

  const handleDepartmentToggle = (dept) => {
    setSelectedDepartments(prev =>
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  const hasChanges = () => {
    const originalDepts = event.departments
      ? event.departments.split('|').map(d => d.trim()).sort()
      : [];
    const currentDepts = [...selectedDepartments].sort();

    return (
      eventName !== event.eventName ||
      venue !== event.venue ||
      eventDateTime !== (event.eventDateTime ? event.eventDateTime.slice(0, 16) : '') ||
      JSON.stringify(currentDepts) !== JSON.stringify(originalDepts) ||
      picture !== null
    );
  };

  const handleUpdate = async () => {
    if (!hasChanges()) {
      setSubmitError('There is nothing to update.');
      return;
    }
    if (!eventName || !venue || !eventDateTime || selectedDepartments.length === 0) {
      setSubmitError('Please fill in all required fields and select at least one department.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      let pictureBase64 = event.picture;
      if (picture) {
        pictureBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(picture);
        });
      }

      const payload = {
        eventName,
        venue,
        eventDateTime: eventDateTime + ':00',
        departments: selectedDepartments.join('|'),
        picture: pictureBase64,
        // Keep all other fields unchanged
        attachmentEnabled: event.attachmentEnabled,
        attachmentInstructions: event.attachmentInstructions,
        maxParticipantsEnabled: event.maxParticipantsEnabled,
        maxParticipants: event.maxParticipants,
        categoriesEnabled: event.categoriesEnabled,
        categories: event.categories,
        gcashEnabled: event.gcashEnabled,
        gcashQRs: event.gcashQRs,
        onsiteEnabled: event.onsiteEnabled,
        onsitePersonnel: event.onsitePersonnel,
        onsiteLocation: event.onsiteLocation,
        onsiteStart: event.onsiteStart,
        onsiteEnd: event.onsiteEnd,
      };

      const res = await updateEvent(event.id, payload, token);
      if (res.data.success) {
        navigate('/dashboard/organizer');
      } else {
        setSubmitError(res.data.message || 'Failed to update event.');
      }
    } catch (err) {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await deleteEvent(event.id, token);
      if (res.data.success) {
        navigate('/dashboard/organizer');
      } else {
        setSubmitError(res.data.message || 'Failed to delete event.');
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setSubmitError(msg);
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.body}>

        <div style={styles.titleRow}>
          <button style={styles.backBtn} onClick={() => navigate('/dashboard/organizer')}>&#8249;</button>
          <h1 style={styles.pageTitle}>EDIT EVENT</h1>
        </div>

        <div style={styles.twoCol}>

          {/* LEFT COLUMN — editable */}
          <div style={styles.leftCol}>
            <div style={styles.pictureBox} onClick={handlePictureClick}>
              {picturePreview
                ? <img src={picturePreview} alt="Event" style={styles.picturePreview} />
                : (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <img src={defaultEventImg} alt="Default" style={styles.picturePreview} />
                    <div style={styles.pictureOverlay}>
                      <span style={styles.picturePlaceholder}>+Picture</span>
                    </div>
                  </div>
                )
              }
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handlePictureChange} />

            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Basic Information</h2>

              <label style={styles.label}>Name of the Event</label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                style={styles.input}
              />

              <label style={styles.label}>Choose Department</label>
              <div style={styles.checkboxGroup}>
                {DEPARTMENTS.map(dept => (
                  <div key={dept} style={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      id={dept}
                      checked={selectedDepartments.includes(dept)}
                      onChange={() => handleDepartmentToggle(dept)}
                      style={styles.checkbox}
                    />
                    <label htmlFor={dept} style={styles.checkboxLabel}>{dept}</label>
                  </div>
                ))}
              </div>

              <label style={styles.label}>Event Venue</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                style={styles.input}
              />

              <label style={styles.label}>Event Date and Time</label>
              <input
                type="datetime-local"
                value={eventDateTime}
                onChange={(e) => setEventDateTime(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          {/* RIGHT COLUMN — read only */}
          <div style={styles.rightCol}>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Additional Information</h2>

              <div style={styles.toggleRow}>
                <div>
                  <span style={styles.toggleLabel}>Attachment Field (Optional)</span>
                  <p style={styles.toggleNote}>Note: This field is applicable for events that requires google drive links, profile links, etc.</p>
                </div>
                <Toggle checked={attachmentEnabled} disabled={true} />
              </div>
              {attachmentEnabled && (
                <textarea
                  value={attachmentInstructions}
                  disabled={true}
                  style={{ ...styles.textarea, cursor: 'not-allowed', opacity: 0.7 }}
                />
              )}

              <div style={styles.divider} />

              <div style={styles.toggleRow}>
                <div>
                  <span style={styles.toggleLabel}>Event Maximum Participants:</span>
                  <p style={styles.toggleNote}>Note: No field specifications means the event has no maximum participant limit.</p>
                </div>
                <Toggle checked={maxParticipantsEnabled} disabled={true} />
              </div>
              {maxParticipantsEnabled && (
                <input
                  type="number"
                  value={maxParticipants}
                  disabled={true}
                  style={{ ...styles.input, width: '100px', cursor: 'not-allowed', opacity: 0.7 }}
                />
              )}

              <div style={styles.divider} />

              <h2 style={styles.cardTitle}>Payment Details:</h2>

              <div style={styles.toggleRow}>
                <div>
                  <span style={styles.toggleLabel}>Categories Specifications:</span>
                  <p style={styles.toggleNote}>Note: No field specifications means event is free.</p>
                </div>
                <Toggle checked={categoriesEnabled} disabled={true} />
              </div>

              {categoriesEnabled && (
                <div style={styles.categoriesSection}>
                  {categories.map((cat, index) => (
                    <div key={index} style={{ ...styles.categoryTag, cursor: 'default' }}>
                      <span>P {cat.price} • {cat.name} • {cat.slots ? `${cat.slots} available slots` : 'Unlimited slots'}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={styles.divider} />

              <h3 style={{ ...styles.toggleLabel, marginTop: '8px' }}>Payment Methods:</h3>
              <div style={styles.paymentMethodsRow}>
                <div style={styles.paymentMethod}>
                  <div style={styles.toggleRow}>
                    <span style={styles.toggleLabel}>Online (Gcash)</span>
                    <Toggle checked={gcashEnabled} disabled={true} />
                  </div>
                </div>
                <div style={styles.paymentDivider} />
                <div style={styles.paymentMethod}>
                  <div style={styles.toggleRow}>
                    <span style={styles.toggleLabel}>Onsite Payment</span>
                    <Toggle checked={onsiteEnabled} disabled={true} />
                  </div>
                </div>
              </div>

              <p style={{ color: 'rgba(245,240,232,0.5)', fontSize: '11px', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: '12px' }}>
                * Additional information and payment details cannot be edited after event creation.
              </p>

              {submitError && <p style={{ color: '#ffcccc', fontSize: '13px', textAlign: 'right', marginTop: '8px' }}>{submitError}</p>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button style={styles.deleteBtn} onClick={() => setShowDeleteConfirm(true)}>DELETE</button>
                <button style={styles.updateBtn} onClick={handleUpdate} disabled={submitting}>
                  {submitting ? 'UPDATING...' : 'UPDATE'}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalBox, alignItems: 'center', gap: '20px' }}>
            <h3 style={{ ...styles.modalTitle, textAlign: 'center' }}>Are you sure you want to delete this event?</h3>
            <p style={{ color: 'rgba(245,240,232,0.7)', fontSize: '13px', fontFamily: 'Georgia, serif', textAlign: 'center', margin: 0 }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button
                style={{ ...styles.modalCancelBtn, flex: 1, padding: '12px' }}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                style={{ ...styles.deleteBtn, flex: 1, padding: '12px', borderRadius: '8px', fontSize: '15px' }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function Toggle({ checked, disabled }) {
  return (
    <div style={{
      width: '44px', height: '24px', borderRadius: '12px',
      backgroundColor: checked ? '#a82020' : '#ccc',
      position: 'relative',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'background 0.2s', flexShrink: 0,
      opacity: disabled ? 0.6 : 1,
    }}>
      <div style={{
        width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#fff',
        position: 'absolute', top: '3px',
        left: checked ? '23px' : '3px', transition: 'left 0.2s',
      }} />
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f5f0e8' },
  body: { padding: '32px 48px' },
  titleRow: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' },
  backBtn: {
    backgroundColor: '#6b1a1a', color: '#f5f0e8', border: 'none',
    borderRadius: '50%', width: '36px', height: '36px', fontSize: '22px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  pageTitle: {
    fontSize: '32px', fontWeight: 'bold', color: '#6b1a1a',
    fontFamily: 'Georgia, serif', letterSpacing: '2px', margin: 0,
  },
  twoCol: { display: 'flex', gap: '32px', alignItems: 'flex-start' },
  leftCol: { flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' },
  rightCol: { flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' },
  pictureBox: {
    width: '100%', height: '200px', backgroundColor: '#d0cdc5',
    borderRadius: '12px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', overflow: 'hidden',
  },
  pictureOverlay: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', borderRadius: '12px',
  },
  picturePlaceholder: { fontSize: '28px', color: '#FEF9E1', fontFamily: 'Georgia, serif' },
  picturePreview: { width: '100%', height: '100%', objectFit: 'cover' },
  card: { backgroundColor: '#6b1a1a', borderRadius: '16px', padding: '24px 28px' },
  cardTitle: {
    color: '#f5f0e8', fontSize: '20px', fontWeight: 'bold',
    fontFamily: 'Georgia, serif', margin: '0 0 16px 0',
  },
  label: {
    color: '#f5f0e8', fontWeight: 'bold', fontSize: '14px',
    display: 'block', marginBottom: '6px', fontFamily: 'Georgia, serif', marginTop: '12px',
  },
  input: {
    width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none',
    backgroundColor: '#f5f0e8', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', color: '#3d2b2b', fontFamily: 'Georgia, serif',
  },
  checkboxGroup: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' },
  checkboxRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  checkbox: { width: '16px', height: '16px', cursor: 'pointer', accentColor: '#a82020' },
  checkboxLabel: { color: '#f5f0e8', fontSize: '13px', fontFamily: 'Georgia, serif', cursor: 'pointer' },
  toggleRow: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: '12px', marginBottom: '8px',
  },
  toggleLabel: {
    color: '#f5f0e8', fontWeight: 'bold', fontSize: '15px',
    fontFamily: 'Georgia, serif', display: 'block',
  },
  toggleNote: {
    color: 'rgba(245,240,232,0.6)', fontSize: '11px', fontFamily: 'Georgia, serif',
    margin: '2px 0 0 0', fontStyle: 'italic',
  },
  textarea: {
    width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
    backgroundColor: '#f5f0e8', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', color: '#3d2b2b', fontFamily: 'Georgia, serif',
    minHeight: '80px', resize: 'vertical', marginBottom: '12px',
  },
  divider: { height: '1px', backgroundColor: 'rgba(245,240,232,0.2)', margin: '16px 0' },
  categoriesSection: { marginBottom: '12px' },
  categoryTag: {
    backgroundColor: '#f5f0e8', color: '#6b1a1a', borderRadius: '20px',
    padding: '8px 14px', fontSize: '13px', fontFamily: 'Georgia, serif',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px',
  },
  paymentMethodsRow: { display: 'flex', gap: '16px', alignItems: 'flex-start', marginTop: '8px' },
  paymentMethod: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  paymentDivider: { width: '1px', backgroundColor: 'rgba(245,240,232,0.2)', alignSelf: 'stretch' },
  deleteBtn: {
    backgroundColor: '#3d2b2b', color: '#f5f0e8', border: 'none',
    borderRadius: '8px', padding: '14px 48px', fontSize: '18px',
    fontWeight: 'bold', fontFamily: 'Georgia, serif', letterSpacing: '2px', cursor: 'pointer',
  },
  updateBtn: {
    backgroundColor: '#a82020', color: '#f5f0e8', border: 'none',
    borderRadius: '8px', padding: '14px 48px', fontSize: '18px',
    fontWeight: 'bold', fontFamily: 'Georgia, serif', letterSpacing: '2px', cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)',
    zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  modalBox: {
    backgroundColor: '#6b1a1a', borderRadius: '16px', padding: '32px 40px',
    width: '380px', display: 'flex', flexDirection: 'column', gap: '6px',
  },
  modalTitle: {
    color: '#f5f0e8', fontFamily: 'Georgia, serif', fontSize: '18px',
    fontWeight: 'bold', textAlign: 'center', margin: 0,
  },
  modalCancelBtn: {
    backgroundColor: 'transparent', color: '#f5f0e8', border: '1px solid #f5f0e8',
    borderRadius: '8px', padding: '8px 20px', fontSize: '14px',
    fontFamily: 'Georgia, serif', cursor: 'pointer',
  },
};