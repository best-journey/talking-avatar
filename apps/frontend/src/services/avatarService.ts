import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface Avatar {
  id: string
  name: string
  description?: string
  imageUrl?: string
  voiceSettings?: {
    pitch: number
    speed: number
    volume: number
  }
  createdAt: string
  updatedAt: string
}

export class AvatarService {
  static async getAllAvatars(): Promise<Avatar[]> {
    const response = await apiClient.get('/avatar')
    return response.data
  }

  static async getAvatarById(id: string): Promise<Avatar> {
    const response = await apiClient.get(`/avatar/${id}`)
    return response.data
  }

  static async createAvatar(avatarData: Omit<Avatar, 'id' | 'createdAt' | 'updatedAt'>): Promise<Avatar> {
    const response = await apiClient.post('/avatar', avatarData)
    return response.data
  }

  static async updateAvatar(id: string, avatarData: Partial<Avatar>): Promise<Avatar> {
    const response = await apiClient.put(`/avatar/${id}`, avatarData)
    return response.data
  }

  static async deleteAvatar(id: string): Promise<void> {
    await apiClient.delete(`/avatar/${id}`)
  }

  static async makeAvatarSpeak(id: string, text: string): Promise<{ message: string; audioUrl?: string }> {
    const response = await apiClient.post(`/avatar/${id}/speak`, { text })
    return response.data
  }
}
