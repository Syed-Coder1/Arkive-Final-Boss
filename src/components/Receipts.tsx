import React, { useState, useEffect } from 'react';
import { Receipt, ReceiptFormData } from '../types';
import ReceiptPreview from './ReceiptPreview';

interface ReceiptFormProps {
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  onAddReceipt: (receipt: Receipt) => void;
  onUpdateReceipt: (receipt: Receipt) => void;
  editingReceipt: Receipt | null;
  setEditingReceipt: (receipt: Receipt | null) => void;
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
  selectedReceipt: Receipt | null;
  setSelectedReceipt: (receipt: Receipt | null) => void;
}

const ReceiptForm: React.FC<ReceiptFormProps> = ({
  showForm,
  setShowForm,
  onAddReceipt,
  onUpdateReceipt,
  editingReceipt,
  setEditingReceipt,
  showPreview,
  setShowPreview,
  selectedReceipt,
  setSelectedReceipt,
}) => {
  const [formData, setFormData] = useState<ReceiptFormData>({
    clientName: '',
    clientCnic: '',
    amount: '',
    natureOfWork: '',
    paymentMethod: 'cash',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (editingReceipt) {
      setFormData({
        clientName: editingReceipt.clientName,
        clientCnic: editingReceipt.clientCnic,
        amount: editingReceipt.amount.toLocaleString('en-PK'),
        natureOfWork: editingReceipt.natureOfWork,
        paymentMethod: editingReceipt.paymentMethod,
        date: editingReceipt.date,
      });
    }
  }, [editingReceipt]);

  const resetForm = () => {
    setFormData({
      clientName: '',
      clientCnic: '',
      amount: '',
      natureOfWork: '',
      paymentMethod: 'cash',
      date: new Date().toISOString().split('T')[0],
    });
    setEditingReceipt(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReceipt: Receipt = {
      id: Date.now(),
      ...formData,
      amount: parseInt(formData.amount.replace(/,/g, '')),
    };
    onAddReceipt(newReceipt);
    resetForm();
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReceipt) return;
    const updatedReceipt: Receipt = {
      id: editingReceipt.id,
      ...formData,
      amount: parseInt(formData.amount.replace(/,/g, '')),
    };
    onUpdateReceipt(updatedReceipt);
    resetForm();
  };

  const handlePreview = () => {
    const receipt: Receipt = {
      id: editingReceipt ? editingReceipt.id : Date.now(),
      ...formData,
      amount: parseInt(formData.amount.replace(/,/g, '')),
    };
    setSelectedReceipt(receipt);
    setShowPreview(true);
  };

  if (!showForm) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg w-full max-w-xl">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          {editingReceipt ? 'Edit Receipt' : 'New Receipt'}
        </h2>
        <div className="max-h-[60vh] overflow-y-auto">
          <form onSubmit={editingReceipt ? handleUpdate : handleSubmit} className="space-y-4">
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

            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePreview}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-yellow-200 dark:bg-yellow-700 rounded-lg hover:bg-yellow-300 dark:hover:bg-yellow-600 transition-colors"
              >
                Preview
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingReceipt ? 'Update Receipt' : 'Create Receipt'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReceiptForm;