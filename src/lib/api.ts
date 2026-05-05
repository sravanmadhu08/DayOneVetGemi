import axios from 'axios';
import { StudyModule, Question, Flashcard, FlashcardProgress, UserProfile } from '../types';

/**
 * NEW DJANGO API LAYER
 * This file handles all communication with the Django backend.
 * Base URL is defined in .env via VITE_API_BASE_URL.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/welcome';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

// Helper to handle API responses
const handleResponse = async <T>(promise: Promise<any>): Promise<T> => {
  try {
    const response = await promise;
    return response.data;
  } catch (error: any) {
    console.error('API Error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

const handleListResponse = async <T>(promise: Promise<any>): Promise<T[]> => {
  const data = await handleResponse<T[] | { results: T[] }>(promise);
  return Array.isArray(data) ? data : data.results;
};

export const api = {
  // Auth
  login: (data: any) => handleResponse<any>(apiClient.post('/auth/login/', data)),
  register: (data: any) => handleResponse<any>(apiClient.post('/auth/register/', data)),

  // Curriculum
  getModules: () => handleListResponse<StudyModule>(apiClient.get('/modules/')),
  getModule: (id: string | number) => handleResponse<StudyModule>(apiClient.get(`/modules/${id}/`)),
  createModule: (data: any) => handleResponse<any>(apiClient.post('/modules/', data)),
  updateModule: (id: string | number, data: any) => handleResponse<any>(apiClient.patch(`/modules/${id}/`, data)),
  deleteModule: (id: string | number) => handleResponse<any>(apiClient.delete(`/modules/${id}/`)),
  
  getModuleProgress: (moduleId?: string | number) => 
    handleListResponse<any>(apiClient.get('/module-progress/', { params: moduleId ? { module: moduleId } : {} })),
  saveModuleProgress: (data: { module: string | number; current_section_index: number; completed: boolean }) => 
    handleResponse<any>(apiClient.post('/module-progress/', data)),
  updateModuleProgress: (id: number, data: { current_section_index: number; completed: boolean }) =>
    handleResponse<any>(apiClient.patch(`/module-progress/${id}/`, data)),
  
  // Quizzes
  getQuestions: (params?: { system?: string; species?: string; limit?: number; offset?: number }) => 
    handleListResponse<Question>(apiClient.get('/questions/', { params })),

  getQuestionSession: (params: { system?: string; species?: string; count?: string | number; mode?: string }) =>
    handleResponse<{ questions: Question[]; config: any }>(apiClient.get('/questions/session/', { params })),
  
  createQuestion: (data: any) => handleResponse<Question>(apiClient.post('/questions/', data)),
  updateQuestion: (id: string | number, data: any) => handleResponse<Question>(apiClient.patch(`/questions/${id}/`, data)),
  deleteQuestion: (id: string | number) => handleResponse<any>(apiClient.delete(`/questions/${id}/`)),

  startQuiz: (config: any) => 
    handleResponse<any>(apiClient.post('/quiz-attempts/', { quiz_config: config, score: 0, total_questions: 0, correct_count: 0 })),
  
  submitQuizAttempt: (data: { score: number; total_questions: number; correct_count: number; system?: string; species?: string; quiz_config: any }) =>
    handleResponse<any>(apiClient.post('/quiz-attempts/', data)),

  getQuizHistory: (limit?: number) =>
    handleListResponse<any>(apiClient.get('/quiz-attempts/', { params: limit ? { limit } : {} })),

  getCompletedPracticeQuestions: () =>
    handleListResponse<any>(apiClient.get('/completed-questions/')),

  saveCompletedPracticeQuestion: (data: { question: number | string; was_correct: boolean }) =>
    handleResponse<any>(apiClient.post('/completed-questions/', data)),

  getBookmarkedQuestions: () =>
    handleListResponse<any>(apiClient.get('/bookmarked-questions/')),

  bookmarkQuestion: (id: string | number) =>
    handleResponse<any>(apiClient.post(`/questions/${id}/bookmark/`)),

  unbookmarkQuestion: (id: string | number) =>
    handleResponse<void>(apiClient.delete(`/questions/${id}/bookmark/`)),

  // Flashcards
  getFlashcards: (params?: { limit?: number; offset?: number }) =>
    handleListResponse<Flashcard>(apiClient.get('/flashcards/', { params })),

  getDueFlashcards: (limit?: number) =>
    handleListResponse<Flashcard>(apiClient.get('/flashcards/due/', { params: limit ? { limit } : {} })),
  
  createFlashcard: (data: Partial<Flashcard>) => 
    handleResponse<Flashcard>(apiClient.post('/flashcards/', data)),
  
  getFlashcardProgress: () => 
    handleListResponse<any>(apiClient.get('/flashcard-progress/')),
  
  saveFlashcardProgress: (data: { flashcard: string | number; interval: number; ease: number; next_review: string; consecutive_correct: number }) =>
    handleResponse<any>(apiClient.post('/flashcard-progress/', data)),
  
  reviewFlashcard: (progressId: number, data: { interval: number; ease: number; next_review: string; consecutive_correct: number }) =>
    handleResponse<any>(apiClient.patch(`/flashcard-progress/${progressId}/`, data)),

  // Library
  getDocuments: () => handleListResponse<any>(apiClient.get('/documents/')),
  getDocument: (id: string | number) => handleResponse<any>(apiClient.get(`/documents/${id}/`)),
  createDocument: (data: any) => handleResponse<any>(apiClient.post('/documents/', data)),
  deleteDocument: (id: string | number) => handleResponse<any>(apiClient.delete(`/documents/${id}/`)),
  
  getGuidelines: () => handleListResponse<any>(apiClient.get('/guidelines/')),
  createGuideline: (data: any) => handleResponse<any>(apiClient.post('/guidelines/', data)),
  updateGuideline: (id: string | number, data: any) => handleResponse<any>(apiClient.patch(`/guidelines/${id}/`, data)),
  deleteGuideline: (id: string | number) => handleResponse<any>(apiClient.delete(`/guidelines/${id}/`)),
  
  getResources: () => handleListResponse<any>(apiClient.get('/resources/')),
  createResource: (data: any) => handleResponse<any>(apiClient.post('/resources/', data)),
  updateResource: (id: string | number, data: any) => handleResponse<any>(apiClient.patch(`/resources/${id}/`, data)),
  deleteResource: (id: string | number) => handleResponse<any>(apiClient.delete(`/resources/${id}/`)),

  // Profile & Settings
  getProfile: () => handleResponse<UserProfile>(apiClient.get('/profile/me/')),
  updateProfile: (data: Partial<UserProfile>) => handleResponse<UserProfile>(apiClient.patch('/profile/me/', data)),
  
  getSettings: () => handleResponse<any>(apiClient.get('/settings/global/')),
  updateGlobalSettings: (settings: any) => handleResponse<any>(apiClient.patch('/settings/global/', { value: settings })),
  getSubscriptionStatus: () => handleResponse<any>(apiClient.get('/subscription/status/')),
  createCheckoutSession: () => handleResponse<any>(apiClient.post('/subscription/create-checkout/')),
};
