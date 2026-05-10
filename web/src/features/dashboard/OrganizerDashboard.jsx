import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar';
import DashboardNav from '../shared/DashboardNav';
import defaultEventImg from '../shared/assets/default-event.png';
import { getMyEvents, getMyArchivedEvents, getEventRegistrations, confirmRegistration } from '../auth/auth';

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

function getFullDepartmentDisplay(departments) {
  if (!departments) return 'Open for all';
  const depts = departments.split('|').map(d => d.trim());
  if (depts.length === 6) return 'Open for all';
  return depts.join(', ');
}

function getPaymentDisplay(event) {
  if (!event.categoriesEnabled) return 'Free';
  try {
    const cats = JSON.parse(event.categories || '[]');
    if (cats.length === 0) return 'Free';
    if (cats.length === 1) return `P ${cats[0].price}`;
    return 'Varies';
  } catch {
    return 'Free';
  }
}

function getPriceDisplay(event) {
  if (!event.categoriesEnabled) return { type: 'single', value: 'Free' };
  try {
    const cats = JSON.parse(event.categories || '[]');
    if (cats.length === 0) return { type: 'single', value: 'Free' };
    if (cats.length === 1) return { type: 'single', value: `P ${cats[0].price}` };
    return { type: 'multiple', value: cats };
  } catch {
    return { type: 'single', value: 'Free' };
  }
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

function applyFilters(events, selectedMonth, selectedDept, searchQuery) {
  return events.filter(event => {
    if (selectedMonth && selectedMonth !== 'Month') {
      const eventMonth = MONTHS[new Date(event.eventDateTime).getMonth()];
      if (eventMonth !== selectedMonth) return false;
    }
    if (selectedDept && selectedDept !== 'Department' && selectedDept !== 'All Departments') {
      const depts = (event.departments || '').split('|').map(d => d.trim());
      if (!depts.includes(selectedDept)) return false;
    }
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchesName = event.eventName?.toLowerCase().includes(q);
      const matchesVenue = event.venue?.toLowerCase().includes(q);
      const matchesDept = event.departments?.toLowerCase().includes(q);
      if (!matchesName && !matchesVenue && !matchesDept) return false;
    }
    return true;
  });
}

