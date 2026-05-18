import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar';
import defaultEventImg from '../shared/assets/default-event.png';
import { createEvent } from '../auth/auth';

const DEPARTMENTS = [
  'College of Engineering and Architecture',
  'College of Management, Business and Accountancy',
  'College of Arts, Sciences and Education',
  'College of Nursing and Allied Health Sciences',
  'College of Computer Studies',
  'College of Criminal Justice',
];

export default function AddEventPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const gcashFileRef = useRef(null);

  // Picture
  const [picture, setPicture] = useState(null);
  const [picturePreview, setPicturePreview] = useState(null);

  // Basic Info
  const [eventName, setEventName] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [venue, setVenue] = useState('');
  const [eventDateTime, setEventDateTime] = useState('');

  // Additional Info
  const [attachmentEnabled, setAttachmentEnabled] = useState(false);
  const [attachmentInstructions, setAttachmentInstructions] = useState('');
  const [maxParticipantsEnabled, setMaxParticipantsEnabled] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState('');

  // Payment Details
  const [categoriesEnabled, setCategoriesEnabled] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ price: '', name: '', slots: '' });

  // Payment Methods
  const [gcashEnabled, setGcashEnabled] = useState(false);
  const [gcashQRs, setGcashQRs] = useState([]);
  const [showGcashModal, setShowGcashModal] = useState(false);
  const [gcashConfirmed, setGcashConfirmed] = useState(false);

  const [onsiteEnabled, setOnsiteEnabled] = useState(false);
  const [showOnsiteModal, setShowOnsiteModal] = useState(false);
  const [onsiteConfirmed, setOnsiteConfirmed] = useState(false);
  const [onsiteDetails, setOnsiteDetails] = useState({
    personnel: '',
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

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
      prev.includes(dept)
        ? prev.filter(d => d !== dept)
        : [...prev, dept]
    );
  };

  const handleAddCategory = () => {
    if (!categoryForm.price || !categoryForm.name) return;
    setCategories(prev => [...prev, { ...categoryForm }]);
    setCategoryForm({ price: '', name: '', slots: '' });
    setShowCategoryModal(false);
  };

  const handleDeleteCategory = (index) => {
    setCategories(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
  if (!eventName || !venue || !eventDateTime || selectedDepartments.length === 0) {
    setSubmitError('Please fill in all required fields and select at least one department.');
    return;
  }


  if ((gcashEnabled || onsiteEnabled) && (!categoriesEnabled || categories.length === 0)) {
    setSubmitError('Please specify at least one category with a price since this is a paid event.');
    return;
  }

  if (categoriesEnabled && categories.length === 0) {
    setSubmitError('Please add at least one category.');
    return;
  }

  // If categories are defined but no payment method selected
  if (categoriesEnabled && categories.length > 0 && !gcashEnabled && !onsiteEnabled) {
    setSubmitError('Please select at least one payment method since you have defined categories.');
    return;
  }

  // If GCash enabled but no QR uploaded
  if (gcashEnabled && gcashQRs.length === 0) {
    setSubmitError('Please upload at least one GCash QR code.');
    return;
  }

  // If Onsite enabled but no details added
  if (onsiteEnabled && !onsiteConfirmed) {
    setSubmitError('Please add the details for onsite payment.');
    return;
  }

  setSubmitting(true);
  setSubmitError('');

  try {
    const token = localStorage.getItem('token');

  
    let pictureBase64 = null;
    if (picture) {
      pictureBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(picture);
      });
    }

    // Convert GCash QR images to Base64
    let gcashQRsBase64 = null;
    if (gcashQRs.length > 0) {
      const qrPromises = gcashQRs.map(qr => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(qr.file);
      }));
      const qrResults = await Promise.all(qrPromises);
      gcashQRsBase64 = JSON.stringify(qrResults);
    }

    // Build onsite datetime strings
    const onsiteStartStr = onsiteDetails.startDate && onsiteDetails.startTime
      ? `${onsiteDetails.startDate}T${onsiteDetails.startTime}:00`
      : null;
    const onsiteEndStr = onsiteDetails.endDate && onsiteDetails.endTime
      ? `${onsiteDetails.endDate}T${onsiteDetails.endTime}:00`
      : null;

    const payload = {
      eventName,
      venue,
      eventDateTime: eventDateTime + ':00',
      departments: selectedDepartments.join('|'),
      picture: pictureBase64,
      attachmentEnabled,
      attachmentInstructions: attachmentEnabled ? attachmentInstructions : null,
      maxParticipantsEnabled,
      maxParticipants: maxParticipantsEnabled ? maxParticipants : null,
      categoriesEnabled,
      categories: categoriesEnabled ? JSON.stringify(categories) : null,
      gcashEnabled,
      gcashQRs: gcashEnabled ? gcashQRsBase64 : null,
      onsiteEnabled,
      onsitePersonnel: onsiteEnabled ? onsiteDetails.personnel : null,
      onsiteLocation: onsiteEnabled ? onsiteDetails.location : null,
      onsiteStart: onsiteEnabled ? onsiteStartStr : null,
      onsiteEnd: onsiteEnabled ? onsiteEndStr : null,
    };

    const res = await createEvent(payload, token);
    if (res.data.success) {
      navigate('/dashboard/organizer');
    } else {
      setSubmitError(res.data.message || 'Failed to create event.');
    }
  } catch (err) {
    setSubmitError('Something went wrong. Please try again.');
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.body}>

        {/* Page Title */}
        <div style={styles.titleRow}>
          <button style={styles.backBtn} onClick={() => navigate('/dashboard/organizer')}>&#8249;</button>
          <h1 style={styles.pageTitle}>ADD AN EVENT</h1>
        </div>

        {/* Two column layout */}
        <div style={styles.twoCol}>

          {/* LEFT COLUMN */}
          <div style={styles.leftCol}>

            {/* Picture Upload */}
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
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handlePictureChange}
            />

            {/* Basic Information Card */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Basic Information</h2>

              <label style={styles.label}>Name of the Event</label>
              <input
                type="text"
                placeholder="Add a name..."
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
                placeholder="Add a venue..."
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

          {/* RIGHT COLUMN */}
          <div style={styles.rightCol}>

            {/* Additional Information Card */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Additional Information</h2>

              {/* Attachment Field */}
              <div style={styles.toggleRow}>
                <div>
                  <span style={styles.toggleLabel}>Attachment Field (Optional)</span>
                  <p style={styles.toggleNote}>Note: This field is applicable for events that requires google drive links, profile links, etc.</p>
                </div>
                <Toggle checked={attachmentEnabled} onChange={setAttachmentEnabled} />
              </div>
              {attachmentEnabled && (
                <textarea
                  placeholder="Additional instructions..."
                  value={attachmentInstructions}
                  onChange={(e) => setAttachmentInstructions(e.target.value)}
                  style={styles.textarea}
                />
              )}

              <div style={styles.divider} />

              {/* Max Participants */}
              <div style={styles.toggleRow}>
                <div>
                  <span style={styles.toggleLabel}>Event Maximum Participants:</span>
                  <p style={styles.toggleNote}>Note: No field specifications means the event has no maximum participant limit.</p>
                </div>
                <Toggle checked={maxParticipantsEnabled} onChange={setMaxParticipantsEnabled} />
              </div>
              {maxParticipantsEnabled && (
                <input
                  type="number"
                  placeholder="e.g. 100"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  style={{ ...styles.input, width: '100px' }}
                />
              )}

              <div style={styles.divider} />

              {/* Payment Details */}
              <h2 style={styles.cardTitle}>Payment Details:</h2>

              {/* Categories */}
              <div style={styles.toggleRow}>
                <div>
                  <span style={styles.toggleLabel}>Categories Specifications:</span>
                  <p style={styles.toggleNote}>Note: No field specifications means event is free.</p>
                </div>
                <Toggle checked={categoriesEnabled} onChange={setCategoriesEnabled} />
              </div>

              {categoriesEnabled && (
                <div style={styles.categoriesSection}>
                  <button style={styles.addCategoryBtn} onClick={() => setShowCategoryModal(true)}>
                    Add Category
                  </button>
                  {categories.map((cat, index) => (
                    <div key={index} style={styles.categoryTag}>
                      <span>P {cat.price} • {cat.name} • {cat.slots ? `${cat.slots} available slots` : 'Unlimited slots'}</span>
                      <button style={styles.deleteCategoryBtn} onClick={() => handleDeleteCategory(index)}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div style={styles.divider} />

              {/* Payment Methods */}
              <h3 style={{ ...styles.toggleLabel, marginTop: '8px' }}>Payment Methods:</h3>
              <div style={styles.paymentMethodsRow}>

                {/* GCash */}
                <div style={styles.paymentMethod}>
                  <div style={styles.toggleRow}>
                    <span style={styles.toggleLabel}>Online (Gcash)</span>
                    <Toggle checked={gcashEnabled} onChange={setGcashEnabled} />
                  </div>
                  {gcashEnabled && (
                    <button style={styles.addDetailsBtn} onClick={() => setShowGcashModal(true)}>
                      {gcashConfirmed ? 'Edit' : 'Add Details'}
                    </button>
                  )}
                </div>

                <div style={styles.paymentDivider} />

                {/* Onsite */}
                <div style={styles.paymentMethod}>
                  <div style={styles.toggleRow}>
                    <span style={styles.toggleLabel}>Onsite Payment</span>
                    <Toggle checked={onsiteEnabled} onChange={setOnsiteEnabled} />
                  </div>
                  {onsiteEnabled && (
                    <button style={styles.addDetailsBtn} onClick={() => setShowOnsiteModal(true)}>
                      {onsiteConfirmed ? 'Edit' : 'Add Details'}
                    </button>
                  )}
                </div>

              </div>

              {submitError && <p style={{ color: '#ffcccc', fontSize: '13px', textAlign: 'right', marginTop: '8px' }}>{submitError}</p>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button style={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'SUBMITTING...' : 'SUBMIT'}
                  </button>
                </div>

            </div>
          </div>
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <h3 style={styles.modalTitle}>INPUT CATEGORY DETAILS</h3>

            <label style={styles.modalLabel}>Price Amount</label>
            <input
              type="number"
              value={categoryForm.price}
              onChange={(e) => setCategoryForm({ ...categoryForm, price: e.target.value })}
              style={styles.modalInput}
            />

            <label style={styles.modalLabel}>Category</label>
            <input
              type="text"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              style={styles.modalInput}
            />

            <label style={styles.modalLabel}>Amount Available <span style={{ fontWeight: 'normal', opacity: 0.6 }}>(optional)</span></label>
            <input
              type="number"
              value={categoryForm.slots}
              onChange={(e) => setCategoryForm({ ...categoryForm, slots: e.target.value })}
              style={styles.modalInput}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', gap: '10px' }}>
              <button style={styles.modalCancelBtn} onClick={() => {
                setShowCategoryModal(false);
                setCategoryForm({ price: '', name: '', slots: '' });
              }}>Cancel</button>
              <button style={styles.modalAddBtn} onClick={handleAddCategory}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* GCash Modal */}
      {showGcashModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Online Payment Details</h3>
              <button style={styles.modalCloseBtn} onClick={() => setShowGcashModal(false)}>✕</button>
            </div>

            <p style={styles.modalLabel}>Add GCash QR here</p>
            <p style={styles.toggleNote}>You can add up to 3 GCash QR codes</p>

            <div style={styles.qrPreviewRow}>
              {gcashQRs.map((qr, index) => (
                <div key={index} style={styles.qrPreviewWrap}>
                  <img src={qr.preview} alt={`QR ${index + 1}`} style={styles.qrPreview} />
                  <button
                    style={styles.qrDeleteBtn}
                    onClick={() => setGcashQRs(prev => prev.filter((_, i) => i !== index))}
                  >✕</button>
                </div>
              ))}
              {gcashQRs.length < 3 && (
                <button style={styles.addPhotoBtn} onClick={() => gcashFileRef.current.click()}>
                  Add photo
                </button>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              ref={gcashFileRef}
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file && gcashQRs.length < 3) {
                  setGcashQRs(prev => [...prev, { file, preview: URL.createObjectURL(file) }]);
                }
                e.target.value = '';
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button style={styles.modalOkBtn} onClick={() => {
                setGcashConfirmed(true);
                setShowGcashModal(false);
              }}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Onsite Modal */}
      {showOnsiteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Onsite Payment Details</h3>
              <button style={styles.modalCloseBtn} onClick={() => setShowOnsiteModal(false)}>✕</button>
            </div>

            <label style={styles.modalLabel}>Name of Personnel</label>
            <input
              type="text"
              value={onsiteDetails.personnel}
              onChange={(e) => setOnsiteDetails({ ...onsiteDetails, personnel: e.target.value })}
              style={styles.modalInput}
            />

            <label style={styles.modalLabel}>Location</label>
            <input
              type="text"
              value={onsiteDetails.location}
              onChange={(e) => setOnsiteDetails({ ...onsiteDetails, location: e.target.value })}
              style={styles.modalInput}
            />

            <label style={styles.modalLabel}>Payment Duration</label>
            <div style={styles.durationRow}>
              <div style={styles.durationField}>
                <label style={styles.durationLabel}>Start Date</label>
                <input
                  type="date"
                  value={onsiteDetails.startDate}
                  onChange={(e) => setOnsiteDetails({ ...onsiteDetails, startDate: e.target.value })}
                  style={styles.modalInput}
                />
                <label style={styles.durationLabel}>Start Time</label>
                <input
                  type="time"
                  value={onsiteDetails.startTime}
                  onChange={(e) => setOnsiteDetails({ ...onsiteDetails, startTime: e.target.value })}
                  style={styles.modalInput}
                />
              </div>
              <div style={styles.durationField}>
                <label style={styles.durationLabel}>End Date</label>
                <input
                  type="date"
                  value={onsiteDetails.endDate}
                  onChange={(e) => setOnsiteDetails({ ...onsiteDetails, endDate: e.target.value })}
                  style={styles.modalInput}
                />
                <label style={styles.durationLabel}>End Time</label>
                <input
                  type="time"
                  value={onsiteDetails.endTime}
                  onChange={(e) => setOnsiteDetails({ ...onsiteDetails, endTime: e.target.value })}
                  style={styles.modalInput}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button style={styles.modalOkBtn} onClick={() => {
                setOnsiteConfirmed(true);
                setShowOnsiteModal(false);
              }}>OK</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        backgroundColor: checked ? '#a82020' : '#ccc',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}>
      <div style={{
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        backgroundColor: '#fff',
        position: 'absolute',
        top: '3px',
        left: checked ? '23px' : '3px',
        transition: 'left 0.2s',
      }} />
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f5f0e8' },
  body: { padding: '32px 48px' },
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
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#6b1a1a',
    fontFamily: 'Georgia, serif',
    letterSpacing: '2px',
    margin: 0,
  },
  twoCol: {
    display: 'flex',
    gap: '32px',
    alignItems: 'flex-start',
  },
  leftCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  rightCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  pictureBox: {
    width: '100%',
    height: '200px',
    backgroundColor: '#d0cdc5',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
  },
  pictureOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
  },
  picturePlaceholder: {
    fontSize: '28px',
    color: '#FEF9E1',
    fontFamily: 'Georgia, serif',
  },
  picturePreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  card: {
    backgroundColor: '#6b1a1a',
    borderRadius: '16px',
    padding: '24px 28px',
  },
  cardTitle: {
    color: '#f5f0e8',
    fontSize: '20px',
    fontWeight: 'bold',
    fontFamily: 'Georgia, serif',
    margin: '0 0 16px 0',
  },
  label: {
    color: '#f5f0e8',
    fontWeight: 'bold',
    fontSize: '14px',
    display: 'block',
    marginBottom: '6px',
    fontFamily: 'Georgia, serif',
    marginTop: '12px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#f5f0e8',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#3d2b2b',
    fontFamily: 'Georgia, serif',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '12px',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: '#a82020',
  },
  checkboxLabel: {
    color: '#f5f0e8',
    fontSize: '13px',
    fontFamily: 'Georgia, serif',
    cursor: 'pointer',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '8px',
  },
  toggleLabel: {
    color: '#f5f0e8',
    fontWeight: 'bold',
    fontSize: '15px',
    fontFamily: 'Georgia, serif',
    display: 'block',
  },
  toggleNote: {
    color: 'rgba(245,240,232,0.6)',
    fontSize: '11px',
    fontFamily: 'Georgia, serif',
    margin: '2px 0 0 0',
    fontStyle: 'italic',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#f5f0e8',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#3d2b2b',
    fontFamily: 'Georgia, serif',
    minHeight: '80px',
    resize: 'vertical',
    marginBottom: '12px',
  },
  divider: {
    height: '1px',
    backgroundColor: 'rgba(245,240,232,0.2)',
    margin: '16px 0',
  },
  categoriesSection: { marginBottom: '12px' },
  addCategoryBtn: {
    backgroundColor: '#f5f0e8',
    color: '#6b1a1a',
    border: 'none',
    borderRadius: '20px',
    padding: '6px 16px',
    fontSize: '13px',
    fontFamily: 'Georgia, serif',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  categoryTag: {
    backgroundColor: '#f5f0e8',
    color: '#6b1a1a',
    borderRadius: '20px',
    padding: '8px 14px',
    fontSize: '13px',
    fontFamily: 'Georgia, serif',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  deleteCategoryBtn: {
    background: 'none',
    border: 'none',
    color: '#6b1a1a',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    padding: '0 0 0 8px',
  },
  paymentMethodsRow: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    marginTop: '8px',
  },
  paymentMethod: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  paymentDivider: {
    width: '1px',
    backgroundColor: 'rgba(245,240,232,0.2)',
    alignSelf: 'stretch',
  },
  addDetailsBtn: {
    backgroundColor: '#f5f0e8',
    color: '#6b1a1a',
    border: 'none',
    borderRadius: '20px',
    padding: '6px 14px',
    fontSize: '12px',
    fontFamily: 'Georgia, serif',
    cursor: 'pointer',
    fontWeight: 'bold',
    width: 'fit-content',
  },
  submitBtn: {
    backgroundColor: '#a82020',
    color: '#f5f0e8',
    border: 'none',
    borderRadius: '8px',
    padding: '14px 48px',
    fontSize: '18px',
    fontWeight: 'bold',
    fontFamily: 'Georgia, serif',
    letterSpacing: '2px',
    cursor: 'pointer',
  },
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
    gap: '6px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  modalTitle: {
    color: '#f5f0e8',
    fontFamily: 'Georgia, serif',
    fontSize: '18px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '12px',
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
    fontWeight: 'bold',
  },
  modalInput: {
    backgroundColor: '#f5f0e8',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    color: '#3d2b2b',
  },
  modalCancelBtn: {
    backgroundColor: 'transparent',
    color: '#f5f0e8',
    border: '1px solid #f5f0e8',
    borderRadius: '8px',
    padding: '8px 20px',
    fontSize: '14px',
    fontFamily: 'Georgia, serif',
    cursor: 'pointer',
  },
  modalAddBtn: {
    backgroundColor: '#a82020',
    color: '#f5f0e8',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 24px',
    fontSize: '14px',
    fontFamily: 'Georgia, serif',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  modalOkBtn: {
    backgroundColor: '#2ecc71',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 28px',
    fontSize: '15px',
    fontFamily: 'Georgia, serif',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  qrPreviewRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    marginTop: '8px',
    marginBottom: '8px',
  },
  qrPreviewWrap: {
    position: 'relative',
    width: '80px',
    height: '80px',
  },
  qrPreview: {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '2px solid #f5f0e8',
  },
  qrDeleteBtn: {
    position: 'absolute',
    top: '-6px',
    right: '-6px',
    background: '#a82020',
    border: 'none',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    color: '#fff',
    fontSize: '11px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    backgroundColor: '#f5f0e8',
    color: '#6b1a1a',
    border: 'none',
    borderRadius: '20px',
    padding: '8px 16px',
    fontSize: '13px',
    fontFamily: 'Georgia, serif',
    cursor: 'pointer',
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  durationRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  durationField: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  durationLabel: {
    color: 'rgba(245,240,232,0.7)',
    fontSize: '12px',
    fontFamily: 'Georgia, serif',
    marginTop: '6px',
  },
};