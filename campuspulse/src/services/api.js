const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_URL = configuredApiUrl?.replace(/\/$/, '');

if (!API_URL) {
  console.warn('VITE_API_URL is missing. Add it to the frontend .env and restart Vite.');
}

async function request(path, options = {}) {
  if (!API_URL) {
    const error = new Error('CampusPulse API URL is not configured. Add VITE_API_URL to the frontend .env and restart Vite.');
    error.code = 'CONFIG_ERROR';
    throw error;
  }
  const url = `${API_URL}${path}`;
  let response;
  try {
    response = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
  } catch (error) {
    const networkError = new Error('Unable to connect to CampusPulse server. Please make sure the backend is running.');
    networkError.cause = error;
    networkError.code = 'NETWORK_ERROR';
    throw networkError;
  }

  const payload = await response.json().catch(() => ({ success: false, message: 'Invalid server response' }));
  if (!response.ok) {
    const messages = {
      400: 'Invalid request. Please check the information you entered.',
      401: 'Authentication required. Please log in again.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      409: 'An account with this email already exists.'
    };
    const error = new Error(payload.message || messages[response.status] || `Server error (${response.status})`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

export const authAPI = {
  login: data => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: data => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' })
};

export const eventAPI = {
  getEvents: () => request('/events'),
  getEventById: id => request(`/events/${id}`),
  getMyEvents: () => request('/events/organizer/my-events'),
  createEvent: data => request('/events', { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id, data) => request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvent: id => request(`/events/${id}`, { method: 'DELETE' }),
  getRegistrations: id => request(`/events/${id}/registrations`)
};

export const registrationAPI = {
  register: id => request(`/events/${id}/register`, { method: 'POST' }),
  cancel: id => request(`/events/${id}/register`, { method: 'DELETE' }),
  getMine: () => request('/user/registrations')
};

export const aiAPI = {
  ask: (question, history=[], confirmAction=null) => request('/ai/assistant', { method:'POST', body: JSON.stringify({question,history,confirmAction}) }),
  recommendations: interests => request('/ai/recommendations', { method:'POST', body: JSON.stringify({interests}) }),
  insights: () => request('/ai/insights')
};


export const clubAPI = {
  getClubs: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => { if (value) query.set(key, value); });
    return request(`/clubs${query.toString() ? `?${query.toString()}` : ''}`);
  },
  getClubById: id => request(`/clubs/${id}`),
  createClub: data => request('/clubs', { method: 'POST', body: JSON.stringify(data) }),
  updateClub: (id, data) => request(`/clubs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClub: id => request(`/clubs/${id}`, { method: 'DELETE' }),
  join: id => request(`/clubs/${id}/join`, { method: 'POST' }),
  leave: id => request(`/clubs/${id}/join`, { method: 'DELETE' }),
  getMine: () => request('/clubs/mine'),
  removeMember: (id, userId) => request(`/clubs/${id}/members/${userId}`, { method: 'DELETE' })
};

export const notificationAPI = {
  list: () => request('/notifications'),
  markRead: id => request(`/notifications/${id}/read`, {method:'PUT'}),
  markAllRead: () => request('/notifications/read-all', {method:'PUT'})
};

export const adminAPI = {
  getPendingEvents: () => request('/admin/events/pending'),
  approveEvent: id => request(`/admin/events/${id}/approve`, { method: 'PUT' }),
  rejectEvent: id => request(`/admin/events/${id}/reject`, { method: 'PUT' }),
  getUsers: () => request('/admin/users'),
  getOrganizers: () => request('/admin/organizers'),
  getStats: () => request('/admin/stats'),
  getRegistrations: () => request('/admin/registrations')
};

export { API_URL };
