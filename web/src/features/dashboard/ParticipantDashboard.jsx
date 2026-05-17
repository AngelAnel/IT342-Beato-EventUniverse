import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar';
import DashboardNav from '../shared/DashboardNav';
import defaultEventImg from '../shared/assets/default-event.png';
import { getParticipantEvents, getSlotCounts, submitRegistration, getMyConfirmedRegistrations } from '../auth/auth';



const DEPT_ACRONYMS = {
  'College of Engineering and Architecture': 'CEA',
  'College of Management, Business and Accountancy': 'CMBA',
  'College of Arts, Sciences and Education': 'CASE',
  'College of Nursing and Allied Health Sciences': 'CNAHS',
  'College of Computer Studies': 'CCS',
  'College of Criminal Justice': 'CCJ',
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getDepartmentDisplay(departments) {
  if (!departments) return 'Open for all';
  const depts = departments.split('|').map(d => d.trim());
  if (depts.length === 6) return 'Open for all';
  return depts.map(d => DEPT_ACRONYMS[d] || d).join(', ');
}

function getPaymentDisplay(event) {
  if (!event.categoriesEnabled) return 'Free';
  try {
    const cats = JSON.parse(event.categories || '[]');
    if (cats.length === 0) return 'Free';
    if (cats.length === 1) return `P ${cats[0].price}`;
    return 'Varies';
  } catch { return 'Free'; }
}

function getPaymentMethods(event) {
  const methods = [];
  if (event.gcashEnabled) methods.push('Online');
  if (event.onsiteEnabled) methods.push('Onsite');
  if (methods.length === 0) return null;
  return methods.join('/');
}

function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  return date.toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function applyFilters(events, selectedMonth, searchQuery) {
  return events.filter(event => {
    if (selectedMonth && selectedMonth !== 'Month') {
      const eventMonth = MONTHS[new Date(event.eventDateTime).getMonth()];
      if (eventMonth !== selectedMonth) return false;
    }
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchesName = event.eventName?.toLowerCase().includes(q);
      const matchesVenue = event.venue?.toLowerCase().includes(q);
      const matchesDept = event.departments?.toLowerCase().includes(q);
      const matchesOrganizer = event.organizerName?.toLowerCase().includes(q);
      if (!matchesName && !matchesVenue && !matchesDept && !matchesOrganizer) return false;
    }
    return true;
  });
}

function EventCard({ event, onRegister, isRegistered }) {
  const paymentDisplay = getPaymentDisplay(event);
  const deptDisplay = getDepartmentDisplay(event.departments);
  const paymentMethods = getPaymentMethods(event);

  return (
    <div style={styles.card}>
      <div style={styles.cardPicture}>
        <img src={event.picture || defaultEventImg} alt={event.eventName} style={styles.cardImg} />
      </div>
      <div style={styles.cardInfo}>
        <div style={styles.cardTitleRow}>
          <span style={styles.cardTitle}>{event.eventName}</span>
          <span style={styles.ongoingBadge}>ONGOING</span>
        </div>
        <div style={styles.cardOrganizer}>by {event.organizerName}</div>
        <div style={styles.cardDetails}>
          {paymentDisplay !== 'Free'
            ? <span>{paymentDisplay} • {deptDisplay}{paymentMethods ? ` • ${paymentMethods}` : ''}</span>
            : <span>Free • {deptDisplay}</span>
          }
        </div>
        <div style={styles.cardBottom}>
          <span style={styles.cardMeta}>{event.venue} &nbsp; {formatDateTime(event.eventDateTime)}</span>
          {isRegistered
            ? <span style={styles.registeredBtn}>Registered</span>
            : <span style={styles.registerBtn} onClick={() => onRegister(event)}>Register</span>
          }
        </div>
      </div>
    </div>
  );
}

