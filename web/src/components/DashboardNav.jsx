import { useState } from 'react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DEPARTMENTS = [
  'All Departments',
  'College of Engineering and Architecture',
  'College of Management, Business and Accountancy',
  'College of Arts, Sciences and Education',
  'College of Nursing and Allied Health Sciences',
  'College of Computer Studies',
  'College of Criminal Justice',
];

export default function DashboardNav({ role, activePage, onPageChange }) {
  const [monthOpen, setMonthOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('Month');
  const [selectedDept, setSelectedDept] = useState('Department');

  return (
    <div style={styles.navWrap}>

      {/* Participant buttons */}
      {role === 'Participant' && (
        <>
          <button
            style={{ ...styles.navBtn, ...(activePage === 'home' ? styles.navBtnActive : {}) }}
            onClick={() => onPageChange('home')}>
            Home
          </button>
          <button
            style={{ ...styles.navBtn, ...(activePage === 'myevents' ? styles.navBtnActive : {}) }}
            onClick={() => onPageChange('myevents')}>
            My Events
          </button>
        </>
      )}

      {/* Organizer buttons */}
      {role === 'Organization' && (
        <button
          style={{ ...styles.navBtn, ...styles.navBtnAdd }}
          onClick={() => onPageChange('addevent')}>
          + Add Event
        </button>
      )}

      {/* Archive — both */}
      <button
        style={{ ...styles.navBtn, ...(activePage === 'archive' ? styles.navBtnActive : {}) }}
        onClick={() => onPageChange('archive')}>
        <span style={styles.icon}>⬇</span> Archive
      </button>

      {/* Month filter */}
      <div style={styles.dropdownWrap}>
        <button
          style={styles.navBtn}
          onClick={() => { setMonthOpen(!monthOpen); setDeptOpen(false); }}>
          <span style={styles.icon}>▽</span>
          {selectedMonth} ◀
        </button>
        {monthOpen && (
          <div style={styles.dropdown}>
            {MONTHS.map(m => (
              <div key={m} style={styles.dropdownItem}
                onClick={() => { setSelectedMonth(m); setMonthOpen(false); }}>
                {m}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Department filter */}
      <div style={styles.dropdownWrap}>
        <button
          style={styles.navBtn}
          onClick={() => { setDeptOpen(!deptOpen); setMonthOpen(false); }}>
          <span style={styles.icon}>▽</span>
          {selectedDept} ◀
        </button>
        {deptOpen && (
          <div style={styles.dropdown}>
            {DEPARTMENTS.map(d => (
              <div key={d} style={styles.dropdownItem}
                onClick={() => { setSelectedDept(d); setDeptOpen(false); }}>
                {d}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

const styles = {
  navWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '32px',
  },
  navBtn: {
    backgroundColor: '#6b1a1a',
    color: '#f5f0e8',
    border: 'none',
    borderRadius: '20px',
    padding: '10px 22px',
    fontSize: '14px',
    fontFamily: 'Georgia, serif',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'opacity 0.2s',
  },
  navBtnActive: {
    outline: '2px solid #f5f0e8',
    outlineOffset: '2px',
  },
  navBtnAdd: {
    fontWeight: 'bold',
  },
  icon: {
    fontSize: '13px',
  },
  dropdownWrap: {
    position: 'relative',
  },
  dropdown: {
    position: 'absolute',
    top: '110%',
    left: 0,
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
    zIndex: 200,
    minWidth: '220px',
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: '10px 16px',
    fontSize: '13px',
    color: '#3d2b2b',
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
    transition: 'background 0.15s',
  },
};