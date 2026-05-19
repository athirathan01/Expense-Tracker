import React, { useState, useEffect } from 'react';

const AddIncomeModal = ({ isOpen, onClose, onSaveSuccess, editRecord, showToast }) => {
  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState({
    typeId: '',
    amount: '',
    date: getTodayDate(),
    receivedTo: '',
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Custom Dropdown Open States
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isReceivedDropdownOpen, setIsReceivedDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (categories.length === 0) {
        fetchCategories();
      }
      if (editRecord) {
        setFormData({
          typeId: editRecord.Income_Type?.id || '',
          amount: editRecord.Amount || '',
          date: editRecord.Income_Date || getTodayDate(),
          receivedTo: editRecord.Payment_Mode || '',
          note: editRecord.Note || ''
        });
      }
    } else {
      setFormData({
        typeId: '',
        amount: '',
        date: getTodayDate(),
        receivedTo: '',
        note: ''
      });
      setIsTypeDropdownOpen(false);
      setIsReceivedDropdownOpen(false);
    }
  }, [isOpen, editRecord]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await fetch('http://localhost:3000/api/income-categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch income categories', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    
    // Find the name of the selected category for the backend
    const selectedCategory = categories.find(c => c.id === formData.typeId);
    const typeName = selectedCategory ? selectedCategory.name : '';
    
    const payload = {
      ...formData,
      typeName
    };

    const url = editRecord 
      ? `http://localhost:3000/api/incomes/${editRecord.id}` 
      : 'http://localhost:3000/api/incomes';
    const method = editRecord ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        if (showToast) showToast(editRecord ? 'Income updated successfully!' : 'Income saved to Zoho successfully!', 'success');
        setFormData({ typeId: '', amount: '', date: getTodayDate(), receivedTo: '', note: '' });
        if (onSaveSuccess) onSaveSuccess();
        onClose();
      } else {
        if (showToast) showToast('Failed to save income: ' + (data.error || 'Unknown error'), 'error');
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
          <div className="form-label">Income Type</div>
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
          <div className="form-label">Amount</div>
          <div className="form-input-wrap">
            <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="form-input" />
          </div>
        </div>

        <div className="form-group">
          <div className="form-label">Income Date</div>
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
          <div className="form-label">Received To</div>
          <div className="form-input-wrap">
            <div 
              className={`form-input custom-select-trigger ${isReceivedDropdownOpen ? 'active' : ''}`}
              onClick={() => setIsReceivedDropdownOpen(!isReceivedDropdownOpen)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}
            >
              <span>{formData.receivedTo || ""}</span>
              <i className="ti ti-chevron-down" style={{ color: 'var(--text3)' }}></i>
            </div>
            {isReceivedDropdownOpen && (
              <>
                <div className="custom-dropdown-overlay" onClick={() => setIsReceivedDropdownOpen(false)} />
                <div className="custom-dropdown-list">
                  {['Cash', 'Bank Account', 'UPI'].map(mode => (
                    <div 
                      key={mode} 
                      className="custom-dropdown-item"
                      onClick={() => {
                        setFormData({ ...formData, receivedTo: mode });
                        setIsReceivedDropdownOpen(false);
                      }}
                    >
                      {mode}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="form-group">
          <div className="form-label">Note</div>
          <div className="form-input-wrap">
            <textarea name="note" value={formData.note} onChange={handleChange} className="form-input"></textarea>
            <i className="ti ti-line-dashed select-icon" style={{ top: 'auto', bottom: '8px', transform: 'none' }}></i>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading} style={{ background: 'var(--blue)', borderColor: 'var(--blue)' }}>
            {editRecord ? (loading ? 'Updating...' : 'Update') : (loading ? 'Saving...' : 'Save')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddIncomeModal;
