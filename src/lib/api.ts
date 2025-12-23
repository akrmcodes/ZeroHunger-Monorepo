import axios, { AxiosInstance, AxiosError } from "axios";
import { getToken, removeToken } from "@/lib/utils/auth-storage";
import type { Donation, DonationFormData } from "@/types/donation";

// =============================================================================
// BASE URL CONFIGURATION - "Najm Strategy"
// Switch backends by changing NEXT_PUBLIC_API_BASE_URL in .env
// =============================================================================
const BASE_URL = process.env. NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/** Standard API response wrapper */
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?:  string;
}

/** Standard API error structure */
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

/** User object from API */
export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  impact_score: number;
  status: "active" | "inactive" | "suspended";
  roles: string[];
  permissions?:  string[];
  created_at?:  string;
  updated_at?: string;
}

/** Claim object from API */
export interface Claim {
  id: number;
  donation_id:  number;
  volunteer_id: number;
  status: "active" | "picked_up" | "delivered" | "cancelled";
  picked_up_at:  string | null;
  delivered_at:  string | null;
  notes: string | null;
  donation?:  Donation;
  volunteer?: Pick<User, "id" | "name" | "phone">;
  created_at: string;
  updated_at?:  string;
}

/** Notification object from API */
export interface Notification {
  id: string;
  type:  string;
  data: {
    donation_id?:  number;
    donation_title?: string;
    volunteer_name?: string;
    pickup_code?: string;
    message:  string;
  };
  read_at:  string | null;
  created_at:  string;
}

// -----------------------------------------------------------------------------
// Auth Request/Response Types
// -----------------------------------------------------------------------------

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?:  string;
  role:  "donor" | "volunteer" | "recipient";
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface LogoutResponse {
  message: string;
}

export interface MeResponse {
  user: User;
}

// -----------------------------------------------------------------------------
// Profile Request/Response Types
// -----------------------------------------------------------------------------

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateProfileResponse {
  message: string;
  user: User;
}

// -----------------------------------------------------------------------------
// Donation Request/Response Types
// -----------------------------------------------------------------------------

export interface ClaimDonationResponse {
  message:  string;
  donation: Donation;
  pickup_code:  string;
}

// -----------------------------------------------------------------------------
// Claim Request/Response Types
// -----------------------------------------------------------------------------

export interface PickupRequest {
  pickup_code: string;
}

export interface DeliverRequest {
  notes?:  string;
}

export interface ClaimActionResponse {
  message:  string;
  claim: Claim;
}

export interface CancelClaimResponse {
  message: string;
}

// -----------------------------------------------------------------------------
// Notification Response Types
// -----------------------------------------------------------------------------

export interface MarkReadResponse {
  message: string;
}

// =============================================================================
// AXIOS CLIENT CONFIGURATION
// =============================================================================

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor - Attach Bearer token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error:  AxiosError<ApiError>) => {
    const status = error.response?. status;

    // 401 Unauthorized - Clear token and redirect to login
    if (status === 401 && typeof window !== "undefined") {
      removeToken();
      window.location.href = "/login";
    }

    // Normalize error to ApiError format
    const apiError: ApiError = {
      message:  error.response?.data?.message ??  "An unexpected error occurred",
      errors: error.response?. data?.errors,
      status:  status ??  0,
    };

    return Promise.reject(apiError);
  }
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Normalize axios response to ApiResponse format
 */
function normalizeResponse<T>(
  response: { data: T; status: number; statusText: string },
  message?:  string
): ApiResponse<T> {
  return {
    data: response.data,
    status:  response.status,
    message:  message ??  response.statusText,
  };
}

/**
 * Handle errors and throw as ApiError
 */
function handleError(error: unknown): never {
  if (axios.isAxiosError<ApiError>(error)) {
    const apiError:  ApiError = {
      message: error.response?.data?.message ??  "An unexpected error occurred",
      errors:  error.response?.data?.errors,
      status: error.response?.status ?? 0,
    };
    throw apiError;
  }
  throw { message: "An unexpected error occurred", status: 0 } satisfies ApiError;
}

