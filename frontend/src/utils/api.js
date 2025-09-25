import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
    );
  }

  // Admin APIs
  async adminRegister(data) {
    const response = await this.api.post('/api/admin/register', data);
    return response.data;
  }

  async adminLogin(data) {
    const response = await this.api.post('/api/admin/login', data);
    return response.data;
  }

  async createPoll(data) {
    const response = await this.api.post('/api/admin/polls', data);
    return response.data;
  }

  async registerVoter(data) {
    const response = await this.api.post('/api/admin/voters', data);
    return response.data;
  }

  async getPollResults(pollId) {
    const response = await this.api.get(`/api/admin/polls/${pollId}/results`);
    return response.data;
  }

  async getAdminPolls() {
    const response = await this.api.get('/api/admin/polls');
    return response.data;
  }

  // User APIs
  async userLogin(data) {
    const response = await this.api.post('/api/user/login', data);
    return response.data;
  }

  async getVotingStatus(pollId) {
    const response = await this.api.get(`/api/user/status/${pollId}`);
    return response.data;
  }

  // Poll APIs
  async getActivePolls() {
    const response = await this.api.get('/api/polls/active');
    return response.data;
  }

  async submitVote(data) {
    const response = await this.api.post('/api/polls/vote', data);
    return response.data;
  }
}

export default new ApiService();