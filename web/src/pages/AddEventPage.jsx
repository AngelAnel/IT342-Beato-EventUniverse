import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const DEPARTMENTS = [
  'All Departments',
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

  const [picture, setPicture] = useState(null);
  const [picturePreview, setPicturePreview] = useState(null);
  const [eventName, setEventName] = useState('');
  const [department, setDepartment] = useState('');
  const [venue, setVenue] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');

  // Toggles
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [attachmentEnabled, setAttachmentEnabled] = useState(false);
  const [maxParticipantsEnabled, setMaxParticipantsEnabled] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState('');
  const [gcashEnabled, setGcashEnabled] = useState(false);
  const [onsiteEnabled, setOnsiteEnabled] = useState(false);

  // Payment fields
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCategory, setPaymentCategory] = useState('');
  const [gcashDetails, setGcashDetails] = useState('');
  const [onsiteDetails, setOnsiteDetails] = useState('');

  const handlePictureClick = () => fileInputRef.current.click();

  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPicture(file);
      setPicturePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.body}>
        <div style={styles.card}>
          <h1 style={styles.pageTitle}>ADD AN EVENT</h1>

          {/* Picture upload */}
          <div style={styles.pictureBox} onClick={handlePictureClick}>
            {picturePreview
              ? <img src={picturePreview} alt="Event" style={styles.picturePreview} />
              : <span style={styles.picturePlaceholder}>+ Picture</span>
            }
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handlePictureChange}
          />

          {/* Event Name */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Name of the Event</label>
            <input
              type="text"
              placeholder="Add a name..."
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              style={styles.inputFull}
            />
          </div>

          {/* Two column row */}
          <div style={styles.twoCol}>

            {/* Left column */}
            <div style={styles.col}>

              {/* Department */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Choose Department</label>
                <div style={styles.selectWrap}>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    style={styles.select}>
                    <option value="">List of Departments...</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Payment toggle */}
              <div style={styles.toggleRow}>
                <label style={styles.label}>Payment (Optional)</label>
                <Toggle checked={paymentEnabled} onChange={setPaymentEnabled} />
              </div>

              {paymentEnabled && (
                <div style={styles.paymentFields}>
                  <div style={styles.paymentBtnRow}>
                    <input
                      type="number"
                      placeholder="Add Amount"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      style={styles.smallInput}
                    />
                    <input
                      type="text"
                      placeholder="Add Category"
                      value={paymentCategory}
                      onChange={(e) => setPaymentCategory(e.target.value)}
                      style={styles.smallInput}
                    />
                    <span style={styles.availableTag}>Amount Available</span>
                  </div>

                  {/* Payment method */}
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Payment Method</label>

                    <div style={styles.toggleRow}>
                      <span style={styles.methodLabel}>Online (Gcash)</span>
                      <Toggle checked={gcashEnabled} onChange={setGcashEnabled} />
                    </div>
                    {gcashEnabled && (
                      <input
                        type="text"
                        placeholder="Add Gcash details..."
                        value={gcashDetails}
                        onChange={(e) => setGcashDetails(e.target.value)}
                        style={{ ...styles.smallInput, width: '100%', marginBottom: '8px' }}
                      />
                    )}

                    <div style={styles.toggleRow}>
                      <span style={styles.methodLabel}>Onsite Payment</span>
                      <Toggle checked={onsiteEnabled} onChange={setOnsiteEnabled} />
                    </div>
                    {onsiteEnabled && (
                      <input
                        type="text"
                        placeholder="Add onsite payment details..."
                        value={onsiteDetails}
                        onChange={(e) => setOnsiteDetails(e.target.value)}
                        style={{ ...styles.smallInput, width: '100%', marginBottom: '8px' }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right column */}
            <div style={styles.col}>

              {/* Attachment toggle */}
              <div style={styles.toggleRow}>
                <label style={styles.label}>Attachment Field (Optional)</label>
                <Toggle checked={attachmentEnabled} onChange={setAttachmentEnabled} />
              </div>

              {/* Max participants toggle */}
              <div style={styles.toggleRow}>
                <label style={styles.label}>Event Maximum Participants:</label>
                <Toggle checked={maxParticipantsEnabled} onChange={setMaxParticipantsEnabled} />
              </div>
              {maxParticipantsEnabled && (
                <input
                  type="number"
                  placeholder="Max participants"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  style={{ ...styles.smallInput, width: '100px', marginBottom: '12px' }}
                />
              )}

              {/* Venue */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Event Venue</label>
                <input
                  type="text"
                  placeholder="Add Venue..."
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  style={styles.inputFull}
                />
              </div>

              {/* Date and Time */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Event Date and Time</label>
                <div style={styles.dateTimeRow}>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    style={styles.dateInput}
                  />
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    placeholder="Input time (AM/PM)"
                    style={styles.timeInput}
                  />
                </div>
              </div>

              {/* Submit */}
              <button style={styles.submitBtn} disabled>
                SUBMIT
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable toggle switch component
function Toggle({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        backgroundColor: checked ? '#6b1a1a' : '#ccc',
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
  card: {
    backgroundColor: '#6b1a1a',
    borderRadius: '16px',
    padding: '36px 40px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  pageTitle: {
    color: '#f5f0e8',
    fontSize: '28px',
    fontWeight: 'bold',
    fontFamily: 'Georgia, serif',
    letterSpacing: '2px',
    marginBottom: '24px',
  },
  pictureBox: {
    width: '100%',
    height: '180px',
    backgroundColor: '#d0cdc5',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    marginBottom: '24px',
    overflow: 'hidden',
  },
  picturePlaceholder: {
    fontSize: '24px',
    color: '#666',
    fontFamily: 'Georgia, serif',
  },
  picturePreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  fieldGroup: { marginBottom: '16px' },
  label: {
    color: '#f5f0e8',
    fontWeight: 'bold',
    fontSize: '15px',
    display: 'block',
    marginBottom: '6px',
    fontFamily: 'Georgia, serif',
  },
  inputFull: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#f5f0e8',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#3d2b2b',
  },
  selectWrap: { position: 'relative' },
  select: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#f5f0e8',
    fontSize: '15px',
    outline: 'none',
    appearance: 'auto',
    cursor: 'pointer',
    color: '#3d2b2b',
  },
  twoCol: {
    display: 'flex',
    gap: '32px',
    alignItems: 'flex-start',
  },
  col: { flex: 1 },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '10px',
  },
  paymentFields: { marginBottom: '12px' },
  paymentBtnRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  smallInput: {
    padding: '8px 12px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: '#f5f0e8',
    fontSize: '13px',
    outline: 'none',
    color: '#3d2b2b',
    cursor: 'text',
  },
  availableTag: {
    backgroundColor: '#f5f0e8',
    color: '#6b1a1a',
    borderRadius: '20px',
    padding: '6px 12px',
    fontSize: '12px',
    fontFamily: 'Georgia, serif',
  },
  methodLabel: {
    color: '#f5f0e8',
    fontSize: '15px',
    fontFamily: 'Georgia, serif',
  },
  dateTimeRow: {
    display: 'flex',
    gap: '12px',
  },
  dateInput: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#f5f0e8',
    fontSize: '14px',
    outline: 'none',
    color: '#3d2b2b',
  },
  timeInput: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#f5f0e8',
    fontSize: '14px',
    outline: 'none',
    color: '#3d2b2b',
  },
  submitBtn: {
    marginTop: '24px',
    backgroundColor: '#a82020',
    color: '#f5f0e8',
    border: 'none',
    borderRadius: '8px',
    padding: '14px 40px',
    fontSize: '18px',
    fontWeight: 'bold',
    fontFamily: 'Georgia, serif',
    letterSpacing: '2px',
    cursor: 'not-allowed',
    float: 'right',
    opacity: 0.9,
  },
};