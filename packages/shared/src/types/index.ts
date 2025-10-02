// User types
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserDto {
  name: string
  email: string
  avatar?: string
}

export interface UpdateUserDto extends Partial<CreateUserDto> {}

// Avatar types
export interface Avatar {
  id: string
  name: string
  description?: string
  imageUrl?: string
  voiceSettings?: VoiceSettings
  createdAt: Date
  updatedAt: Date
}

export interface VoiceSettings {
  pitch: number
  speed: number
  volume: number
}

export interface CreateAvatarDto {
  name: string
  description?: string
  imageUrl?: string
  voiceSettings?: VoiceSettings
}

export interface UpdateAvatarDto extends Partial<CreateAvatarDto> {}

// Auth types
export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  message: string
  user: {
    email: string
    name: string
  }
  token?: string
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  message?: string
  error?: string
  status: number
}

// Common types
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
