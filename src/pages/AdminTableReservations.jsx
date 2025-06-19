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
  Add,
  Edit,
  Delete,
  Close,
} from '@mui/icons-material';

function AdminTableReservations() {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [formData, setFormData] = useState({
    table_id: '',
    reservation_time: '',
    phone_number: '',
    status: 'pending',
  });
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();

  const formatToMySQLDateTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\+\d{10,15}$/;
    return phoneRegex.test(phone);
  };

  const validateForm = (data) => {
    const errors = {};
    if (!data.table_id) errors.table_id = 'Table is required';
    if (!data.reservation_time) errors.reservation_time = 'Reservation time is required';
    else if (new Date(data.reservation_time) <= new Date())
      errors.reservation_time = 'Reservation time must be in the future';
    if (!data.phone_number) errors.phone_number = 'Phone number is required';
    else if (!validatePhoneNumber(data.phone_number))
      errors.phone_number = 'Phone number must be in international format (e.g., +1234567890)';
    if (!data.status) errors.status = 'Status is required';
    return errors;
  };

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
    button: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 20px',
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
    refreshButton: {
      backgroundColor: '#1e293b',
      color: 'white',
    },
    createButton: {
      backgroundColor: '#059669',
      color: 'white',
    },
    buttonHover: {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    },
    refreshButtonHover: { backgroundColor: '#334155' },
    createButtonHover: { backgroundColor: '#047857' },
    buttonDisabled: { opacity: 0.6, cursor: 'not-allowed', transform: 'none' },
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
    tableRow: { transition: 'background-color 0.2s ease', cursor: 'pointer' },
    tableRowHover: { backgroundColor: '#f8fafc' },
    tableCell: { padding: '20px 24px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' },
    tableCellContent: { display: 'flex', alignItems: 'center', gap: '8px' },
    reservationId: { fontSize: '14px', fontWeight: '600', color: '#0f172a' },
    tableNumber: { fontSize: '14px', fontWeight: '500', color: '#0f172a' },
    dateTime: { fontSize: '14px', color: '#0f172a' },
    dateTimeSecondary: { fontSize: '12px', color: '#64748b', marginTop: '2px' },
    phoneNumber: { fontSize: '14px', color: '#0f172a' },
    actionButtons: { display: 'flex', gap: '8px' },
    actionButton: {
      padding: '8px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    editButton: { backgroundColor: '#3b82f6', color: 'white' },
    deleteButton: { backgroundColor: '#dc2626', color: 'white' },
    actionButtonHover: { transform: 'translateY(-1px)' },
    editButtonHover: { backgroundColor: '#2563eb' },
    deleteButtonHover: { backgroundColor: '#b91c1c' },
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
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '500px',
      width: '90%',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      position: 'relative',
      maxHeight: '90vh',
      overflowY: 'auto',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    },
    modalTitle: { fontSize: '20px', fontWeight: '600', color: '#0f172a' },
    closeButton: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px' },
    modalBody: { display: 'flex', flexDirection: 'column', gap: '16px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '14px', fontWeight: '500', color: '#374151' },
    input: {
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      transition: 'all 0.2s ease',
    },
    inputError: { borderColor: '#dc2626' },
    select: {
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      cursor: 'pointer',
      backgroundColor: '#f9fafb',
    },
    errorText: { color: '#dc2626', fontSize: '12px', marginTop: '4px' },
    modalFooter: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' },
    submitButton: {
      backgroundColor: '#059669',
      color: 'white',
      padding: '12px 20px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    cancelButton: {
      backgroundColor: '#e5e7eb',
      color: '#374151',
      padding: '12px 20px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    submitButtonHover: { backgroundColor: '#047857' },
    cancelButtonHover: { backgroundColor: '#d1d5db' },
    submitButtonDisabled: { opacity: 0.6, cursor: 'not-allowed' },
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
        if (!authRes.data || authRes.data.role !== 'admin') {
          toast.error('Admin access required');
          navigate('/login');
          return;
        }
        setUser(authRes.data);

        // Fetch reservations
        const resResponse = await api.getReservations();
        setReservations(resResponse.data || []);

        // Fetch available tables
        const tableResponse = await api.getAvailableTables();
        setTables(tableResponse.data || []);

        // Initialize Socket.IO
        const socketCleanup = initSocket({
          onTableStatusUpdate: (data) => {
            setTables((prev) =>
              prev.map((table) =>
                table.id === data.table_id ? { ...table, status: data.status } : table
              )
            );
            toast.info(`Table ${data.table_id} status updated to ${data.status}`);
          },
          onReservationUpdate: (reservation) => {
            setReservations((prev) => {
              const updated = [
                reservation,
                ...prev.filter((r) => r.id !== reservation.id),
              ].sort((a, b) => b.id - a.id); // Sort by ID descending
              setFilteredReservations(updated);
              return updated;
            });
            toast.success(
              `Reservation #${reservation.id} updated for table ${reservation.table_number}`
            );
          },
        });

        return () => socketCleanup();
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

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    const errors = validateForm(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setIsLoading(true);
      const formattedData = {
        ...formData,
        reservation_time: formatToMySQLDateTime(formData.reservation_time),
        user_id: user.id,
      };
      await api.addReservation(formattedData);
      toast.success('Reservation created successfully');
      setShowCreateModal(false);
      setFormData({
        table_id: '',
        reservation_time: '',
        phone_number: '',
        status: 'pending',
      });
      const response = await api.getReservations();
      setReservations(response.data || []);
    } catch (err) {
      console.error('Error creating reservation:', err);
      toast.error(
        err.response?.data?.errors?.[0]?.msg ||
          err.response?.data?.error ||
          'Failed to create reservation'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditReservation = async (e) => {
    e.preventDefault();
    const errors = validateForm(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setIsLoading(true);
      const formattedData = {
        ...formData,
        reservation_time: formatToMySQLDateTime(formData.reservation_time),
        user_id: user.id,
      };
      await api.updateReservation(selectedReservation.id, formattedData);
      toast.success('Reservation updated successfully');
      setShowEditModal(false);
      setSelectedReservation(null);
      setFormData({
        table_id: '',
        reservation_time: '',
        phone_number: '',
        status: 'pending',
      });
      const response = await api.getReservations();
      setReservations(response.data || []);
    } catch (err) {
      console.error('Error updating reservation:', err);
      toast.error(
        err.response?.data?.errors?.[0]?.msg ||
          err.response?.data?.error ||
          'Failed to update reservation'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReservation = async (reservationId) => {
    if (!window.confirm('Are you sure you want to delete this reservation?')) return;

    try {
      setIsLoading(true);
      await api.deleteReservation(reservationId, { user_id: user.id });
      toast.success('Reservation deleted successfully');
      setReservations((prev) => prev.filter((r) => r.id !== reservationId));
      setFilteredReservations((prev) => prev.filter((r) => r.id !== reservationId));
    } catch (err) {
      console.error('Error deleting reservation:', err);
      toast.error(
        err.response?.data?.error || 'Failed to delete reservation'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (reservation) => {
    setSelectedReservation(reservation);
    setFormData({
      table_id: reservation.table_id.toString(),
      reservation_time: new Date(reservation.reservation_time)
        .toISOString()
        .slice(0, 16),
      phone_number: reservation.phone_number,
      status: reservation.status.toLowerCase(),
    });
    setShowEditModal(true);
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

  const refreshReservations = async () => {
    setIsLoading(true);
    try {
      const [resResponse, tableResponse] = await Promise.all([
        api.getReservations(),
        api.getAvailableTables(),
      ]);
      setReservations(resResponse.data || []);
      setTables(tableResponse.data || []);
      toast.success('Data refreshed');
    } catch (err) {
      console.error('Error refreshing data:', err);
      toast.error('Failed to refresh data');
    } finally {
      setIsLoading(false);
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
                <h1 style={styles.title}>Table Reservations</h1>
                <p style={styles.subtitle}>Manage and track all restaurant reservations</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={refreshReservations}
                disabled={isLoading}
                style={{
                  ...styles.button,
                  ...styles.refreshButton,
                  ...(isLoading ? styles.buttonDisabled : {}),
                }}
                onMouseEnter={(e) =>
                  !isLoading &&
                  Object.assign(e.target.style, {
                    ...styles.buttonHover,
                    ...styles.refreshButtonHover,
                  })
                }
                onMouseLeave={(e) =>
                  !isLoading &&
                  Object.assign(e.target.style, {
                    ...styles.button,
                    ...styles.refreshButton,
                  })
                }
              >
                <Refresh
                  style={{
                    fontSize: '18px',
                    ...(isLoading ? { animation: 'spin 1s linear infinite' } : {}),
                  }}
                />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => {
                  setFormData({
                    table_id: '',
                    reservation_time: new Date(
                      Date.now() + 30 * 60 * 1000
                    ).toISOString().slice(0, 16),
                    phone_number: '',
                    status: 'pending',
                  });
                  setShowCreateModal(true);
                }}
                disabled={isLoading}
                style={{
                  ...styles.button,
                  ...styles.createButton,
                  ...(isLoading ? styles.buttonDisabled : {}),
                }}
                onMouseEnter={(e) =>
                  !isLoading &&
                  Object.assign(e.target.style, {
                    ...styles.buttonHover,
                    ...styles.createButtonHover,
                  })
                }
                onMouseLeave={(e) =>
                  !isLoading &&
                  Object.assign(e.target.style, {
                    ...styles.button,
                    ...styles.createButton,
                  })
                }
              >
                <Add style={{ fontSize: '18px' }} />
                <span>New Reservation</span>
              </button>
            </div>
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
                        <div style={styles.actionButtons}>
                          <button
                            onClick={() => openEditModal(reservation)}
                            style={{ ...styles.actionButton, ...styles.editButton }}
                            onMouseEnter={(e) =>
                              Object.assign(e.target.style, {
                                ...styles.actionButtonHover,
                                ...styles.editButtonHover,
                              })
                            }
                            onMouseLeave={(e) =>
                              Object.assign(e.target.style, {
                                ...styles.actionButton,
                                ...styles.editButton,
                              })
                            }
                          >
                            <Edit style={{ fontSize: '16px' }} />
                          </button>
                          <button
                            onClick={() => handleDeleteReservation(reservation.id)}
                            style={{ ...styles.actionButton, ...styles.deleteButton }}
                            onMouseEnter={(e) =>
                              Object.assign(e.target.style, {
                                ...styles.actionButtonHover,
                                ...styles.deleteButtonHover,
                              })
                            }
                            onMouseLeave={(e) =>
                              Object.assign(e.target.style, {
                                ...styles.actionButton,
                                ...styles.deleteButton,
                              })
                            }
                          >
                            <Delete style={{ fontSize: '16px' }} />
                          </button>
                        </div>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={getStatusBadgeStyle(reservation.status)}>
                        {getStatusIcon(reservation.status)}
                        {reservation.status || 'Pending'}
                      </span>
                      <button
                        onClick={() => openEditModal(reservation)}
                        style={{ ...styles.actionButton, ...styles.editButton }}
                        onMouseEnter={(e) =>
                          Object.assign(e.target.style, {
                            ...styles.actionButtonHover,
                            ...styles.editButtonHover,
                          })
                        }
                        onMouseLeave={(e) =>
                          Object.assign(e.target.style, {
                            ...styles.actionButton,
                            ...styles.editButton,
                          })
                        }
                      >
                        <Edit style={{ fontSize: '16px' }} />
                      </button>
                      <button
                        onClick={() => handleDeleteReservation(reservation.id)}
                        style={{ ...styles.actionButton, ...styles.deleteButton }}
                        onMouseEnter={(e) =>
                          Object.assign(e.target.style, {
                            ...styles.actionButtonHover,
                            ...styles.deleteButtonHover,
                          })
                        }
                        onMouseLeave={(e) =>
                          Object.assign(e.target.style, {
                            ...styles.actionButton,
                            ...styles.deleteButton,
                          })
                        }
                      >
                        <Delete style={{ fontSize: '16px' }} />
                      </button>
                    </div>
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
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Create Reservation Modal */}
        {showCreateModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Create New Reservation</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={styles.closeButton}
                >
                  <Close style={{ fontSize: '24px', color: '#374151' }} />
                </button>
              </div>
              <form onSubmit={handleCreateReservation}>
                <div style={styles.modalBody}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Table</label>
                    <select
                      value={formData.table_id}
                      onChange={(e) =>
                        setFormData({ ...formData, table_id: e.target.value })
                      }
                      style={{
                        ...styles.select,
                        ...(formErrors.table_id ? styles.inputError : {}),
                      }}
                    >
                      <option value="">Select a Table</option>
                      {tables.map((table) => (
                        <option key={table.id} value={table.id}>
                          Table {table.table_number} (Capacity: {table.capacity})
                        </option>
                      ))}
                    </select>
                    {formErrors.table_id && (
                      <span style={styles.errorText}>{formErrors.table_id}</span>
                    )}
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Reservation Time (CET)</label>
                    <input
                      type="datetime-local"
                      value={formData.reservation_time}
                      onChange={(e) =>
                        setFormData({ ...formData, reservation_time: e.target.value })
                      }
                      style={{
                        ...styles.input,
                        ...(formErrors.reservation_time ? styles.inputError : {}),
                      }}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    {formErrors.reservation_time && (
                      <span style={styles.errorText}>{formErrors.reservation_time}</span>
                    )}
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g., +1234567890"
                      value={formData.phone_number}
                      onChange={(e) =>
                        setFormData({ ...formData, phone_number: e.target.value })
                      }
                      style={{
                        ...styles.input,
                        ...(formErrors.phone_number ? styles.inputError : {}),
                      }}
                    />
                    {formErrors.phone_number && (
                      <span style={styles.errorText}>{formErrors.phone_number}</span>
                    )}
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      style={{
                        ...styles.select,
                        ...(formErrors.status ? styles.inputError : {}),
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {formErrors.status && (
                      <span style={styles.errorText}>{formErrors.status}</span>
                    )}
                  </div>
                </div>
                <div style={styles.modalFooter}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={styles.cancelButton}
                    onMouseEnter={(e) =>
                      Object.assign(e.target.style, styles.cancelButtonHover)
                    }
                    onMouseLeave={(e) =>
                      Object.assign(e.target.style, styles.cancelButton)
                    }
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      ...styles.submitButton,
                      ...(isLoading ? styles.submitButtonDisabled : {}),
                    }}
                    onMouseEnter={(e) =>
                      !isLoading &&
                      Object.assign(e.target.style, styles.submitButtonHover)
                    }
                    onMouseLeave={(e) =>
                      !isLoading &&
                      Object.assign(e.target.style, styles.submitButton)
                    }
                  >
                    Create Reservation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Reservation Modal */}
        {showEditModal && selectedReservation && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Edit Reservation #{selectedReservation.id}</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  style={styles.closeButton}
                >
                  <Close style={{ fontSize: '24px', color: '#374151' }} />
                </button>
              </div>
              <form onSubmit={handleEditReservation}>
                <div style={styles.modalBody}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Table</label>
                    <select
                      value={formData.table_id}
                      onChange={(e) =>
                        setFormData({ ...formData, table_id: e.target.value })
                      }
                      style={{
                        ...styles.select,
                        ...(formErrors.table_id ? styles.inputError : {}),
                      }}
                    >
                      <option value="">Select a Table</option>
                      {tables.map((table) => (
                        <option key={table.id} value={table.id}>
                          Table {table.table_number} (Capacity: {table.capacity})
                        </option>
                      ))}
                    </select>
                    {formErrors.table_id && (
                      <span style={styles.errorText}>{formErrors.table_id}</span>
                    )}
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Reservation Time (CET)</label>
                    <input
                      type="datetime-local"
                      value={formData.reservation_time}
                      onChange={(e) =>
                        setFormData({ ...formData, reservation_time: e.target.value })
                      }
                      style={{
                        ...styles.input,
                        ...(formErrors.reservation_time ? styles.inputError : {}),
                      }}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    {formErrors.reservation_time && (
                      <span style={styles.errorText}>{formErrors.reservation_time}</span>
                    )}
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g., +1234567890"
                      value={formData.phone_number}
                      onChange={(e) =>
                        setFormData({ ...formData, phone_number: e.target.value })
                      }
                      style={{
                        ...styles.input,
                        ...(formErrors.phone_number ? styles.inputError : {}),
                      }}
                    />
                    {formErrors.phone_number && (
                      <span style={styles.errorText}>{formErrors.phone_number}</span>
                    )}
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      style={{
                        ...styles.select,
                        ...(formErrors.status ? styles.inputError : {}),
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {formErrors.status && (
                      <span style={styles.errorText}>{formErrors.status}</span>
                    )}
                  </div>
                </div>
                <div style={styles.modalFooter}>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    style={styles.cancelButton}
                    onMouseEnter={(e) =>
                      Object.assign(e.target.style, styles.cancelButtonHover)
                    }
                    onMouseLeave={(e) =>
                      Object.assign(e.target.style, styles.cancelButton)
                    }
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      ...styles.submitButton,
                      ...(isLoading ? styles.submitButtonDisabled : {}),
                    }}
                    onMouseEnter={(e) =>
                      !isLoading &&
                      Object.assign(e.target.style, styles.submitButtonHover)
                    }
                    onMouseLeave={(e) =>
                      !isLoading &&
                      Object.assign(e.target.style, styles.submitButton)
                    }
                  >
                    Update Reservation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminTableReservations;