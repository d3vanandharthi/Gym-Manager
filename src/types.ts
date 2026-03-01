export interface Member {
  id: string;
  name: string;
  phone: string;
  email: string;
  dob?: string;
  joinDate: string;
  expiryDate: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  gender?: string;
  bloodGroup?: string;
  status?: 'active' | 'expired';
  createdAt?: string;
}

export interface Plan {
  id: string;
  name: string;
  duration_months: number;
  price: number;
}

export interface Payment {
  id: string;
  member_id: string;
  plan_id: string | null;
  amount: number;
  method: string;
  paid_at: string;
  notes: string;
  member_name?: string;
  plan_name?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  payment_id: string;
  member_id: string;
  member_name: string;
  member_phone: string;
  member_email: string;
  plan_name: string;
  subtotal: number;
  gst_rate: number;
  gst_amount: number;
  total: number;
  method: string;
  notes: string;
  gym_name: string;
  gym_address: string;
  gym_gstin: string;
  issued_at: string;
}

export interface InvoiceSettings {
  gym_name: string;
  gym_address: string;
  gym_gstin: string;
  gst_enabled: string;
  gst_rate: string;
  next_invoice_number: string;
}

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  expiringThisWeek: number;
  monthlyRevenue: number;
  totalRevenue: number;
}

export interface ActivityItem {
  id: number;
  type: string;
  description: string;
  member_id: string | null;
  member_name: string | null;
  created_at: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  created_at?: string;
}

export interface MessageLog {
  id: string;
  member_id: string | null;
  phone: string;
  template_id: string | null;
  message: string;
  status: string;
  sent_at: string;
  member_name?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  full_name?: string;
  role: 'owner' | 'admin' | 'trainer' | 'staff';
  phone?: string;
  email?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface GymClass {
  id: string;
  name: string;
  trainer_id: string | null;
  trainer_name?: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  is_active: boolean;
  booked_count?: number;
}

export interface ClassBooking {
  id: string;
  class_id: string;
  member_id: string;
  booking_date: string;
  status: 'booked' | 'checked_in' | 'cancelled' | 'no_show';
  checked_in_at?: string;
  member_name?: string;
  member_phone?: string;
  class_name?: string;
  start_time?: string;
  end_time?: string;
}

export interface AttendanceRecord {
  id: string;
  member_id: string;
  check_in_time: string;
  check_out_time?: string;
  method: string;
  class_id?: string;
  member_name?: string;
  member_phone?: string;
  class_name?: string;
}
