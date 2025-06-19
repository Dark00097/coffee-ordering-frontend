import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { initSocket } from '../services/socket';
import {
  TableRestaurant,
  Schedule,
  Phone,
  CheckCircle,
  Pending,
  Cancel,
  Search,
  FilterList,
  Refresh,
  Dashboard,
  KeyboardArrowDown,
} from '@mui/icons-material';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

function StaffTableReservations() {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    mainWrapper: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '24px 16px',
      '@media (min-width: 640px)': { padding: '32px 24px' },
    },
    header: { marginBottom: '32px' },
    headerContent: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      '@media (min-width: 768px)': {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
    iconContainer: {
      width: '56px',
      height: '56px',
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    titleSection: { display: 'flex', flexDirection: 'column' },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#0f172a',
      margin: 0,
      lineHeight: '1.2',
      '@media (min-width: 768px)': { fontSize: '32px' },
    },
    subtitle: {
      color: '#64748b',
      fontSize: '16px',
      margin: '4px 0 0 0',
      fontWeight: '400',
    },
    refreshButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 20px',
      backgroundColor: '#1e293b',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      minWidth: '120px',
      height: '44px',
      justifyContent: 'center',
    },
    refreshButtonHover: {
      backgroundColor: '#334155',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(30, 41, 59, 0.3)',
    },
    refreshButtonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
      transform: 'none',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '16px',
      marginBottom: '32px',
      '@media (min-width: 640px)': { gridTemplateColumns: 'repeat(2, 1fr)' },
      '@media (min-width: 1024px)': { gridTemplateColumns: 'repeat(4, 1fr)' },
    },
    statCard: {
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease',
    },
    statCardHover: {
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      transform: 'translateY(-2px)',
    },
    statContent: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    statInfo: { display: 'flex', flexDirection: 'column' },
    statLabel: {
      color: '#64748b',
      fontSize: '14px',
      fontWeight: '500',
      marginBottom: '8px',
    },
    statValue: { fontSize: '28px', fontWeight: '700', lineHeight: '1' },
    filtersCard: {
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      marginBottom: '32px',
    },
    filtersContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      '@media (min-width: 768px)': { flexDirection: 'row', alignItems: 'center' },
    },
    searchContainer: { position: 'relative', flex: '1' },
    searchInput: {
      width: '100%',
      paddingLeft: '44px',
      paddingRight: '16px',
      paddingTop: '12px',
      paddingBottom: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      transition: 'all 0.2s ease',
      backgroundColor: '#f9fafb',
    },
    searchInputFocus: {
      outline: 'none',
      borderColor: '#1e293b',
      boxShadow: '0 0 0 3px rgba(30, 41, 59, 0.1)',
      backgroundColor: 'white',
    },
    searchIcon: {
      position: 'absolute',
      left: '14px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#9ca3af',
      fontSize: '20px',
    },
    filterContainer: { display: 'flex', alignItems: 'center', gap: '12px' },
    selectWrapper: { position: 'relative' },
    select: {
      padding: '12px 40px 12px 16px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      backgroundColor: '#f9fafb',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      appearance: 'none',
      minWidth: '140px',
      transition: 'all 0.2s ease',
    },
    selectFocus: {
      outline: 'none',
      borderColor: '#1e293b',
      boxShadow: '0 0 0 3px rgba(30, 41, 59, 0.1)',
      backgroundColor: 'white',
    },
    selectIcon: {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#6b7280',
      pointerEvents: 'none',
    },
    emptyState: {
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      padding: '64px 24px',
      textAlign: 'center',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    },
    emptyIcon: { fontSize: '80px', color: '#e5e7eb', marginBottom: '16px' },
    emptyTitle: { fontSize: '20px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' },
    emptyDescription: { color: '#64748b', fontSize: '16px', lineHeight: '1.5' },
    tableContainer: {
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      display: 'none',
      '@media (min-width: 1024px)': { display: 'block' },
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    tableHeader: { backgroundColor: '#f8fafc' },
    tableHeaderCell: {
      padding: '16px 24px',
      textAlign: 'left',
      fontSize: '12px',
      fontWeight: '600',
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      borderBottom: '1px solid #e2e8f0',
    },
    tableRow: { transition: 'background-color 0.2s ease', cursor: 'default' },
    tableRowHover: { backgroundColor: '#f8fafc' },
    tableCell: { padding: '20px 24px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' },
    tableCellContent: { display: 'flex', alignItems: 'center', gap: '8px' },
    reservationId: { fontSize: '14px', fontWeight: '600', color: '#0f172a' },
    tableNumber: { fontSize: '14px', fontWeight: '500', color: '#0f172a' },
    dateTime: { fontSize: '14px', color: '#0f172a' },
    dateTimeSecondary: { fontSize: '12px', color: '#64748b', marginTop: '2px' },
    phoneNumber: { fontSize: '14px', color: '#0f172a' },
    statusBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    statusConfirmed: { backgroundColor: '#dcfce7', color: '#166534' },
    statusPending: { backgroundColor: '#fef3c7', color: '#92400e' },
    statusCancelled: { backgroundColor: '#fee2e2', color: '#dc2626' },
    statusDefault: { backgroundColor: '#f3f4f6', color: '#374151' },
    mobileCards: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      '@media (min-width: 1024px)': { display: 'none' },
    },
    mobileCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      padding: '20px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease',
    },
    mobileCardHover: {
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      transform: 'translateY(-1px)',
    },
    mobileCardHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '16px',
    },
    mobileCardId: { fontSize: '18px', fontWeight: '600', color: '#0f172a' },
    mobileCardBody: { display: 'flex', flexDirection: 'column', gap: '12px' },
    mobileCardRow: { display: 'flex', alignItems: 'center', gap: '12px' },
    mobileCardLabel: { fontSize: '14px', fontWeight: '500', color: '#0f172a' },
    mobileCardValue: { fontSize: '14px', color: '#64748b' },
    loadingContainer: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
    spinner: {
      width: '48px',
      height: '48px',
      border: '3px solid #e2e8f0',
      borderTop: '3px solid #1e293b',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    loadingText: { color: '#64748b', fontSize: '16px', fontWeight: '500' },
  };

  const cssKeyframes = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerText = cssKeyframes;
    document.head.appendChild(styleSheet);

    return () => document.head.removeChild(styleSheet);
  }, []);

  useEffect(() => {
    async function initialize() {
      try {
        setIsLoading(true);
        // Check authentication
        const authRes = await api.get('/check-auth');
        if (!authRes.data || authRes.data.role !== 'server') {
          toast.error('Staff access required');
          navigate('/login');
          return;
        }
        setUser(authRes.data);

        // Fetch reservations
        const response = await api.get('/reservations');
        const sortedReservations = (response.data || []).sort((a, b) => b.id - a.id);
        setReservations(sortedReservations);
        setFilteredReservations(sortedReservations);

        // Initialize Socket.IO
        const socketCleanup = initSocket(
          () => {}, // newOrder
          () => {}, // orderUpdate
          (data) => {
            toast.info(`Table ${data.table_id} status updated to ${data.status}`);
          }, // tableStatusUpdate
          (reservation) => {
            setReservations((prev) => {
              const updated = [
                reservation,
                ...prev.filter((r) => r.id !== reservation.id),
              ].sort((a, b) => b.id - a.id);
              setFilteredReservations(updated);
              return updated;
            });
            toast.success(
              `New reservation #${reservation.id} received for table ${reservation.table_number}`
            );
          }, // reservationUpdate
          () => {} // ratingUpdate
        );

        return () => {
          if (typeof socketCleanup === 'function') {
            socketCleanup();
          }
        };
      } catch (err) {
        console.error('Initialization failed:', err);
        toast.error(err.response?.data?.error || 'Failed to load data');
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, [navigate]);

  useEffect(() => {
    let filtered = reservations;

    if (searchTerm) {
      filtered = filtered.filter(
        (reservation) =>
          reservation.id.toString().includes(searchTerm) ||
          reservation.table_number.toString().includes(searchTerm) ||
          reservation.phone_number.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (reservation) => reservation.status.toLowerCase() === statusFilter
      );
    }

    setFilteredReservations(filtered);
  }, [searchTerm, statusFilter, reservations]);

  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      setIsLoading(true);
      await api.put(`/reservations/${reservationId}`, {
        status: newStatus,
        user_id: user.id,
      });
      setReservations((prev) =>
        prev.map((reservation) =>
          reservation.id === reservationId
            ? { ...reservation, status: newStatus }
            : reservation
        )
      );
      setFilteredReservations((prev) =>
        prev.map((reservation) =>
          reservation.id === reservationId
            ? { ...reservation, status: newStatus }
            : reservation
        )
      );
      toast.success(`Reservation #${reservationId} updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating reservation:', error);
      toast.error(
        error.response?.data?.errors?.[0]?.msg ||
          error.response?.data?.error ||
          'Failed to update reservation'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const refreshReservations = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/reservations');
      const sortedReservations = (response.data || []).sort((a, b) => b.id - a.id);
      setReservations(sortedReservations);
      setFilteredReservations(sortedReservations);
      toast.success('Reservations refreshed');
    } catch (error) {
      console.error('Error refreshing reservations:', error);
      toast.error('Failed to refresh reservations');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle style={{ fontSize: '16px' }} />;
      case 'pending':
        return <Pending style={{ fontSize: '16px' }} />;
      case 'cancelled':
        return <Cancel style={{ fontSize: '16px' }} />;
      default:
        return <Pending style={{ fontSize: '16px' }} />;
    }
  };

  const getStatusBadgeStyle = (status) => {
    const baseStyle = styles.statusBadge;
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return { ...baseStyle, ...styles.statusConfirmed };
      case 'pending':
        return { ...baseStyle, ...styles.statusPending };
      case 'cancelled':
        return { ...baseStyle, ...styles.statusCancelled };
      default:
        return { ...baseStyle, ...styles.statusDefault };
    }
  };

  if (isLoading || !user) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingContent}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading reservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.mainWrapper}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerLeft}>
              <div style={styles.iconContainer}>
                <Dashboard style={{ color: 'white', fontSize: '28px' }} />
              </div>
              <div style={styles.titleSection}>
                <h1 style={styles.title}>Staff Table Reservations</h1>
                <p style={styles.subtitle}>View and manage reservation statuses</p>
              </div>
            </div>
            <button
              onClick={refreshReservations}
              disabled={isLoading}
              style={{
                ...styles.refreshButton,
                ...(isLoading ? styles.refreshButtonDisabled : {}),
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  Object.assign(e.target.style, styles.refreshButtonHover);
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  Object.assign(e.target.style, styles.refreshButton);
                }
              }}
            >
              <Refresh
                style={{
                  fontSize: '18px',
                  ...(isLoading ? { animation: 'spin 1s linear infinite' } : {}),
                }}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div
            style={styles.statCard}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.statCardHover)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.statCard)}
          >
            <div style={styles.statContent}>
              <div style={styles.statInfo}>
                <div style={styles.statLabel}>Total Reservations</div>
                <div style={{ ...styles.statValue, color: '#0f172a' }}>
                  {reservations.length}
                </div>
              </div>
              <TableRestaurant style={{ color: '#64748b', fontSize: '32px' }} />
            </div>
          </div>
          <div
            style={styles.statCard}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.statCardHover)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.statCard)}
          >
            <div style={styles.statContent}>
              <div style={styles.statInfo}>
                <div style={styles.statLabel}>Confirmed</div>
                <div style={{ ...styles.statValue, color: '#059669' }}>
                  {reservations.filter((r) => r.status?.toLowerCase() === 'confirmed').length}
                </div>
              </div>
              <CheckCircle style={{ color: '#059669', fontSize: '32px' }} />
            </div>
          </div>
          <div
            style={styles.statCard}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.statCardHover)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.statCard)}
          >
            <div style={styles.statContent}>
              <div style={styles.statInfo}>
                <div style={styles.statLabel}>Pending</div>
                <div style={{ ...styles.statValue, color: '#d97706' }}>
                  {reservations.filter((r) => r.status?.toLowerCase() === 'pending').length}
                </div>
              </div>
              <Pending style={{ color: '#d97706', fontSize: '32px' }} />
            </div>
          </div>
          <div
            style={styles.statCard}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.statCardHover)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.statCard)}
          >
            <div style={styles.statContent}>
              <div style={styles.statInfo}>
                <div style={styles.statLabel}>Cancelled</div>
                <div style={{ ...styles.statValue, color: '#dc2626' }}>
                  {reservations.filter((r) => r.status?.toLowerCase() === 'cancelled').length}
                </div>
              </div>
              <Cancel style={{ color: '#dc2626', fontSize: '32px' }} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={styles.filtersCard}>
          <div style={styles.filtersContainer}>
            <div style={styles.searchContainer}>
              <Search style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by ID, table number, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
                onFocus={(e) => Object.assign(e.target.style, styles.searchInputFocus)}
                onBlur={(e) => Object.assign(e.target.style, styles.searchInput)}
              />
            </div>
            <div style={styles.filterContainer}>
              <FilterList style={{ color: '#6b7280', fontSize: '20px' }} />
              <div style={styles.selectWrapper}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={styles.select}
                  onFocus={(e) => Object.assign(e.target.style, styles.selectFocus)}
                  onBlur={(e) => Object.assign(e.target.style, styles.select)}
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <KeyboardArrowDown style={styles.selectIcon} />
              </div>
            </div>
          </div>
        </div>

        {/* Reservations Content */}
        {filteredReservations.length === 0 ? (
          <div style={styles.emptyState}>
            <TableRestaurant style={styles.emptyIcon} />
            <h3 style={styles.emptyTitle}>No reservations found</h3>
            <p style={styles.emptyDescription}>
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Reservations will appear here once customers make bookings.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead style={styles.tableHeader}>
                  <tr>
                    <th style={styles.tableHeaderCell}>Reservation</th>
                    <th style={styles.tableHeaderCell}>Table</th>
                    <th style={styles.tableHeaderCell}>Date & Time</th>
                    <th style={styles.tableHeaderCell}>Contact</th>
                    <th style={styles.tableHeaderCell}>Status</th>
                    <th style={styles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((reservation) => (
                    <tr
                      key={reservation.id}
                      style={styles.tableRow}
                      onMouseEnter={(e) =>
                        Object.assign(e.currentTarget.style, styles.tableRowHover)
                      }
                      onMouseLeave={(e) =>
                        Object.assign(e.currentTarget.style, styles.tableRow)
                      }
                    >
                      <td style={styles.tableCell}>
                        <div style={styles.reservationId}>#{reservation.id}</div>
                      </td>
                      <td style={styles.tableCell}>
                        <div style={styles.tableCellContent}>
                          <TableRestaurant style={{ color: '#9ca3af', fontSize: '18px' }} />
                          <span style={styles.tableNumber}>
                            Table {reservation.table_number}
                          </span>
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        <div style={styles.tableCellContent}>
                          <Schedule style={{ color: '#9ca3af', fontSize: '18px' }} />
                          <div>
                            <div style={styles.dateTime}>
                              {new Date(reservation.reservation_time).toLocaleDateString()}
                            </div>
                            <div style={styles.dateTimeSecondary}>
                              {new Date(reservation.reservation_time).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        <div style={styles.tableCellContent}>
                          <Phone style={{ color: '#9ca3af', fontSize: '18px' }} />
                          <span style={styles.phoneNumber}>{reservation.phone_number}</span>
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={getStatusBadgeStyle(reservation.status)}>
                          {getStatusIcon(reservation.status)}
                          {reservation.status || 'Pending'}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        <FormControl variant="outlined" size="small">
                          <InputLabel>Status</InputLabel>
                          <Select
                            value={reservation.status || 'pending'}
                            onChange={(e) =>
                              handleStatusChange(reservation.id, e.target.value)
                            }
                            label="Status"
                            disabled={isLoading}
                          >
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="confirmed">Confirmed</MenuItem>
                            <MenuItem value="cancelled">Cancelled</MenuItem>
                          </Select>
                        </FormControl>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div style={styles.mobileCards}>
              {filteredReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  style={styles.mobileCard}
                  onMouseEnter={(e) =>
                    Object.assign(e.currentTarget.style, styles.mobileCardHover)
                  }
                  onMouseLeave={(e) =>
                    Object.assign(e.currentTarget.style, styles.mobileCard)
                  }
                >
                  <div style={styles.mobileCardHeader}>
                    <div style={styles.mobileCardId}>#{reservation.id}</div>
                    <span style={getStatusBadgeStyle(reservation.status)}>
                      {getStatusIcon(reservation.status)}
                      {reservation.status || 'Pending'}
                    </span>
                  </div>
                  <div style={styles.mobileCardBody}>
                    <div style={styles.mobileCardRow}>
                      <TableRestaurant style={{ color: '#9ca3af', fontSize: '20px' }} />
                      <span style={styles.mobileCardLabel}>
                        Table {reservation.table_number}
                      </span>
                    </div>
                    <div style={styles.mobileCardRow}>
                      <Schedule style={{ color: '#9ca3af', fontSize: '20px' }} />
                      <div>
                        <div style={styles.mobileCardLabel}>
                          {new Date(reservation.reservation_time).toLocaleDateString()}
                        </div>
                        <div style={styles.mobileCardValue}>
                          {new Date(reservation.reservation_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                    <div style={styles.mobileCardRow}>
                      <Phone style={{ color: '#9ca3af', fontSize: '20px' }} />
                      <span style={styles.mobileCardLabel}>{reservation.phone_number}</span>
                    </div>
                    <div style={styles.mobileCardRow}>
                      <FormControl variant="outlined" size="small" fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={reservation.status || 'pending'}
                          onChange={(e) =>
                            handleStatusChange(reservation.id, e.target.value)
                          }
                          label="Status"
                          disabled={isLoading}
                        >
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="confirmed">Confirmed</MenuItem>
                          <MenuItem value="cancelled">Cancelled</MenuItem>
                        </Select>
                      </FormControl>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default StaffTableReservations;