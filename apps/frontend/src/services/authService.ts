import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export class AuthService {
  static async login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', { email, password })
    return response.data
  }

  static async register(name: string, email: string, password: string) {
    const response = await apiClient.post('/auth/register', { name, email, password })
    return response.data
  }

  static async logout() {
    // In a real app, you would clear tokens from storage
    localStorage.removeItem('token')
  }

  static getToken() {
    return localStorage.getItem('token')
  }

  static setToken(token: string) {
    localStorage.setItem('token', token)
  }
}
