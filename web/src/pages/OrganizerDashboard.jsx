import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DashboardNav from '../components/DashboardNav';
import { getMyEvents, getMyArchivedEvents } from '../api/auth';
import defaultEventImg from '../assets/default-event.png';

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
  } catch {
    return 'Free';
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

function EventCard({ event }) {
  const status = event.status;
  const paymentDisplay = getPaymentDisplay(event);
  const deptDisplay = getDepartmentDisplay(event.departments);
  const paymentMethods = getPaymentMethods(event);

  return (
    <div style={styles.card}>
      <div style={styles.cardPicture}>
        <img
          src={event.picture || defaultEventImg}
          alt={event.eventName}
          style={styles.cardImg}
        />
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
          <span style={styles.viewDetails}>View Details</span>
        </div>
      </div>
    </div>
  );
}

function applyFilters(events, selectedMonth, selectedDept) {
  return events.filter(event => {
    // Month filter
    if (selectedMonth && selectedMonth !== 'Month') {
      const eventMonth = MONTHS[new Date(event.eventDateTime).getMonth()];
      if (eventMonth !== selectedMonth) return false;
    }

    // Department filter
    if (selectedDept && selectedDept !== 'Department' && selectedDept !== 'All Departments') {
      const depts = (event.departments || '').split('|').map(d => d.trim());
      if (!depts.includes(selectedDept)) return false;
    }

    return true;
  });
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

  const renderContent = () => {
    const activeEvents = applyFilters(events, selectedMonth, selectedDept);
    const filteredArchived = applyFilters(archivedEvents, selectedMonth, selectedDept);

    switch (activePage) {
      case 'home':
        if (loading) return <p style={styles.emptyText}>Loading events...</p>;
        if (activeEvents.length === 0) return <p style={styles.emptyText}>No events found for the selected filter.</p>;
        return (
          <div style={styles.eventsGrid}>
            {activeEvents.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        );
      case 'archive':
        if (loading) return <p style={styles.emptyText}>Loading...</p>;
        if (filteredArchived.length === 0) return <p style={styles.emptyText}>No archived events found.</p>;
        return (
          <div style={styles.eventsGrid}>
            {filteredArchived.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={styles.page}>
      <Navbar onSearch={(q) => setSearchQuery(q)} />
      <div style={styles.body}>
        {activePage === 'home' && (
          <h1 style={styles.welcome}>
            Hello there, {user?.firstName}! Welcome Back
          </h1>
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
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f5f0e8' },
  body: { padding: '40px 48px' },
  welcome: {
    fontSize: '42px',
    fontWeight: 'bold',
    color: '#6b1a1a',
    fontFamily: 'Georgia, serif',
    marginBottom: '24px',
    lineHeight: '1.2',
  },
  archiveTitleRow: {
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
  archiveTitle: {
    fontSize: '42px',
    fontWeight: 'bold',
    color: '#6b1a1a',
    fontFamily: 'Georgia, serif',
    margin: 0,
  },
  emptyText: {
    fontSize: '22px',
    color: '#b0a090',
    fontFamily: 'Georgia, serif',
    marginTop: '16px',
  },
  eventsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
    gap: '24px',
    marginTop: '16px',
  },
  card: {
    backgroundColor: '#f5f0e8',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    border: '1px solid rgba(107,26,26,0.1)',
  },
  cardPicture: {
    width: '100%',
    height: '180px',
    overflow: 'hidden',
    backgroundColor: '#e8e3db',
  },
  cardImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cardInfo: {
    backgroundColor: '#6b1a1a',
    padding: '16px 20px',
  },
  cardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '6px',
    flexWrap: 'wrap',
  },
  cardTitle: {
    color: '#f5f0e8',
    fontSize: '18px',
    fontWeight: 'bold',
    fontFamily: 'Georgia, serif',
  },
  statusBadge: {
    color: '#fff',
    fontSize: '11px',
    fontWeight: 'bold',
    padding: '3px 10px',
    borderRadius: '20px',
    fontFamily: 'Georgia, serif',
    letterSpacing: '0.5px',
  },
  cardDetails: {
    color: 'rgba(245,240,232,0.85)',
    fontSize: '13px',
    fontFamily: 'Georgia, serif',
    marginBottom: '8px',
  },
  cardBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMeta: {
    color: 'rgba(245,240,232,0.75)',
    fontSize: '12px',
    fontFamily: 'Georgia, serif',
  },
  viewDetails: {
    color: '#f5f0e8',
    fontSize: '13px',
    fontFamily: 'Georgia, serif',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
};