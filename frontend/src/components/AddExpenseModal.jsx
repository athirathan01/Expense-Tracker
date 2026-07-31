import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const AddExpenseModal = ({ isOpen, onClose, onSaveSuccess, editRecord, showToast }) => {
  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState({
    typeId: '',
    amount: '',
    date: getTodayDate(),
    paymentMethod: '',
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Custom Dropdown Open States
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (categories.length === 0) {
        fetchCategories();
      }
      if (editRecord) {
        setFormData({
          typeId: editRecord.Expense_Type?.id || '',
          amount: editRecord.Amount || '',
          date: editRecord.Expense_Date || getTodayDate(),
          paymentMethod: editRecord.Payment_Method || '',
          note: editRecord.Note || ''
        });
      }
    } else {
      setFormData({
        typeId: '',
        amount: '',
        date: getTodayDate(),
        paymentMethod: '',
        note: ''
      });
      setIsTypeDropdownOpen(false);
      setIsPaymentDropdownOpen(false);
    }
  }, [isOpen, editRecord]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await fetch(`${API_BASE_URL}/expense-categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (isSaveAndNew = false) => {
    // Validation
    if (!formData.typeId || !formData.amount || !formData.date || !formData.paymentMethod || !formData.note) {
      if (showToast) showToast('Please fill in all mandatory fields!', 'error');
      return;
    }
    if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      if (showToast) showToast('Please enter a valid amount greater than 0!', 'error');
      return;
    }

    setLoading(true);

    // Find the name of the selected category for the backend
    const selectedCategory = categories.find(c => c.id === formData.typeId);
    const typeName = selectedCategory ? selectedCategory.name : '';

    const payload = {
      ...formData,
      typeName
    };

    const url = editRecord
      ? `${API_BASE_URL}/expenses/${editRecord.id}`
      : `${API_BASE_URL}/expenses`;
    const method = editRecord ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        if (showToast) showToast(editRecord ? 'Expense updated successfully!' : 'Expense saved to Zoho successfully!', 'success');
        setFormData({ typeId: '', amount: '', date: getTodayDate(), paymentMethod: '', note: '' });
        if (onSaveSuccess) onSaveSuccess();
        if (!isSaveAndNew) {
          onClose();
        }
      } else {
        if (showToast) showToast('Failed to save expense: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (err) {
      if (showToast) showToast('Network error: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>

        <div className="form-group">
          <div className="form-label">Expense Type <span style={{ color: 'var(--red)' }}>*</span></div>
          <div className="form-input-wrap">
            <div
              className={`form-input custom-select-trigger ${isTypeDropdownOpen ? 'active' : ''}`}
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}
            >
              <span>
                {formData.typeId
                  ? (categories.find(c => c.id === formData.typeId)?.name || "")
                  : (loadingCategories ? "Loading..." : "")}
              </span>
              <i className="ti ti-chevron-down" style={{ color: 'var(--text3)' }}></i>
            </div>
            {isTypeDropdownOpen && (
              <>
                <div className="custom-dropdown-overlay" onClick={() => setIsTypeDropdownOpen(false)} />
                <div className="custom-dropdown-list">
                  {categories.map(cat => (
                    <div
                      key={cat.id}
                      className="custom-dropdown-item"
                      onClick={() => {
                        setFormData({ ...formData, typeId: cat.id });
                        setIsTypeDropdownOpen(false);
                      }}
                    >
                      {cat.name}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="form-group">
          <div className="form-label">Amount <span style={{ color: 'var(--red)' }}>*</span></div>
          <div className="form-input-wrap">
            <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="form-input" />
          </div>
        </div>

        <div className="form-group">
          <div className="form-label">Expense Date <span style={{ color: 'var(--red)' }}>*</span></div>
          <div className="form-input-wrap">
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="form-input"
              onClick={(e) => {
                try {
                  e.target.showPicker();
                } catch (err) {
                  console.warn("showPicker not supported", err);
                }
              }}
            />
            <i className="ti ti-calendar select-icon"></i>
          </div>
        </div>

        <div className="form-group">
          <div className="form-label">Payment Method <span style={{ color: 'var(--red)' }}>*</span></div>
          <div className="form-input-wrap">
            <div
              className={`form-input custom-select-trigger ${isPaymentDropdownOpen ? 'active' : ''}`}
              onClick={() => setIsPaymentDropdownOpen(!isPaymentDropdownOpen)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}
            >
              <span>{formData.paymentMethod || ""}</span>
              <i className="ti ti-chevron-down" style={{ color: 'var(--text3)' }}></i>
            </div>
            {isPaymentDropdownOpen && (
              <>
                <div className="custom-dropdown-overlay" onClick={() => setIsPaymentDropdownOpen(false)} />
                <div className="custom-dropdown-list">
                  {['Cash', 'Credit Card', 'Debit Card', 'UPI'].map(method => (
                    <div
                      key={method}
                      className="custom-dropdown-item"
                      onClick={() => {
                        setFormData({ ...formData, paymentMethod: method });
                        setIsPaymentDropdownOpen(false);
                      }}
                    >
                      {method}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="form-group">
          <div className="form-label">Note <span style={{ color: 'var(--red)' }}>*</span></div>
          <div className="form-input-wrap">
            <textarea name="note" value={formData.note} onChange={handleChange} className="form-input"></textarea>
            <i className="ti ti-line-dashed select-icon" style={{ top: 'auto', bottom: '8px', transform: 'none' }}></i>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose} disabled={loading}>Cancel</button>
          {!editRecord && (
            <button className="btn" onClick={() => handleSave(true)} disabled={loading} style={{ color: 'var(--blue)', borderColor: 'rgba(88, 166, 255, 0.3)' }}>
              Save & New
            </button>
          )}
          <button className="btn btn-primary" onClick={() => handleSave(false)} disabled={loading}>
            {editRecord ? (loading ? 'Updating...' : 'Update') : (loading ? 'Saving...' : 'Save')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddExpenseModal;
