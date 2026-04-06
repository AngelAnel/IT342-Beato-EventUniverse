import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DashboardNav from '../components/DashboardNav';

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [activePage, setActivePage] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');

  const handlePageChange = (page) => {
    if (page === 'addevent') {
      navigate('/organizer/add-event');
      return;
    }
    setActivePage(page);
  };

  const renderContent = () => {
    switch (activePage) {
      case 'home':
        return <p style={styles.emptyText}>There are currently no Events Posted</p>;
      case 'archive':
        return <p style={styles.emptyText}>No archived events yet</p>;
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
        <DashboardNav
          role="Organization"
          activePage={activePage}
          onPageChange={handlePageChange}
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
  emptyText: {
    fontSize: '22px',
    color: '#b0a090',
    fontFamily: 'Georgia, serif',
    marginTop: '16px',
  },
};