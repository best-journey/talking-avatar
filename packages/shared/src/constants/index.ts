// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
  },
  AVATAR: {
    BASE: '/avatar',
    BY_ID: (id: string) => `/avatar/${id}`,
    SPEAK: (id: string) => `/avatar/${id}/speak`,
  },
} as const

// Default values
export const DEFAULTS = {
  PAGINATION: {
    PAGE: 1,
    LIMIT: 10,
    MAX_LIMIT: 100,
  },
  VOICE_SETTINGS: {
    PITCH: 1.0,
    SPEED: 1.0,
    VOLUME: 0.8,
  },
  AVATAR: {
    MAX_NAME_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 500,
  },
  USER: {
    MAX_NAME_LENGTH: 100,
    MIN_PASSWORD_LENGTH: 6,
  },
} as const

// Error messages
export const ERROR_MESSAGES = {
  VALIDATION: {
    REQUIRED: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    PASSWORD_TOO_SHORT: `Password must be at least ${DEFAULTS.USER.MIN_PASSWORD_LENGTH} characters`,
    NAME_TOO_LONG: `Name must be less than ${DEFAULTS.USER.MAX_NAME_LENGTH} characters`,
  },
  API: {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    SERVER_ERROR: 'Server error. Please try again later.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    NOT_FOUND: 'The requested resource was not found.',
  },
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_EXISTS: 'User with this email already exists',
    TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  },
} as const

// Success messages
export const SUCCESS_MESSAGES = {
  AUTH: {
    LOGIN: 'Successfully logged in',
    REGISTER: 'Account created successfully',
    LOGOUT: 'Successfully logged out',
  },
  AVATAR: {
    CREATED: 'Avatar created successfully',
    UPDATED: 'Avatar updated successfully',
    DELETED: 'Avatar deleted successfully',
    SPEAKING: 'Avatar is now speaking',
  },
  USER: {
    CREATED: 'User created successfully',
    UPDATED: 'User updated successfully',
    DELETED: 'User deleted successfully',
  },
} as const

// Application constants
export const APP_CONFIG = {
  NAME: 'Talking Avatar',
  VERSION: '1.0.0',
  DESCRIPTION: 'AI-powered talking avatar application',
  AUTHOR: 'Talking Avatar Team',
} as const
