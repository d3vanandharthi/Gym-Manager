import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { Member } from './types';
import { Users, LogOut, Plus, Search, Trash2, Edit, MessageCircle, AlertCircle, Smartphone, CheckCircle2 } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    joinDate: format(new Date(), 'yyyy-MM-dd'),
    expiryDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
  });

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [whatsappStatus, setWhatsappStatus] = useState<{ ready: boolean; qrCode: string | null }>({ ready: false, qrCode: null });
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      fetchMembers();
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAuthenticated) {
      const checkStatus = async () => {
        try {
          const status = await api.getWhatsAppStatus();
          setWhatsappStatus(status);
          if (status.ready) setShowQrModal(false);
        } catch (err) {
          console.error('Failed to fetch WhatsApp status');
        }
      };
      checkStatus();
      interval = setInterval(checkStatus, 5000);
    }
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await api.login(username, password);
      localStorage.setItem('token', data.token);
      setIsAuthenticated(true);
      setLoginError('');
      fetchMembers();
    } catch (err) {
      setLoginError('Invalid credentials. Use admin/admin');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setMembers([]);
  };

  const fetchMembers = async () => {
    try {
      const data = await api.getMembers();
      // Update status based on expiry date
      const updatedMembers = data.map(m => {
        const isExpired = isPast(new Date(m.expiryDate)) && !isToday(new Date(m.expiryDate));
        return { ...m, status: isExpired ? 'expired' : 'active' };
      });
      setMembers(updatedMembers);
    } catch (err) {
      console.error('Failed to fetch members');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await api.updateMember(editingMember.id, formData);
        showNotification('Member updated successfully', 'success');
      } else {
        await api.addMember(formData);
        showNotification('Member added successfully', 'success');
      }
      setIsAdding(false);
      setEditingMember(null);
      resetForm();
      fetchMembers();
    } catch (err) {
      showNotification('Failed to save member', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        await api.deleteMember(id);
        showNotification('Member deleted successfully', 'success');
        fetchMembers();
      } catch (err) {
        showNotification('Failed to delete member', 'error');
      }
    }
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      phone: member.phone,
      email: member.email,
      joinDate: member.joinDate,
      expiryDate: member.expiryDate,
    });
    setIsAdding(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      joinDate: format(new Date(), 'yyyy-MM-dd'),
      expiryDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
    });
  };

  const handleSendWhatsApp = async (member: Member) => {
    try {
      const message = `Hello ${member.name}, your gym membership expired on ${member.expiryDate}. Please renew it to continue enjoying our services.`;
      await api.sendWhatsApp(member.phone, message);
      showNotification(`WhatsApp message sent to ${member.name}`, 'success');
    } catch (err: any) {
      showNotification(err.message || 'Failed to send WhatsApp message', 'error');
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.phone.includes(searchQuery)
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="bg-zinc-900 p-3 rounded-xl">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-center text-zinc-900 mb-2">Gym Manager</h1>
          <p className="text-zinc-500 text-center mb-8">Sign in to manage memberships</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                placeholder="admin"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                placeholder="admin"
                required
              />
            </div>
            {loginError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {loginError}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-zinc-900 text-white py-2.5 rounded-xl font-medium hover:bg-zinc-800 transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 p-2 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold">Gym Manager</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => !whatsappStatus.ready && setShowQrModal(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                whatsappStatus.ready 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 cursor-pointer'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              {whatsappStatus.ready ? 'WhatsApp Connected' : 'Connect WhatsApp'}
            </button>
            <div className="w-px h-6 bg-zinc-200"></div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors px-3 py-2 rounded-lg hover:bg-zinc-100"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showQrModal && !whatsappStatus.ready && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
              <h3 className="text-xl font-semibold mb-2">Connect WhatsApp</h3>
              <p className="text-zinc-500 text-sm mb-6">Scan this QR code with your WhatsApp app to link your account for automated messages.</p>
              
              {whatsappStatus.qrCode ? (
                <div className="bg-white p-4 rounded-xl border border-zinc-200 inline-block mb-6">
                  <img src={whatsappStatus.qrCode} alt="WhatsApp QR Code" className="w-48 h-48" />
                </div>
              ) : (
                <div className="w-48 h-48 mx-auto bg-zinc-100 rounded-xl border border-zinc-200 flex items-center justify-center mb-6">
                  <div className="w-6 h-6 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin"></div>
                </div>
              )}
              
              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 border border-zinc-300 text-zinc-700 rounded-xl font-medium hover:bg-zinc-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {notification && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            notification.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">{notification.message}</p>
          </div>
        )}

        {isAdding ? (
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">{editingMember ? 'Edit Member' : 'Add New Member'}</h2>
              <button
                onClick={() => { setIsAdding(false); setEditingMember(null); resetForm(); }}
                className="text-zinc-500 hover:text-zinc-900"
              >
                Cancel
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none"
                    placeholder="+1234567890"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Include country code (e.g., +1)</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Join Date</label>
                  <input
                    type="date"
                    required
                    value={formData.joinDate}
                    onChange={e => setFormData({...formData, joinDate: e.target.value})}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={e => setFormData({...formData, expiryDate: e.target.value})}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsAdding(false); setEditingMember(null); resetForm(); }}
                  className="px-5 py-2.5 border border-zinc-300 text-zinc-700 rounded-xl font-medium hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors"
                >
                  {editingMember ? 'Save Changes' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search members by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none shadow-sm"
                />
              </div>
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-zinc-800 transition-colors w-full sm:w-auto justify-center shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Add Member
              </button>
            </div>

            {/* Members List */}
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-sm font-medium text-zinc-500">
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4">Membership Dates</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                          No members found.
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-zinc-900">{member.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-zinc-600">{member.phone}</div>
                            <div className="text-xs text-zinc-400">{member.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-zinc-600">Joined: {member.joinDate}</div>
                            <div className="text-sm text-zinc-600">Expires: {member.expiryDate}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              member.status === 'active' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {member.status === 'active' ? 'Active' : 'Expired'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {member.status === 'expired' && (
                                <button
                                  onClick={() => handleSendWhatsApp(member)}
                                  title="Send WhatsApp Reminder"
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleEdit(member)}
                                title="Edit Member"
                                className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(member.id)}
                                title="Delete Member"
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;

