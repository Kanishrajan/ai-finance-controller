import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-User-Role': localStorage.getItem('user_role') || 'ANALYST',
    'X-User-Name': localStorage.getItem('user_name') || 'Marcus Chen (Senior Analyst)',
    'X-User-Id': 'usr-analyst-1'
  }
});

// Update headers dynamically when role switches
export function setUserRole(role, name) {
  localStorage.setItem('user_role', role);
  localStorage.setItem('user_name', name);
  api.defaults.headers['X-User-Role'] = role;
  api.defaults.headers['X-User-Name'] = name;
}

export function getCurrentUser() {
  return {
    role: localStorage.getItem('user_role') || 'ANALYST',
    name: localStorage.getItem('user_name') || 'Marcus Chen (Senior Analyst)'
  };
}

export default api;
