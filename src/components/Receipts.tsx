import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Download, Trash2, Edit, Calendar, Filter, Receipt as ReceiptIcon } from 'lucide-react';
import { useReceipts, useClients } from '../hooks/useDatabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { exportService } from '../services/export';

interface ReceiptsProps {
  showForm?: boolean;
  onCloseForm?: () => void;
}

export default function Receipts({ showForm: externalShowForm, onCloseForm }: ReceiptsProps) {
  const { receipts, createReceipt, loading } = useReceipts();
  const { clients } = useClients();
  const { user } = useAuth();
  
  const [showForm, setShowForm] = useState(externalShowForm || false);
  const [editingReceipt, setEditingReceipt] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const [formData, setFormData] = useState({
    clientName: '',
    clientCnic: '',
    amount: '',
    natureOfWork: '',
    paymentMethod: 'cash' as 'cash' | 'bank_transfer' | 'cheque' | 'card' | 'online',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  React.useEffect(() => {
    if (externalShowForm !== undefined) {
      setShowForm(externalShowForm);
    }
  }, [externalShowForm]);

  const resetForm = () => {
    setFormData({
      clientName: '',
      clientCnic: '',
      amount: '',
      natureOfWork: '',
      paymentMethod: 'cash',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
    setEditingReceipt(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!/^\d{13}$/.test(formData.clientCnic)) {
      alert('CNIC must be exactly 13 digits');
      return;
    }

    try {
      await createReceipt({
        clientName: formData.clientName,
        clientCnic: formData.clientCnic,
        amount: parseInt(formData.amount.replace(/,/g, '')),
        natureOfWork: formData.natureOfWork,
        paymentMethod: formData.paymentMethod,
        date: new Date(formData.date),
        createdBy: user!.id,
      });
      
      resetForm();
      setShowForm(false);
      if (onCloseForm) {
        onCloseForm();
      }
    } catch (error) {
      console.error('Error creating receipt:', error);
      alert('Error creating receipt. Please try again.');
    }
  };

  const handleEdit = (receipt: any) => {
    setFormData({
      clientName: receipt.clientName,
      clientCnic: receipt.clientCnic,
      amount: receipt.amount.toString(),
      natureOfWork: receipt.natureOfWork,
      paymentMethod: receipt.paymentMethod,
      date: format(receipt.date, 'yyyy-MM-dd'),
    });
    setEditingReceipt(receipt);
    setShowForm(true);
  };

  const handlePreview = (receipt: any) => {
    setSelectedReceipt(receipt);
    setShowPreview(true);
  };

  const handleExport = async () => {
    try {
      await exportService.exportReceiptsToExcel(receipts, clients);
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting receipts');
    }
  };

  const filteredReceipts = receipts.filter(receipt => {
    const client = clients.find(c => c.cnic === receipt.clientCnic);
    const matchesSearch = !searchTerm || 
      receipt.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.clientCnic.includes(searchTerm) ||
      client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPaymentMethod = !filterPaymentMethod || receipt.paymentMethod === filterPaymentMethod;

    return matchesSearch && matchesPaymentMethod;
  });

  const totalRevenue = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ReceiptIcon className="w-7 h-7 text-blue-600" />
            Receipts
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Total Revenue: Rs. {totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={20} />
            Export
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            New Receipt
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Receipts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{receipts.length}</p>
            </div>
            <ReceiptIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
              <p className="text-2xl font-bold text-green-600">
                {receipts.filter(r => 
                  format(r.date, 'yyyy-MM') === format(new Date(), 'yyyy-MM')
                ).length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Amount</p>
              <p className="text-2xl font-bold text-purple-600">
                Rs. {receipts.length > 0 ? Math.round(totalRevenue / receipts.length).toLocaleString() : 0}
              </p>
            </div>
            <ReceiptIcon className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Clients</p>
              <p className="text-2xl font-bold text-orange-600">
                {new Set(receipts.map(r => r.clientCnic)).size}
              </p>
            </div>
            <ReceiptIcon className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by client name or CNIC..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <select
            value={filterPaymentMethod}
            onChange={(e) => setFilterPaymentMethod(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cheque">Cheque</option>
            <option value="card">Card</option>
            <option value="online">Online</option>
          </select>

          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Filter className="w-4 h-4 mr-2" />
            Showing {filteredReceipts.length} of {receipts.length} receipts
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  CNIC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredReceipts.map((receipt) => (
                <tr key={receipt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {format(receipt.date, 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {receipt.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {receipt.clientCnic}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                    Rs. {receipt.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 capitalize">
                      {receipt.paymentMethod.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePreview(receipt)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                        title="Preview Receipt"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(receipt)}
                        className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                        title="Edit Receipt"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReceipts.length === 0 && (
          <div className="text-center py-12">
            <ReceiptIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No receipts found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {receipts.length === 0 
                ? "Create your first receipt to get started" 
                : "Try adjusting your search or filter criteria"
              }
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Create Receipt
            </button>
          </div>
        )}
      </div>

      {/* Receipt Form Modal */}
      {showForm && (
        <div className="form-modal">
          <div className="form-container">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <ReceiptIcon className="w-5 h-5" />
              {editingReceipt ? 'Edit Receipt' : 'New Receipt'}
            </h2>
            
            <div className="max-h-[60vh] overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="Enter client name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Client CNIC *
                  </label>
                  <input
                    type="text"
                    value={formData.clientCnic}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 13);
                      setFormData({ ...formData, clientCnic: value });
                    }}
                    placeholder="Enter 13-digit CNIC"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    maxLength={13}
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Must be exactly 13 digits
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount *
                  </label>
                  <input
                    type="text"
                    value={formData.amount}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^\d]/g, '');
                      setFormData({
                        ...formData,
                        amount: digits ? parseInt(digits, 10).toLocaleString('en-PK') : '',
                      });
                    }}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nature of Work
                  </label>
                  <textarea
                    value={formData.natureOfWork}
                    onChange={(e) => setFormData({ ...formData, natureOfWork: e.target.value })}
                    placeholder="Describe the nature of work"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="card">Card</option>
                    <option value="online">Online</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </form>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                  if (onCloseForm) {
                    onCloseForm();
                  }
                }}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingReceipt ? 'Update Receipt' : 'Create Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Receipt Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Date:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {format(selectedReceipt.date, 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Client:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedReceipt.clientName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">CNIC:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedReceipt.clientCnic}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  Rs. {selectedReceipt.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Payment:</span>
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {selectedReceipt.paymentMethod.replace('_', ' ')}
                </span>
              </div>
              {selectedReceipt.natureOfWork && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Work:</span>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">
                    {selectedReceipt.natureOfWork}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}