function RegisterModal({ event, token, onClose }) {
  const proofInputRef = useRef(null);
  const gcashFileRef = useRef(null);

  const [slotCounts, setSlotCounts] = useState({});
  const [totalRegistered, setTotalRegistered] = useState(0);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [proofOfPayment, setProofOfPayment] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [showQR, setShowQR] = useState(null);
  const [showPicture, setShowPicture] = useState(false);
  const [links, setLinks] = useState(['']);
  const [warning, setWarning] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [slotsFull, setSlotsFull] = useState(false);

  const categories = (() => {
    try { return JSON.parse(event.categories || '[]'); }
    catch { return []; }
  })();

  const gcashQRs = (() => {
    try { return JSON.parse(event.gcashQRs || '[]'); }
    catch { return []; }
  })();

  const onsiteInfo = {
    personnel: event.onsitePersonnel,
    location: event.onsiteLocation,
    start: event.onsiteStart,
    end: event.onsiteEnd,
  };

  // Determine event type
  const isPaid = event.categoriesEnabled || event.gcashEnabled || event.onsiteEnabled;
  const hasCategories = event.categoriesEnabled && categories.length > 0;
  const hasPaymentMethod = event.gcashEnabled || event.onsiteEnabled;
  const hasAttachment = event.attachmentEnabled;
  const hasMaxParticipants = event.maxParticipantsEnabled;

  // Confirm button logic
  const canConfirm = (() => {
    const needsProof = hasPaymentMethod;
    const needsLink = hasAttachment;
    const hasProof = !!proofOfPayment;
    const hasLink = links.some(l => l.trim() !== '');

    if (needsProof && needsLink) return hasProof && hasLink;
    if (needsProof) return hasProof;
    if (needsLink) return hasLink;
    return true;
  })();

  useEffect(() => {
    fetchSlotCounts();
  }, []);

  const fetchSlotCounts = async () => {
  setLoadingSlots(true);
  try {
    const res = await getSlotCounts(event.id, token);
    if (res.data.success) {
      const counts = res.data.data.counts || {};
      setSlotCounts(counts);
      setAlreadyRegistered(res.data.data.alreadyRegistered || false);
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      setTotalRegistered(total);

      // Check if slots are full
      if (hasMaxParticipants && event.maxParticipants) {
        if (total >= parseInt(event.maxParticipants)) {
          setSlotsFull(true);
        }
      }

      // Check if all categories are full
      if (hasCategories) {
        const cats = (() => {
          try { return JSON.parse(event.categories || '[]'); }
          catch { return []; }
        })();
        const allFull = cats.every(cat => {
            if (!cat.slots) return false; 
            return (counts[cat.name] || 0) >= parseInt(cat.slots);
          });
        if (allFull) setSlotsFull(true);
      }
    }
  } catch (err) {
    console.error('Failed to fetch slot counts', err);
  } finally {
    setLoadingSlots(false);
  }
};

  const handleProofUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofOfPayment(file);
      setWarning('');
    }
    e.target.value = '';
  };

  const handleAddLink = () => {
    if (links.length < 5) setLinks([...links, '']);
  };

  const handleLinkChange = (index, value) => {
    const updated = [...links];
    updated[index] = value;
    setLinks(updated);
  };

  const handleRemoveLink = (index) => {
    if (links.length === 1) return;
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    if (!canConfirm) {
      if (hasPaymentMethod && !proofOfPayment && hasAttachment && !links.some(l => l.trim())) {
        setWarning('Please upload proof of payment and add at least one link');
      } else if (hasPaymentMethod && !proofOfPayment) {
        setWarning('Upload proof of payment first');
      } else if (hasAttachment && !links.some(l => l.trim())) {
        setWarning('Please add at least one link');
      }
      return;
    }
    if (hasCategories && !selectedCategory) {
      setWarning('Please select a category first');
      return;
    }

    setSubmitting(true);
    try {
      let proofBase64 = null;
      if (proofOfPayment) {
        proofBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(proofOfPayment);
        });
      }

      const payload = {
        eventId: event.id,
        categoryName: selectedCategory ? selectedCategory.name : 'General',
        categoryPrice: selectedCategory ? selectedCategory.price : '0',
        paymentMethod: selectedPaymentMethod || 'Not specified',
        proofOfPayment: proofBase64,
        links: links.filter(l => l.trim() !== '').join(','),
      };

      const res = await submitRegistration(payload, token);
      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => onClose(), 2000);
      } else {
        setWarning(res.data.message || 'Registration failed.');
      }
    } catch (err) {
      setWarning(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalDisplay = selectedCategory
    ? `P ${selectedCategory.price}`
    : (hasCategories ? '—' : 'Free');

  const slotsDisplay = (() => {
    if (!hasMaxParticipants) return 'Not Specified';
    return `${totalRegistered} / ${event.maxParticipants}`;
  })();

  if (success) {
    return (
      <div style={styles.modalOverlay}>
        <div style={{ ...styles.regPanel, alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#2ecc71', fontSize: '20px', fontFamily: 'Georgia, serif', fontWeight: 'bold', textAlign: 'center' }}>
            ✓ Registration submitted successfully!
          </p>
          <p style={{ color: 'rgba(245,240,232,0.7)', fontSize: '14px', fontFamily: 'Georgia, serif', textAlign: 'center' }}>
            Please wait for the organizer to confirm your registration.
          </p>
        </div>
      </div>
    );
  }

  if (alreadyRegistered) {
    return (
      <div style={styles.modalOverlay} onClick={onClose}>
        <div style={styles.regPanel} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button style={styles.regCloseBtn} onClick={onClose}>✕</button>
          </div>
          <p style={{ color: '#f5f0e8', fontSize: '18px', fontFamily: 'Georgia, serif', textAlign: 'center', marginTop: '32px' }}>
            You have already registered for this event.
          </p>
        </div>
      </div>
    );
  }

  if (slotsFull) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.regPanel} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button style={styles.regCloseBtn} onClick={onClose}>✕</button>
        </div>
        <p style={{ color: '#ffcccc', fontSize: '18px', fontFamily: 'Georgia, serif', textAlign: 'center', marginTop: '32px' }}>
          Sorry, this event is already full.
        </p>
        <p style={{ color: 'rgba(245,240,232,0.6)', fontSize: '13px', fontFamily: 'Georgia, serif', textAlign: 'center' }}>
          No more slots are available for registration.
        </p>
      </div>
    </div>
  );
}

  return (
    <>
      <div style={styles.modalOverlay} onClick={onClose}>
        <div style={styles.regPanel} onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div style={styles.regHeader}>
            <div style={{ flex: 1 }}>
              <p style={styles.regEventName}>{event.eventName}</p>
              <p style={styles.regOrgName}>by {event.organizerName}</p>
            </div>
            <button style={styles.regCloseBtn} onClick={onClose}>✕</button>
          </div>

          {/* Picture */}
          <div style={styles.regPicture} onClick={() => setShowPicture(true)} title="Click to view full picture">
            <img src={event.picture || defaultEventImg} alt={event.eventName} style={styles.regPictureImg} />
            <div style={styles.picOverlayHint}>🔍 Click to expand</div>
          </div>

          {/* Details Section */}
          <div style={styles.regSection}>
            <p style={styles.regSectionTitle}>Details</p>

            {/* Free event banner */}
            {!hasPaymentMethod && !hasCategories && (
              <div style={styles.freeBanner}>
                <p style={styles.freeBannerTitle}>The Event is Free</p>
                <p style={styles.freeBannerSub}>All you need to do is show up</p>
              </div>
            )}

            {/* Categories */}
            {hasCategories && (
              <>
                {loadingSlots ? (
                  <p style={styles.regSmallText}>Loading slots...</p>
                ) : (
                  categories.map((cat, i) => {
                    const taken = slotCounts[cat.name] || 0;
                    const totalSlots = cat.slots ? parseInt(cat.slots) : null;
                    const isSelected = selectedCategory?.name === cat.name;
                    return (
                      <div
                        key={i}
                        style={{
                          ...styles.categoryRow,
                          ...(isSelected ? styles.categoryRowSelected : {}),
                          transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                          transition: 'all 0.2s ease',
                        }}
                        onClick={() => { setSelectedCategory(cat); setWarning(''); }}
                      >
                        <span style={styles.catName}>{cat.name}</span>
                        <span style={styles.catSlots}>
                          {taken}/{totalSlots !== null ? totalSlots : '∞'}
                        </span>
                        <span style={styles.catPrice}>P {cat.price}</span>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* Slots available — for non-category events */}
            {!hasCategories && (
              <div style={styles.slotsBox}>
                <p style={styles.regSmallText}>
                  <span style={{ fontWeight: 'bold', color: '#f5f0e8' }}>Slots Available: </span>
                  {loadingSlots ? 'Loading...' : slotsDisplay}
                </p>
              </div>
            )}
          </div>

          {/* Summary — only for categories */}
          {hasCategories && (
            <div style={styles.regSection}>
              {selectedCategory && (
                <div style={styles.summaryRow}>
                  <span style={styles.regSmallText}>{selectedCategory.name} (pax)</span>
                  <span style={styles.regSmallText}>1</span>
                  <span style={styles.regSmallText}>P {selectedCategory.price}</span>
                </div>
              )}
              <div style={styles.summaryTotalRow}>
                <span style={styles.regSectionTitle}>TOTAL:</span>
                <span style={styles.regSectionTitle}>{totalDisplay}</span>
              </div>
            </div>
          )}

          {/* Attachment / Links */}
          {hasAttachment && (
            <div style={styles.regSection}>
              {event.attachmentInstructions && (
                <p style={styles.attachmentInstructions}>{event.attachmentInstructions}</p>
              )}
              <p style={styles.regSmallText}>You can add up to 5 links, if required.</p>
              {links.map((link, index) => (
                <div key={index} style={styles.linkRow}>
                  <input
                    type="text"
                    placeholder={`Link ${index + 1}...`}
                    value={link}
                    onChange={(e) => handleLinkChange(index, e.target.value)}
                    style={styles.linkInput}
                  />
                  {links.length > 1 && (
                    <button style={styles.removeLinkBtn} onClick={() => handleRemoveLink(index)}>✕</button>
                  )}
                </div>
              ))}
              {links.length < 5 && (
                <button style={styles.addLinkBtn} onClick={handleAddLink}>+ Add link</button>
              )}
            </div>
          )}

          {/* Payment Method */}
          {hasPaymentMethod && (
            <div style={styles.regSection}>
              <p style={styles.regSectionTitle}>Payment Method</p>
              <div style={styles.paymentMethodsRow}>

                {/* GCash */}
                {event.gcashEnabled && (
                  <div style={styles.paymentMethodBox}>
                    <p style={styles.regSmallText}>Online</p>
                    <button
                      style={styles.gcashBtn}
                      onClick={() => {
                        setShowQR(gcashQRs[0] || null);
                        setSelectedPaymentMethod('Online');
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>G</span> GCash
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      ref={proofInputRef}
                      style={{ display: 'none' }}
                      onChange={handleProofUpload}
                    />
                    <button
                      style={{
                        ...styles.proofBtn,
                        backgroundColor: proofOfPayment && selectedPaymentMethod === 'Online'
                          ? '#2ecc71' : 'rgba(245,240,232,0.2)',
                      }}
                      onClick={() => {
                        setSelectedPaymentMethod('Online');
                        proofInputRef.current.click();
                      }}
                    >
                      {proofOfPayment && selectedPaymentMethod === 'Online' ? '✓ Proof Uploaded' : 'Proof of Payment'}
                    </button>
                  </div>
                )}

                {event.gcashEnabled && event.onsiteEnabled && (
                  <div style={styles.paymentVerticalDivider} />
                )}

                {/* Onsite */}
                {event.onsiteEnabled && (
                  <div style={styles.paymentMethodBox}>
                    <p style={styles.regSmallText}>Onsite</p>
                    {onsiteInfo.location && (
                      <div>
                        <p style={styles.onsiteLabel}>Location</p>
                        <p style={styles.onsiteDetail}>{onsiteInfo.location}</p>
                      </div>
                    )}
                    {onsiteInfo.start && (
                      <div>
                        <p style={styles.onsiteLabel}>Start</p>
                        <p style={styles.onsiteDetail}>{formatDateTime(onsiteInfo.start)}</p>
                      </div>
                    )}
                    {onsiteInfo.end && (
                      <div>
                        <p style={styles.onsiteLabel}>End</p>
                        <p style={styles.onsiteDetail}>{formatDateTime(onsiteInfo.end)}</p>
                      </div>
                    )}
                    {onsiteInfo.personnel && (
                      <div>
                        <p style={styles.onsiteLabel}>Personnel</p>
                        <p style={styles.onsiteDetail}>{onsiteInfo.personnel}</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      ref={gcashFileRef}
                      style={{ display: 'none' }}
                      onChange={handleProofUpload}
                    />
                    <button
                      style={{
                        ...styles.proofBtn,
                        backgroundColor: proofOfPayment && selectedPaymentMethod === 'Onsite'
                          ? '#2ecc71' : 'rgba(245,240,232,0.2)',
                      }}
                      onClick={() => {
                        setSelectedPaymentMethod('Onsite');
                        gcashFileRef.current.click();
                      }}
                    >
                      {proofOfPayment && selectedPaymentMethod === 'Onsite' ? '✓ Proof Uploaded' : 'Proof of Payment'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warning */}
          {warning && <p style={styles.warningText}>{warning}</p>}

          {/* Confirm Button */}
          <button
            style={{
              ...styles.confirmBtn,
              opacity: submitting ? 0.7 : 1,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? 'SUBMITTING...' : 'CONFIRM REGISTRATION'}
          </button>

        </div>
      </div>

      {/* Full Picture Viewer */}
      {showPicture && (
        <div style={styles.fullPicOverlay} onClick={() => setShowPicture(false)}>
          <div style={styles.fullPicBox} onClick={e => e.stopPropagation()}>
            <button style={styles.fullPicCloseBtn} onClick={() => setShowPicture(false)}>✕</button>
            <img src={event.picture || defaultEventImg} alt={event.eventName} style={styles.fullPicImg} />
          </div>
        </div>
      )}

      {/* QR Viewer */}
      {showQR && (
        <div style={styles.qrOverlay} onClick={() => setShowQR(null)}>
          <div style={styles.qrViewer} onClick={e => e.stopPropagation()}>
            <button style={styles.qrCloseBtn} onClick={() => setShowQR(null)}>✕</button>
            <img src={showQR} alt="GCash QR" style={styles.qrImg} />
            <p style={styles.regSmallText}>Scan or screenshot to pay</p>
          </div>
        </div>
      )}
    </>
  );
}

function MyEventCard({ event, onView }) {
  const paymentDisplay = getPaymentDisplay(event);
  const deptDisplay = getDepartmentDisplay(event.departments);
  const paymentMethods = getPaymentMethods(event);

  return (
    <div style={styles.card}>
      <div style={styles.cardPicture}>
        <img src={event.picture || defaultEventImg} alt={event.eventName} style={styles.cardImg} />
      </div>
      <div style={styles.cardInfo}>
        <div style={styles.cardTitleRow}>
          <span style={styles.cardTitle}>{event.eventName}</span>
          <span style={styles.ongoingBadge}>ONGOING</span>
        </div>
        <div style={styles.cardOrganizer}>by {event.organizerName}</div>
        <div style={styles.cardDetails}>
          {paymentDisplay !== 'Free'
            ? <span>{paymentDisplay} • {deptDisplay}{paymentMethods ? ` • ${paymentMethods}` : ''}</span>
            : <span>Free • {deptDisplay}</span>
          }
        </div>
        <div style={styles.cardBottom}>
          <span style={styles.cardMeta}>{event.venue} &nbsp; {formatDateTime(event.eventDateTime)}</span>
          <span style={styles.registeredBtn} onClick={onView}>Registered</span>
        </div>
      </div>
    </div>
  );
}

export default function ParticipantDashboard() {
  const [myEvents, setMyEvents] = useState([]);
  const [myEventsLoading, setMyEventsLoading] = useState(false);
  const [selectedMyEvent, setSelectedMyEvent] = useState(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  const [activePage, setActivePage] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('Month');
  const [registerEvent, setRegisterEvent] = useState(null);
  const [registeredEventIds, setRegisteredEventIds] = useState([]);

  useEffect(() => {
    fetchEvents();
    fetchMyEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await getParticipantEvents(token);
      if (res.data.success) setEvents(res.data.data);
    } catch (err) {
      console.error('Failed to fetch events', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEvents = async () => {
  setMyEventsLoading(true);
      try {
        const res = await getMyConfirmedRegistrations(token);
        if (res.data.success) {
          setMyEvents(res.data.data);
          setRegisteredEventIds(res.data.data.map(e => e.eventId));
        }
      } catch (err) {
        console.error('Failed to fetch my events', err);
      } finally {
        setMyEventsLoading(false);
      }
    };

  const handlePageChange = (page) => {
  setActivePage(page);
  if (page === 'myevents') fetchMyEvents();
};
  const handleFilterChange = ({ month }) => setSelectedMonth(month);

  const renderContent = () => {
    const filteredEvents = applyFilters(events, selectedMonth, searchQuery);
    switch (activePage) {
      case 'home':
        if (loading) return <p style={styles.emptyText}>Loading events...</p>;
        if (filteredEvents.length === 0) return <p style={styles.emptyText}>There are currently no Events Posted</p>;
        return (
          <div style={styles.eventsGrid}>
            {filteredEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onRegister={(e) => setRegisterEvent(e)}
                  isRegistered={registeredEventIds.includes(event.id)}
                />
              ))}
          </div>
        );
      case 'myevents':
        if (myEventsLoading) return <p style={styles.emptyText}>Loading...</p>;
        if (myEvents.length === 0) return <p style={styles.emptyText}>You have not registered for any confirmed events yet</p>;
        return (
          <div style={styles.eventsGrid}>
            {myEvents.map(event => (
              <MyEventCard key={event.id} event={event} onView={() => setSelectedMyEvent(event)} />
            ))}
          </div>
        );
      case 'archive':
        return <p style={styles.emptyText}>No archived events yet</p>;
      default:
        return null;
    }
  };

  return (
    <div style={styles.page}>
          <Navbar
              onSearch={(q) => setSearchQuery(q)} searchQuery={searchQuery}
              onNotificationClick={(notif) => {
                const event = myEvents.find(e => e.eventId === notif.eventId);
                if (event) setSelectedMyEvent(event);
              }}
            />
      <div style={styles.body}>
        {activePage === 'home' && (
          <h1 style={styles.welcome}>Hello there, {user?.firstName} {user?.lastName}! Welcome Back</h1>
        )}
        {activePage === 'archive' && (
          <div style={styles.archiveTitleRow}>
            <button style={styles.backBtn} onClick={() => setActivePage('home')}>&#8249;</button>
            <h1 style={styles.archiveTitle}>Archives</h1>
          </div>
        )}
        {activePage === 'myevents' && (
          <h1 style={styles.welcome}>My Events</h1>
        )}
        <DashboardNav
          role="Participant"
          activePage={activePage}
          onPageChange={handlePageChange}
          onFilterChange={handleFilterChange}
        />
        {renderContent()}
      </div>

      {registerEvent && (
        <RegisterModal
          event={registerEvent}
          token={token}
          onClose={() => setRegisterEvent(null)}
        />
      )}
      {/* My Event Details Modal */}
      {selectedMyEvent && (
        <div style={styles.modalOverlay} onClick={() => setSelectedMyEvent(null)}>
          <div style={{
            backgroundColor: '#6b1a1a', borderRadius: '16px', width: '680px',
            maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
            padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '16px',
          }} onClick={e => e.stopPropagation()}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#f5f0e8', fontSize: '20px', fontWeight: 'bold', fontFamily: 'Georgia, serif', letterSpacing: '2px' }}>
                EVENT DETAILS
              </span>
              <button style={{ background: 'none', border: 'none', color: '#f5f0e8', fontSize: '22px', cursor: 'pointer' }}
                onClick={() => setSelectedMyEvent(null)}>✕</button>
            </div>

            <div style={{ width: '100%', height: '220px', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#d0cdc5' }}>
              <img src={selectedMyEvent.picture || defaultEventImg} alt={selectedMyEvent.eventName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <span style={{ color: '#f5f0e8', fontSize: '22px', fontWeight: 'bold', fontFamily: 'Georgia, serif' }}>
                {selectedMyEvent.eventName}
              </span>
              <span style={{ backgroundColor: '#2ecc71', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '20px', fontFamily: 'Georgia, serif' }}>
                ONGOING
              </span>
            </div>

            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <p style={{ color: '#f5f0e8', fontSize: '14px', fontFamily: 'Georgia, serif', margin: 0 }}>
                  <span style={{ fontWeight: 'bold' }}>Organized by: </span>{selectedMyEvent.organizerName}
                </p>
                <p style={{ color: '#f5f0e8', fontSize: '14px', fontFamily: 'Georgia, serif', margin: 0 }}>
                  <span style={{ fontWeight: 'bold' }}>Venue: </span>{selectedMyEvent.venue}
                </p>
                <p style={{ color: '#f5f0e8', fontSize: '14px', fontFamily: 'Georgia, serif', margin: 0 }}>
                  <span style={{ fontWeight: 'bold' }}>Date: </span>{formatDateTime(selectedMyEvent.eventDateTime)}
                </p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f5f0e8' },
  body: { padding: '40px 48px' },
  welcome: {
    fontSize: '42px', fontWeight: 'bold', color: '#6b1a1a',
    fontFamily: 'Georgia, serif', marginBottom: '24px', lineHeight: '1.2',
  },
  archiveTitleRow: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' },
  backBtn: {
    backgroundColor: '#6b1a1a', color: '#f5f0e8', border: 'none',
    borderRadius: '50%', width: '36px', height: '36px', fontSize: '22px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  archiveTitle: {
    fontSize: '42px', fontWeight: 'bold', color: '#6b1a1a',
    fontFamily: 'Georgia, serif', margin: 0,
  },
  emptyText: { fontSize: '22px', color: '#b0a090', fontFamily: 'Georgia, serif', marginTop: '16px' },
  eventsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
    gap: '24px', marginTop: '16px', alignItems: 'start',
  },
  card: {
    backgroundColor: '#f5f0e8', borderRadius: '16px', overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid rgba(107,26,26,0.1)', display:'flex', flexDirection:'column',
  },
  cardPicture: { width: '100%', height: '180px', overflow: 'hidden', backgroundColor: '#e8e3db' },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover' },
  cardInfo: { backgroundColor: '#6b1a1a', padding: '16px 20px' },
  cardTitleRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' },
  cardTitle: { color: '#f5f0e8', fontSize: '18px', fontWeight: 'bold', fontFamily: 'Georgia, serif' },
  ongoingBadge: {
    color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '3px 10px',
    borderRadius: '20px', fontFamily: 'Georgia, serif', letterSpacing: '0.5px', backgroundColor: '#2ecc71',
  },
  cardOrganizer: { color: 'rgba(245,240,232,0.7)', fontSize: '12px', fontFamily: 'Georgia, serif', marginBottom: '6px' },
  cardDetails: { color: 'rgba(245,240,232,0.85)', fontSize: '13px', fontFamily: 'Georgia, serif', marginBottom: '8px' },
  cardBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardMeta: { color: 'rgba(245,240,232,0.75)', fontSize: '12px', fontFamily: 'Georgia, serif' },
  registerBtn: {
    color: '#f5f0e8', fontSize: '13px', fontFamily: 'Georgia, serif',
    textDecoration: 'underline', cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)',
    zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  regPanel: {
    backgroundColor: '#6b1a1a', borderRadius: '16px', width: '360px',
    maxHeight: '90vh', overflowY: 'auto', padding: '24px',
    display: 'flex', flexDirection: 'column', gap: '12px',
  },
  regHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  regEventName: { color: '#f5f0e8', fontSize: '18px', fontWeight: 'bold', fontFamily: 'Georgia, serif', margin: 0 },
  regOrgName: { color: 'rgba(245,240,232,0.6)', fontSize: '12px', fontFamily: 'Georgia, serif', margin: '4px 0 0 0' },
  regCloseBtn: { background: 'none', border: 'none', color: '#f5f0e8', fontSize: '20px', cursor: 'pointer', flexShrink: 0 },
  regPicture: {
    width: '100%',
    height: '160px',
    borderRadius: '10px',
    overflow: 'hidden',
    backgroundColor: '#d0cdc5',
    position: 'relative',
    cursor: 'pointer',
    flexShrink: 0,
  },
  regPictureImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  picOverlayHint: {
    position: 'absolute',
    bottom: '6px',
    right: '8px',
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#fff',
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '10px',
    fontFamily: 'Georgia, serif',
  },
  regSection: { borderTop: '1px solid rgba(245,240,232,0.15)', paddingTop: '10px', flexShrink: 0 },
  regSectionTitle: { color: '#f5f0e8', fontSize: '15px', fontWeight: 'bold', fontFamily: 'Georgia, serif', margin: '0 0 8px 0' },
  regSmallText: { color: 'rgba(245,240,232,0.8)', fontSize: '13px', fontFamily: 'Georgia, serif', margin: '2px 0' },
  categoryRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(245,240,232,0.1)', borderRadius: '8px',
    padding: '10px 14px', marginBottom: '6px', cursor: 'pointer',
  },
  categoryRowSelected: {
    backgroundColor: 'rgba(245,240,232,0.25)',
    border: '1px solid rgba(245,240,232,0.5)',
  },
  catName: { color: '#f5f0e8', fontSize: '13px', fontFamily: 'Georgia, serif', flex: 1 },
  catSlots: { color: 'rgba(245,240,232,0.7)', fontSize: '13px', fontFamily: 'Georgia, serif', marginRight: '16px' },
  catPrice: { color: '#f5f0e8', fontSize: '13px', fontFamily: 'Georgia, serif', fontWeight: 'bold' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' },
  summaryTotalRow: {
    display: 'flex', justifyContent: 'space-between',
    borderTop: '1px solid rgba(245,240,232,0.2)', paddingTop: '6px', marginTop: '4px',
  },
  paymentMethodsRow: { display: 'flex', gap: '12px', alignItems: 'flex-start' },
  paymentMethodBox: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  paymentVerticalDivider: { width: '1px', backgroundColor: 'rgba(245,240,232,0.2)', alignSelf: 'stretch' },
  gcashBtn: {
    backgroundColor: '#0078FF', color: '#fff', border: 'none', borderRadius: '8px',
    padding: '8px 12px', fontSize: '13px', fontFamily: 'Georgia, serif',
    cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px',
  },
  proofBtn: {
    color: '#f5f0e8', border: '1px solid rgba(245,240,232,0.3)', borderRadius: '8px',
    padding: '6px 10px', fontSize: '11px', fontFamily: 'Georgia, serif', cursor: 'pointer',
  },
  onsiteLabel: {
    color: 'rgba(245,240,232,0.5)', fontSize: '10px', fontFamily: 'Georgia, serif',
    margin: '6px 0 1px 0', textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  onsiteDetail: { color: 'rgba(245,240,232,0.75)', fontSize: '11px', fontFamily: 'Georgia, serif', margin: '2px 0' },
  warningText: { color: '#ffcccc', fontSize: '13px', fontFamily: 'Georgia, serif', textAlign: 'center', margin: 0 },
  confirmBtn: {
    backgroundColor: '#a82020', color: '#f5f0e8', border: 'none', borderRadius: '8px',
    padding: '14px', fontSize: '15px', fontWeight: 'bold', fontFamily: 'Georgia, serif',
    letterSpacing: '1px', width: '100%', marginTop: '4px',
  },
  qrOverlay: {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  qrViewer: {
    backgroundColor: '#fff', borderRadius: '16px', padding: '24px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
    maxWidth: '320px',
  },
  qrCloseBtn: {
    alignSelf: 'flex-end', background: 'none', border: 'none',
    fontSize: '20px', cursor: 'pointer', color: '#333',
  },
  qrImg: { width: '250px', height: '250px', objectFit: 'contain', borderRadius: '8px' },
  fullPicOverlay: {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1001,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  fullPicBox: {
    position: 'relative', maxWidth: '90vw', maxHeight: '90vh',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
  },
  fullPicCloseBtn: {
    alignSelf: 'flex-end', background: 'rgba(255,255,255,0.2)', border: 'none',
    color: '#fff', fontSize: '20px', borderRadius: '50%', width: '32px', height: '32px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  fullPicImg: {
    maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: '12px',
  },

  freeBanner: {
  backgroundColor: '#5a6e2a',
  borderRadius: '8px',
  padding: '12px 16px',
  textAlign: 'center',
  marginBottom: '8px',
},
freeBannerTitle: {
  color: '#f5f0e8',
  fontSize: '16px',
  fontWeight: 'bold',
  fontFamily: 'Georgia, serif',
  margin: '0 0 4px 0',
},
freeBannerSub: {
  color: 'rgba(245,240,232,0.7)',
  fontSize: '12px',
  fontFamily: 'Georgia, serif',
  margin: 0,
},
slotsBox: {
  backgroundColor: 'rgba(245,240,232,0.1)',
  borderRadius: '8px',
  padding: '10px 14px',
  textAlign: 'center',
  marginTop: '8px',
},
attachmentInstructions: {
  color: 'rgba(245,240,232,0.8)',
  fontSize: '12px',
  fontFamily: 'Georgia, serif',
  fontStyle: 'italic',
  margin: '0 0 10px 0',
},
linkRow: {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  marginBottom: '6px',
},
linkInput: {
  flex: 1,
  backgroundColor: '#f5f0e8',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '12px',
  outline: 'none',
  color: '#3d2b2b',
  fontFamily: 'Georgia, serif',
},
removeLinkBtn: {
  background: 'rgba(245,240,232,0.2)',
  border: 'none',
  color: '#f5f0e8',
  borderRadius: '50%',
  width: '24px',
  height: '24px',
  fontSize: '11px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
},
addLinkBtn: {
  backgroundColor: 'transparent',
  color: '#f5f0e8',
  border: '1px solid rgba(245,240,232,0.4)',
  borderRadius: '8px',
  padding: '6px 14px',
  fontSize: '12px',
  fontFamily: 'Georgia, serif',
  cursor: 'pointer',
  marginTop: '4px',
},
registeredBtn: {
  color: '#2ecc71',
  fontSize: '13px',
  fontFamily: 'Georgia, serif',
  textDecoration: 'underline',
  cursor: 'pointer',
},
};