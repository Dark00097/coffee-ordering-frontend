import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'https://coffee-ordering-backend-production.up.railway.app'}/api`,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    if (import.meta.env.MODE === 'development') {
      console.log(`[${config.method.toUpperCase()}] ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error.message);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (import.meta.env.MODE === 'development') {
      console.log(`[Response] ${response.config.url}: ${response.status}`);
    }
    return response;
  },
  (error) => {
    const message = error.response?.data?.error || error.message;
    console.error(`[Error] ${error.config?.url}: ${message}`);
    return Promise.reject(error);
  }
);

// Notification API methods
api.getNotifications = (params) => api.get('/notifications', { params });
api.markNotificationRead = (id) => api.put(`/notifications/${id}/read`);
api.clearNotifications = () => api.put('/notifications/clear');

// Table and reservation API methods
api.getTables = () => api.get('/tables');
api.getAvailableTables = () => api.get('/tables?status=available');
api.addTable = (data) => api.post('/tables', data);
api.updateTable = (id, data) => api.put(`/tables/${id}`, data);
api.deleteTable = (id, data) => api.delete(`/tables/${id}`, { data });
api.getReservations = () => api.get('/reservations');
api.addReservation = (data) => api.post('/reservations', data);
api.updateReservation = (id, data) => api.put(`/reservations/${id}`, data);

// Rating API methods
api.submitRating = (data) => api.post('/ratings', data);
api.getRatingsByItem = (itemId) => api.get(`/ratings?item_id=${itemId}`);
api.getRatingsByBreakfast = (breakfastId) => api.get(`/ratings?breakfast_id=${breakfastId}`);

// User management API methods
api.updateUser = (id, data) => api.put(`/users/${id}`, data);
api.deleteUser = (id, data) => api.delete(`/users/${id}`, { data });

// Category management API methods
api.addCategory = (data) => api.post('/categories', data);
api.updateCategory = (id, data) => api.put(`/categories/${id}`, data);
api.deleteCategory = (id, data) => api.delete(`/categories/${id}`, { data });
api.getTopCategories = () => api.get('/categories/top');

// Supplement API methods
api.getSupplementsByMenuItem = (menuItemId) => api.get(`/menu-items/${menuItemId}/supplements`);
api.addSupplementToMenuItem = (menuItemId, data) => api.post(`/menu-items/${menuItemId}/supplements`, data);
api.updateSupplementForMenuItem = (menuItemId, supplementId, data) => api.put(`/menu-items/${menuItemId}/supplements/${supplementId}`, data);
api.deleteSupplementFromMenuItem = (menuItemId, supplementId, data) => api.delete(`/menu-items/${menuItemId}/supplements/${supplementId}`, { data });

// Menu item API methods
api.addMenuItem = (data) => api.post('/menu-items', data);
api.updateMenuItem = (id, data) => api.put(`/menu-items/${id}`, data);
api.deleteMenuItem = (id, data) => api.delete(`/menu-items/${id}`, { data });
api.searchMenuItems = (query) => api.get('/menu-items/search', { params: { query } });

// Order API methods
api.submitOrder = (data) => api.post('/orders', data);
api.approveOrder = (id) => api.post(`/orders/${id}/approve`);
api.getOrder = (id) => api.get(`/orders/${id}`);
api.getSession = () => api.get('/session');

// Banner API methods
api.getBanners = (params) => api.get('/banners', { params });
api.getEnabledBanners = () => api.get('/banners/enabled');
api.addBanner = (data) => api.post('/banners', data);
api.updateBanner = (id, data) => api.put(`/banners/${id}`, data);
api.deleteBanner = (id, data) => api.delete(`/banners/${id}`, { data });

// Breakfast API methods
api.getBreakfasts = () => api.get('/breakfasts');
api.getBreakfast = (id) => api.get(`/breakfasts/${id}`);
api.getBreakfastOptions = (id) => api.get(`/breakfasts/${id}/options`);
api.addBreakfast = (data) => api.post('/breakfasts', data);
api.updateBreakfast = (id, data) => api.put(`/breakfasts/${id}`, data);
api.deleteBreakfast = (id, data) => api.delete(`/breakfasts/${id}`, { data });
api.addBreakfastOption = (id, data) => api.post(`/breakfasts/${id}/options`, data);
api.deleteBreakfastOption = (breakfastId, optionId, data) => api.delete(`/breakfasts/${breakfastId}/options/${optionId}`, { data });
api.getBreakfastOptionGroups = (id) => api.get(`/breakfasts/${id}/option-groups`);
api.addBreakfastOptionGroup = (id, data) => api.post(`/breakfasts/${id}/option-groups`, data);
api.updateBreakfastOptionGroup = (breakfastId, groupId, data) => api.put(`/breakfasts/${breakfastId}/option-groups/${groupId}`, data);
api.deleteBreakfastOptionGroup = (breakfastId, groupId, data) => api.delete(`/breakfasts/${breakfastId}/option-groups/${groupId}`, { data });
api.updateBreakfastOption = (breakfastId, optionId, data) => api.put(`/breakfasts/${breakfastId}/options/${optionId}`, data);

export { api };
