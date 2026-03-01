import { Member } from '../types';

const API_URL = '/api';

export const api = {
  async login(username: string, password: string) {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  async getMembers(): Promise<Member[]> {
    const res = await fetch(`${API_URL}/members`);
    if (!res.ok) throw new Error('Failed to fetch members');
    return res.json();
  },

  async addMember(member: Omit<Member, 'id' | 'status'>): Promise<Member> {
    const res = await fetch(`${API_URL}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    });
    if (!res.ok) throw new Error('Failed to add member');
    return res.json();
  },

  async updateMember(id: string, member: Partial<Member>): Promise<Member> {
    const res = await fetch(`${API_URL}/members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    });
    if (!res.ok) throw new Error('Failed to update member');
    return res.json();
  },

  async deleteMember(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/members/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete member');
  },

  async getWhatsAppStatus(): Promise<{ ready: boolean; qrCode: string | null }> {
    const res = await fetch(`${API_URL}/whatsapp/status`);
    if (!res.ok) throw new Error('Failed to fetch WhatsApp status');
    return res.json();
  },

  async sendWhatsApp(to: string, message: string): Promise<any> {
    const res = await fetch(`${API_URL}/send-whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, message }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to send WhatsApp message');
    }
    return res.json();
  }
};
