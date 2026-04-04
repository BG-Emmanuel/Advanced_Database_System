import axios from 'axios';

let inMemoryToken = null;

export const setAuthToken = (token) => {
  inMemoryToken = token || null;
};

export const clearAuthToken = () => {
  inMemoryToken = null;
};

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (inMemoryToken) config.headers.Authorization = `Bearer ${inMemoryToken}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      clearAuthToken();
      if (!window.location.pathname.includes('/login')) window.location.href = '/login';
    }
    return Promise.reject(err.response?.data || { message: 'Network error. Check your connection.' });
  }
);

export const authAPI = {
  register:       (d) => api.post('/auth/register', d),
  login:          (d) => api.post('/auth/login', d),
  google:         (d) => api.post('/auth/google', d),
  logout:         ()  => api.post('/auth/logout'),
  getMe:          ()  => api.get('/auth/me'),
  updateProfile:  (d) => api.put('/auth/profile', d),
  changePassword: (d) => api.post('/auth/change-password', d),
  forgotPassword: (d) => api.post('/auth/forgot-password', d),
  resetPassword:  (d) => api.post('/auth/reset-password', d),
};

export const productAPI = {
  getAll:      (p) => api.get('/products', { params: p }),
  getOne:      (slug) => api.get(`/products/${slug}`),
  getCategories: () => api.get('/products/categories'),
  create:      (d) => api.post('/products', d),
  update:      (id, d) => api.put(`/products/${id}`, d),
  delete:      (id) => api.delete(`/products/${id}`),
  addReview:   (id, d) => api.post(`/products/${id}/reviews`, d),
};

export const cartAPI = {
  get:        () => api.get('/cart'),
  addItem:    (d) => api.post('/cart/items', d),
  updateItem: (id, d) => api.put(`/cart/items/${id}`, d),
  removeItem: (id) => api.delete(`/cart/items/${id}`),
  clear:      () => api.delete('/cart'),
};

export const orderAPI = {
  checkout:      (d) => api.post('/orders/checkout', d),
  getAll:        (p) => api.get('/orders', { params: p }),
  getOne:        (id) => api.get(`/orders/${id}`),
  cancel:        (id) => api.put(`/orders/${id}/cancel`),
  updateStatus:  (id, status) => api.put(`/orders/${id}/status`, { status }),
  getAllAdmin:    (p) => api.get('/orders/all', { params: p }),
};

export const vendorAPI = {
  register:      (d) => api.post('/vendors/register', d),
  getProfile:    () => api.get('/vendors/profile'),
  updateProfile: (d) => api.put('/vendors/profile', d),
  getDashboard:  () => api.get('/vendors/dashboard'),
  getProducts:   () => api.get('/vendors/products'),
  getPublic:     (id) => api.get(`/vendors/${id}`),
};

export const addressAPI = {
  getAll:   () => api.get('/addresses'),
  add:      (d) => api.post('/addresses', d),
  update:   (id, d) => api.put(`/addresses/${id}`, d),
  delete:   (id) => api.delete(`/addresses/${id}`),
  getZones: () => api.get('/delivery-zones'),
};

export default api;

export const paymentAPI = {
  initiate:    (d) => api.post('/payments/initiate', d),
  checkStatus: (txId) => api.get(`/payments/status/${txId}`),
};

export const uploadAPI = {
  uploadImage:  (file) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/upload/image', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadImages: (files) => {
    const form = new FormData();
    files.forEach(f => form.append('images', f));
    return api.post('/upload/images', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  deleteImage: (filename) => api.delete(`/upload/${filename}`),
};

export const chatAPI = {
  getChat:      (vendorId) => api.get(`/chats/${vendorId}`),
  sendMessage:  (vendorId, d) => api.post(`/chats/${vendorId}/messages`, d),
  getMyChats:   () => api.get('/chats'),
  getVendorInbox: () => api.get('/chats/vendor-inbox'),
};

export const searchAPI = {
  visual: (imageFile) => {
    const form = new FormData();
    form.append('image', imageFile);
    return api.post('/search/visual', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });
  },
  indexProduct:  (productId) => api.post(`/search/index/${productId}`),
  indexAll:      () => api.post('/search/index-all'),
  getStats:      () => api.get('/search/stats'),
};
