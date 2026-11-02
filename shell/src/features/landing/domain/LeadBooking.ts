export interface LeadBookingRequest {
  fullName: string;
  phone: string;
  email: string;
  discipline: string;
  planName?: string;
  preferredTime: string;
  notes?: string;
}

export interface LeadBookingResponse {
  success: boolean;
  confirmationCode: string;
  message: string;
}