// =============================================================================
// API MODULES
// =============================================================================

// -----------------------------------------------------------------------------
// 🔐 AUTH MODULE
// Endpoints:  POST /register, POST /login, POST /logout, GET /me
// -----------------------------------------------------------------------------
const auth = {
  /**
   * Register a new user
   * @endpoint POST /register
   */
  async register(payload: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>("/register", payload);
      return normalizeResponse(response, response.data.message);
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Login with email and password
   * @endpoint POST /login
   */
  async login(payload: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>("/login", payload);
      return normalizeResponse(response, response.data.message);
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Logout current user (invalidates token)
   * @endpoint POST /logout
   */
  async logout(): Promise<ApiResponse<LogoutResponse>> {
    try {
      const response = await apiClient.post<LogoutResponse>("/logout");
      return normalizeResponse(response, response.data.message);
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get current authenticated user profile
   * @endpoint GET /me
   */
  async me(): Promise<ApiResponse<MeResponse>> {
    try {
      const response = await apiClient.get<MeResponse>("/me");
      return normalizeResponse(response, "OK");
    } catch (error) {
      return handleError(error);
    }
  },
};

// -----------------------------------------------------------------------------
// 👤 PROFILE MODULE
// Endpoints: PUT /profile
// -----------------------------------------------------------------------------
const profile = {
  /**
   * Update current user profile
   * @endpoint PUT /profile
   */
  async update(payload: UpdateProfileRequest): Promise<ApiResponse<UpdateProfileResponse>> {
    try {
      const response = await apiClient. put<UpdateProfileResponse>("/profile", payload);
      return normalizeResponse(response, response.data.message);
    } catch (error) {
      return handleError(error);
    }
  },
};

// -----------------------------------------------------------------------------
// 🍽️ DONATIONS MODULE
// Endpoints: GET /donations, GET /donations/{id}, POST /donations,
//            POST /donations/{id}/claim, GET /my-donations, GET /donations/nearby
// -----------------------------------------------------------------------------
const donations = {
  /**
   * List all available donations
   * @endpoint GET /donations
   */
  async list(): Promise<ApiResponse<Donation[]>> {
    try {
      const response = await apiClient.get<Donation[]>("/donations");
      return normalizeResponse(response, "OK");
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get a single donation by ID
   * @endpoint GET /donations/{id}
   */
  async get(id: number): Promise<ApiResponse<Donation>> {
    try {
      const response = await apiClient.get<Donation>(`/donations/${id}`);
      return normalizeResponse(response, "OK");
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Create a new donation (Donor only)
   * @endpoint POST /donations
   */
  async create(data: DonationFormData): Promise<ApiResponse<Donation>> {
    try {
      const payload = {
        title: data.title,
        description: data.description ??  null,
        quantity_kg: data.quantity,
        latitude: data.latitude,
        longitude: data.longitude,
        expires_at: data. expires_at ??  null,
      };
      const response = await apiClient.post<Donation>("/donations", payload);
      return normalizeResponse(response, "Donation created successfully");
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Claim a donation (Volunteer only)
   * @endpoint POST /donations/{id}/claim
   */
  async claim(id:  number): Promise<ApiResponse<ClaimDonationResponse>> {
    try {
      const response = await apiClient.post<ClaimDonationResponse>(`/donations/${id}/claim`, {});
      return normalizeResponse(response, response.data.message);
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get donations created by the current user (Donor only)
   * @endpoint GET /my-donations
   */
  async myDonations(): Promise<ApiResponse<Donation[]>> {
    try {
      const response = await apiClient.get<Donation[]>("/my-donations");
      return normalizeResponse(response, "OK");
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get nearby donations based on geolocation
   * @endpoint GET /donations/nearby? latitude={lat}&longitude={lng}&radius={km}
   * @param latitude - User's latitude
   * @param longitude - User's longitude
   * @param radius - Search radius in kilometers (default: 10)
   */
  async nearby(
    latitude: number,
    longitude: number,
    radius: number = 10
  ): Promise<ApiResponse<Donation[]>> {
    try {
      const response = await apiClient. get<Donation[]>("/donations/nearby", {
        params: { latitude, longitude, radius },
      });
      return normalizeResponse(response, "OK");
    } catch (error) {
      return handleError(error);
    }
  },
};

// -----------------------------------------------------------------------------
// 📋 CLAIMS MODULE (Volunteer Only)
// Endpoints: GET /claims, POST /claims/{id}/pickup, POST /claims/{id}/deliver,
//            DELETE /claims/{id}
// -----------------------------------------------------------------------------
const claims = {
  /**
   * Get all claims for the current volunteer
   * @endpoint GET /claims
   */
  async list(): Promise<ApiResponse<Claim[]>> {
    try {
      const response = await apiClient.get<Claim[]>("/claims");
      return normalizeResponse(response, "OK");
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Mark a claim as picked up (requires pickup code verification)
   * @endpoint POST /claims/{id}/pickup
   * @param id - Claim ID
   * @param pickupCode - 6-digit pickup code from donor
   */
  async markPickedUp(id: number, pickupCode:  string): Promise<ApiResponse<ClaimActionResponse>> {
    try {
      const payload:  PickupRequest = { pickup_code: pickupCode };
      const response = await apiClient.post<ClaimActionResponse>(`/claims/${id}/pickup`, payload);
      return normalizeResponse(response, response. data.message);
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Mark a claim as delivered
   * @endpoint POST /claims/{id}/deliver
   * @param id - Claim ID
   * @param notes - Optional delivery notes
   */
  async markDelivered(id: number, notes?: string): Promise<ApiResponse<ClaimActionResponse>> {
    try {
      const payload:  DeliverRequest = { notes };
      const response = await apiClient.post<ClaimActionResponse>(`/claims/${id}/deliver`, payload);
      return normalizeResponse(response, response. data.message);
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Cancel a claim (donation becomes available again)
   * @endpoint DELETE /claims/{id}
   */
  async cancel(id: number): Promise<ApiResponse<CancelClaimResponse>> {
    try {
      const response = await apiClient.delete<CancelClaimResponse>(`/claims/${id}`);
      return normalizeResponse(response, response. data.message);
    } catch (error) {
      return handleError(error);
    }
  },
};

// -----------------------------------------------------------------------------
// 🔔 NOTIFICATIONS MODULE
// Endpoints: GET /notifications, POST /notifications/{id}/read
// -----------------------------------------------------------------------------
const notifications = {
  /**
   * Get all notifications for the current user
   * @endpoint GET /notifications
   */
  async list(): Promise<ApiResponse<Notification[]>> {
    try {
      const response = await apiClient.get<Notification[]>("/notifications");
      return normalizeResponse(response, "OK");
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Mark a notification as read
   * @endpoint POST /notifications/{id}/read
   */
  async markRead(id: string): Promise<ApiResponse<MarkReadResponse>> {
    try {
      const response = await apiClient. post<MarkReadResponse>(`/notifications/${id}/read`);
      return normalizeResponse(response, response.data.message);
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get count of unread notifications
   * (Computed client-side from list)
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await this.list();
      return response.data. filter((n) => n.read_at === null).length;
    } catch {
      return 0;
    }
  },
};

// =============================================================================
// UNIFIED API EXPORT
// =============================================================================

export const api = {
  auth,
  profile,
  donations,
  claims,
  notifications,
};

// Type export for the entire API client
export type ApiClient = typeof api;

// Re-export types for external use
export type { Donation, DonationFormData } from "@/types/donation";