function EventCard({ event, onViewDetails }) {
  const status = event.status;
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
          <span style={{
            ...styles.statusBadge,
            backgroundColor: status === 'ONGOING' ? '#2ecc71' : '#e74c3c',
          }}>
            {status}
          </span>
        </div>
        <div style={styles.cardDetails}>
          {paymentDisplay !== 'Free' ? (
            <span>{paymentDisplay} • {deptDisplay}{paymentMethods ? ` • ${paymentMethods}` : ''}</span>
          ) : (
            <span>Free • {deptDisplay}</span>
          )}
        </div>
        <div style={styles.cardBottom}>
          <span style={styles.cardMeta}>{event.venue} &nbsp; {formatDateTime(event.eventDateTime)}</span>
          <span style={styles.viewDetails} onClick={onViewDetails}>View Details</span>
        </div>
      </div>
    </div>
  );
}

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  const [activePage, setActivePage] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [archivedEvents, setArchivedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('Month');
  const [selectedDept, setSelectedDept] = useState('Department');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventRegistrations, setEventRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await getMyEvents(token);
      if (res.data.success) setEvents(res.data.data);
      const archRes = await getMyArchivedEvents(token);
      if (archRes.data.success) setArchivedEvents(archRes.data.data);
    } catch (err) {
      console.error('Failed to fetch events', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = ({ month, dept }) => {
    setSelectedMonth(month);
    setSelectedDept(dept);
  };

  const handlePageChange = (page) => {
    if (page === 'addevent') {
      navigate('/organizer/add-event');
      return;
    }
    setActivePage(page);
  };

  const fetchRegistrations = async (eventId) => {
    setLoadingRegistrations(true);
    try {
      const res = await getEventRegistrations(eventId, token);
      if (res.data.success) setEventRegistrations(res.data.data);
    } catch (err) {
      console.error('Failed to fetch registrations', err);
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const renderContent = () => {
    const activeEvents = applyFilters(events, selectedMonth, selectedDept, searchQuery);
    const filteredArchived = applyFilters(archivedEvents, selectedMonth, selectedDept, searchQuery);

    switch (activePage) {
      case 'home':
        if (loading) return <p style={styles.emptyText}>Loading events...</p>;
        if (activeEvents.length === 0) return <p style={styles.emptyText}>No events found for the selected filter.</p>;
        return (
          <div style={styles.eventsGrid}>
            {activeEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onViewDetails={() => {
                  setSelectedEvent(event);
                  fetchRegistrations(event.id);
                }}
              />
            ))}
          </div>
        );
      case 'archive':
        if (loading) return <p style={styles.emptyText}>Loading...</p>;
        if (filteredArchived.length === 0) return <p style={styles.emptyText}>No archived events found.</p>;
        return (
          <div style={styles.eventsGrid}>
            {filteredArchived.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onViewDetails={() => {
                  setSelectedEvent(event);
                  fetchRegistrations(event.id);
                }}
              />
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  const priceInfo = selectedEvent ? getPriceDisplay(selectedEvent) : null;

  return (
    <div style={styles.page}>
      <Navbar
        onSearch={(q) => setSearchQuery(q)}
        onNotificationClick={(notif) => {
          const event = events.find(e => e.id === notif.eventId)
            || archivedEvents.find(e => e.id === notif.eventId);
          if (event) {
            setSelectedEvent(event);
            fetchRegistrations(event.id);
          }
        }}
      />
      <div style={styles.body}>
        {activePage === 'home' && (
          <h1 style={styles.welcome}>Hello there, {user?.firstName}! Welcome Back</h1>
        )}
        {activePage === 'archive' && (
          <div style={styles.archiveTitleRow}>
            <button style={styles.backBtn} onClick={() => setActivePage('home')}>&#8249;</button>
            <h1 style={styles.archiveTitle}>Archives</h1>
          </div>
        )}
        <DashboardNav
          role="Organization"
          activePage={activePage}
          onPageChange={handlePageChange}
          onFilterChange={handleFilterChange}
        />
        {renderContent()}
      </div>

      {/* View Details Modal */}
      {selectedEvent && (
        <div style={styles.modalOverlay} onClick={() => setSelectedEvent(null)}>
          <div style={styles.detailsModal} onClick={(e) => e.stopPropagation()}>

            <div style={styles.detailsHeader}>
              <span style={styles.detailsHeaderTitle}>EVENT DETAILS</span>
              <button style={styles.detailsCloseBtn} onClick={() => setSelectedEvent(null)}>✕</button>
            </div>

            <div style={styles.detailsPicture}>
              <img src={selectedEvent.picture || defaultEventImg} alt={selectedEvent.eventName} style={styles.detailsPictureImg} />
            </div>

            <div style={styles.detailsTitleRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
                <span style={styles.detailsEventName}>{selectedEvent.eventName}</span>
                {priceInfo.type === 'single' && (
                  <span style={styles.detailsPrice}>{priceInfo.value}</span>
                )}
              </div>
              <button
                style={styles.editBtn}
                onClick={() => {
                  setSelectedEvent(null);
                  navigate('/organizer/edit-event', { state: { event: selectedEvent } });
                }}
              >
                Edit Event Details
              </button>
            </div>

            <div style={styles.detailsBody}>
              <div style={styles.detailsLeft}>
                <p style={styles.detailsLine}>
                  <span style={styles.detailsLabel}>Status: </span>
                  <span style={{
                    ...styles.statusBadgeInline,
                    backgroundColor: selectedEvent.status === 'ONGOING' ? '#2ecc71' : '#e74c3c',
                  }}>{selectedEvent.status}</span>
                </p>
                <p style={styles.detailsLine}>
                  <span style={styles.detailsLabel}>Specifics: </span>
                  {getFullDepartmentDisplay(selectedEvent.departments)}
                </p>
                {(selectedEvent.gcashEnabled || selectedEvent.onsiteEnabled) && (
                  <p style={styles.detailsLine}>
                    <span style={styles.detailsLabel}>Modes of Payment: </span>
                    {getPaymentMethods(selectedEvent)}
                  </p>
                )}
                <p style={styles.detailsLine}>
                  <span style={styles.detailsLabel}>Event Location: </span>
                  {selectedEvent.venue}
                </p>
                <p style={styles.detailsLine}>
                  <span style={styles.detailsLabel}>Event Date: </span>
                  {formatDateTime(selectedEvent.eventDateTime)}
                </p>
              </div>

              {priceInfo.type === 'multiple' && (
                <div style={styles.detailsRight}>
                  <p style={styles.detailsLabel}>Rates:</p>
                  {priceInfo.value.map((cat, i) => (
                    <p key={i} style={styles.rateItem}>P {cat.price} - {cat.name}</p>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.participantsSection}>
              <h3 style={styles.participantsTitle}>
                Participants ({loadingRegistrations ? '...' : eventRegistrations.length})
              </h3>
              {loadingRegistrations ? (
                <p style={styles.noParticipants}>Loading participants...</p>
              ) : eventRegistrations.length === 0 ? (
                <p style={styles.noParticipants}>No participants yet.</p>
              ) : (
                eventRegistrations.map((reg, index) => (
                  <div key={index} style={styles.participantRow}>
                    <span style={styles.participantName}>{reg.participantName}</span>
                    <div style={styles.participantBtns}>
                      <button
                        style={{
                          ...styles.statusBtn,
                          backgroundColor: reg.status === 'Confirmed' ? '#2ecc71' : '#b0a090',
                          cursor: reg.status === 'Confirmed' ? 'default' : 'pointer',
                        }}
                        onClick={async () => {
                          if (reg.status === 'Confirmed') return;
                          try {
                            const res = await confirmRegistration(reg.id, token);
                            if (res.data.success) {
                              setEventRegistrations(prev =>
                                prev.map(r => r.id === reg.id ? { ...r, status: 'Confirmed' } : r)
                              );
                            }
                          } catch (err) {
                            console.error('Failed to confirm', err);
                          }
                        }}
                      >
                        {reg.status === 'Confirmed' ? 'Confirmed' : 'Pending'}
                      </button>
                      <button
                        style={styles.viewDetailsSmallBtn}
                        onClick={() => setSelectedRegistration(reg)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

      {/* Registration Details Modal */}
      {selectedRegistration && (
        <div style={styles.modalOverlay} onClick={() => setSelectedRegistration(null)}>
          <div style={styles.regDetailsModal} onClick={e => e.stopPropagation()}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p style={{ color: '#f5f0e8', fontSize: '16px', fontWeight: 'bold', fontFamily: 'Georgia, serif', margin: 0, flex: 1 }}>
                {selectedRegistration.participantName.split(' ')[0]}'s Registration Details
              </p>
              <button style={{ background: 'none', border: 'none', color: '#f5f0e8', fontSize: '20px', cursor: 'pointer', flexShrink: 0 }}
                onClick={() => setSelectedRegistration(null)}>✕</button>
            </div>

            <p style={{ color: '#f5f0e8', fontSize: '14px', fontFamily: 'Georgia, serif', margin: 0 }}>
              <span style={{ fontWeight: 'bold' }}>Name: </span>{selectedRegistration.participantName}
            </p>

            {/* Pax — only if category is not General */}
            {selectedRegistration.categoryName && selectedRegistration.categoryName !== 'General' && (
              <p style={{ color: '#f5f0e8', fontSize: '14px', fontFamily: 'Georgia, serif', margin: 0 }}>
                <span style={{ fontWeight: 'bold' }}>Pax: </span>1
              </p>
            )}

            {/* Event Type or Details */}
            {selectedRegistration.categoryName === 'General' && (!selectedRegistration.links || selectedRegistration.links.trim() === '') ? (
              <p style={{ color: '#f5f0e8', fontSize: '14px', fontFamily: 'Georgia, serif', margin: 0 }}>
                <span style={{ fontWeight: 'bold' }}>Event Type: </span>Free
              </p>
            ) : selectedRegistration.categoryName !== 'General' ? (
              <div>
                <p style={{ color: '#f5f0e8', fontSize: '14px', fontFamily: 'Georgia, serif', margin: '0 0 4px 0', fontWeight: 'bold' }}>Details:</p>
                <p style={{ color: '#f5f0e8', fontSize: '13px', fontFamily: 'Georgia, serif', margin: '0 0 0 12px' }}>
                  1 {selectedRegistration.categoryName} — {selectedRegistration.categoryPrice === '0' ? 'Free' : `P ${selectedRegistration.categoryPrice}`}
                </p>
              </div>
            ) : null}

            {/* Links */}
            {selectedRegistration.links && selectedRegistration.links.trim() !== '' && (
              <div>
                <p style={{ color: '#f5f0e8', fontSize: '14px', fontFamily: 'Georgia, serif', margin: '0 0 4px 0', fontWeight: 'bold' }}>
                  {selectedRegistration.links.split(',').length > 1 ? 'Links:' : 'Link:'}
                </p>
                {selectedRegistration.links.split(',').map((link, i) => (
                  <a
                    key={i}
                    href={link.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#a8d8ea', fontSize: '12px', fontFamily: 'Georgia, serif', display: 'block', marginLeft: '12px', marginBottom: '4px', wordBreak: 'break-all' }}
                        >
                    {link.trim()}
                  </a>
                ))}
              </div>
            )}

            {/* Payment Method */}
            {selectedRegistration.paymentMethod && selectedRegistration.paymentMethod !== 'Not specified' && (
              <div>
                <p style={{ color: '#f5f0e8', fontSize: '14px', fontFamily: 'Georgia, serif', margin: '0 0 4px 0', fontWeight: 'bold' }}>
                  Chosen Mode of Payment:
                </p>
                <p style={{ color: '#f5f0e8', fontSize: '13px', fontFamily: 'Georgia, serif', margin: '0 0 0 12px' }}>
                  {selectedRegistration.paymentMethod}
                </p>
              </div>
            )}

            {/* Proof of Payment */}
            {selectedRegistration.proofOfPayment && (
              <div>
                <p style={{ color: '#f5f0e8', fontSize: '14px', fontFamily: 'Georgia, serif', margin: '0 0 8px 0', fontWeight: 'bold' }}>
                  Proof:
                </p>
                <img
                  src={selectedRegistration.proofOfPayment}
                  alt="Proof of Payment"
                  style={{ width: '100%', borderRadius: '8px', objectFit: 'contain' }}
                />
              </div>
            )}

            {/* Timestamp */}
            <div style={{ borderTop: '1px solid rgba(245,240,232,0.2)', paddingTop: '10px', marginTop: '4px' }}>
              <p style={{ color: 'rgba(245,240,232,0.6)', fontSize: '12px', fontFamily: 'Georgia, serif', margin: 0 }}>
                <span style={{ fontWeight: 'bold' }}>Timestamp: </span>
                {selectedRegistration.createdAt ? new Date(selectedRegistration.createdAt).toLocaleString('en-PH', {
                  year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                }) : 'N/A'}
              </p>
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
    gap: '24px', marginTop: '16px',
  },
  card: {
    backgroundColor: '#f5f0e8', borderRadius: '16px', overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid rgba(107,26,26,0.1)',
  },
  cardPicture: { width: '100%', height: '180px', overflow: 'hidden', backgroundColor: '#e8e3db' },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover' },
  cardInfo: { backgroundColor: '#6b1a1a', padding: '16px 20px' },
  cardTitleRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' },
  cardTitle: { color: '#f5f0e8', fontSize: '18px', fontWeight: 'bold', fontFamily: 'Georgia, serif' },
  statusBadge: {
    color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '3px 10px',
    borderRadius: '20px', fontFamily: 'Georgia, serif', letterSpacing: '0.5px',
  },
  statusBadgeInline: {
    color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '3px 10px',
    borderRadius: '20px', fontFamily: 'Georgia, serif', letterSpacing: '0.5px',
    display: 'inline-block', marginLeft: '4px',
  },
  cardDetails: { color: 'rgba(245,240,232,0.85)', fontSize: '13px', fontFamily: 'Georgia, serif', marginBottom: '8px' },
  cardBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardMeta: { color: 'rgba(245,240,232,0.75)', fontSize: '12px', fontFamily: 'Georgia, serif' },
  viewDetails: {
    color: '#f5f0e8', fontSize: '13px', fontFamily: 'Georgia, serif',
    textDecoration: 'underline', cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)',
    zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  detailsModal: {
    backgroundColor: '#6b1a1a', borderRadius: '16px', width: '680px',
    maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
    padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '16px',
  },
  regDetailsModal: {
    backgroundColor: '#6b1a1a', borderRadius: '16px', width: '360px',
    maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px',
  },
  detailsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  detailsHeaderTitle: {
    color: '#f5f0e8', fontSize: '20px', fontWeight: 'bold',
    fontFamily: 'Georgia, serif', letterSpacing: '2px',
  },
  detailsCloseBtn: { background: 'none', border: 'none', color: '#f5f0e8', fontSize: '22px', cursor: 'pointer' },
  detailsPicture: { width: '100%', height: '220px', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#d0cdc5' },
  detailsPictureImg: { width: '100%', height: '100%', objectFit: 'cover' },
  detailsTitleRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap', gap: '12px',
  },
  detailsEventName: { color: '#f5f0e8', fontSize: '22px', fontWeight: 'bold', fontFamily: 'Georgia, serif' },
  detailsPrice: { color: '#f5f0e8', fontSize: '18px', fontFamily: 'Georgia, serif' },
  editBtn: {
    backgroundColor: 'rgba(245,240,232,0.2)', color: '#f5f0e8',
    border: '1px solid rgba(245,240,232,0.4)', borderRadius: '8px',
    padding: '8px 16px', fontSize: '13px', fontFamily: 'Georgia, serif', cursor: 'pointer',
  },
  detailsBody: { display: 'flex', gap: '32px', flexWrap: 'wrap' },
  detailsLeft: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  detailsRight: { display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '140px' },
  detailsLine: { color: '#f5f0e8', fontSize: '14px', fontFamily: 'Georgia, serif', margin: 0 },
  detailsLabel: { fontWeight: 'bold', color: '#f5f0e8', fontFamily: 'Georgia, serif', fontSize: '14px' },
  rateItem: { color: '#f5f0e8', fontSize: '14px', fontFamily: 'Georgia, serif', margin: '2px 0' },
  participantsSection: { borderTop: '1px solid rgba(245,240,232,0.2)', paddingTop: '16px' },
  participantsTitle: { color: '#f5f0e8', fontSize: '18px', fontFamily: 'Georgia, serif', margin: '0 0 12px 0' },
  noParticipants: { color: 'rgba(245,240,232,0.5)', fontSize: '14px', fontFamily: 'Georgia, serif', margin: 0 },
  participantRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#f5f0e8', borderRadius: '8px', padding: '10px 16px', marginBottom: '8px',
  },
  participantName: { color: '#3d2b2b', fontSize: '14px', fontFamily: 'Georgia, serif', fontWeight: 'bold', flex: 1 },
  participantBtns: { display: 'flex', gap: '8px', alignItems: 'center' },
  statusBtn: {
    color: '#fff', border: 'none', borderRadius: '20px', padding: '4px 14px',
    fontSize: '12px', fontFamily: 'Georgia, serif', fontWeight: 'bold',
  },
  viewDetailsSmallBtn: {
    backgroundColor: 'rgba(107,26,26,0.15)', color: '#6b1a1a',
    border: '1px solid #6b1a1a', borderRadius: '20px', padding: '4px 14px',
    fontSize: '12px', fontFamily: 'Georgia, serif', cursor: 'pointer',
  },
};