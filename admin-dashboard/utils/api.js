import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: 'http://192.168.100.218:5000/api/admin',
});

api.interceptors.request.use(config => {
  const admin = Cookies.get('admin_user');
  if (admin) {
    const parsed = JSON.parse(admin);
    config.headers['admin_id'] = parsed.id;
  }
  return config;
});

export default api;