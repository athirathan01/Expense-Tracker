import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Stats from './components/Stats';
import ActivityGraph from './components/ActivityGraph';
import ExpenseList from './components/ExpenseList';

import IncomeStats from './components/IncomeStats';
import IncomeGraph from './components/IncomeGraph';
import IncomeList from './components/IncomeList';

import OverallDashboard from './components/OverallDashboard';

import AddExpenseModal from './components/AddExpenseModal';
import AddIncomeModal from './components/AddIncomeModal';
import { API_BASE_URL } from './config/api';

function App() {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  
  // CRUD States
  const [editExpense, setEditExpense] = useState(null);
  const [editIncome, setEditIncome] = useState(null);

  // Custom Toast State
  const [toasts, setToasts] = useState([]);

  // Custom Confirmation Modal State
  const [confirmData, setConfirmData] = useState(null); // { message, onConfirm }

  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('overall-dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Clear search query when currentView changes
  useEffect(() => {
    setSearchQuery('');
  }, [currentView]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const fetchData = async () => {
    try {
      // Fetch dynamic expenses
      const expResponse = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/expenses`);
      const expData = await expResponse.json();
      if (expData.success) {
        const sortedExpenses = (expData.data || []).sort((a, b) => {
          const dateA = a.Expense_Date ? new Date(a.Expense_Date).getTime() : 0;
          const dateB = b.Expense_Date ? new Date(b.Expense_Date).getTime() : 0;
          const isNaNA = isNaN(dateA);
          const isNaNB = isNaN(dateB);
          if (isNaNA && isNaNB) return String(b.id || '').localeCompare(String(a.id || ''));
          if (isNaNA) return 1;
          if (isNaNB) return -1;
          if (dateB !== dateA) {
            return dateB - dateA;
          }
          return String(b.id || '').localeCompare(String(a.id || ''));
        });
        setExpenses(sortedExpenses);
      }

      // Fetch dynamic incomes
      const incResponse = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/incomes`);
      const incData = await incResponse.json();
      if (incData.success) {
        const sortedIncomes = (incData.data || []).sort((a, b) => {
          const dateA = a.Income_Date ? new Date(a.Income_Date).getTime() : 0;
          const dateB = b.Income_Date ? new Date(b.Income_Date).getTime() : 0;
          const isNaNA = isNaN(dateA);
          const isNaNB = isNaN(dateB);
          if (isNaNA && isNaNB) return String(b.id || '').localeCompare(String(a.id || ''));
          if (isNaNA) return 1;
          if (isNaNB) return -1;
          if (dateB !== dateA) {
            return dateB - dateA;
          }
          return String(b.id || '').localeCompare(String(a.id || ''));
        });
        setIncomes(sortedIncomes);
      }

      // Fetch current user details
      try {
        const userResponse = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/current-user`);
        const userData = await userResponse.json();
        if (userData.success) {
          setCurrentUser(userData.data);
        }
      } catch (err) {
        console.error("Error fetching current user details:", err);
      }
    } catch (error) {
      console.error("Error fetching dynamic CRM data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // CRUD Handlers
  const handleEditExpense = (record) => {
    setEditExpense(record);
    setIsExpenseModalOpen(true);
  };

  const handleDeleteExpense = (id) => {
    setConfirmData({
      message: "Are you sure you want to delete this expense from Zoho CRM?",
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/expenses/${id}`, {
            method: 'DELETE'
          });
          const data = await response.json();
          if (data.success) {
            showToast("Expense deleted successfully!", "success");
            fetchData();
          } else {
            showToast("Failed to delete expense: " + (data.error || 'Unknown error'), "error");
          }
        } catch (err) {
          showToast("Error: " + err.message, "error");
        }
      }
    });
  };

  const handleEditIncome = (record) => {
    setEditIncome(record);
    setIsIncomeModalOpen(true);
  };

  const handleDeleteIncome = (id) => {
    setConfirmData({
      message: "Are you sure you want to delete this income from Zoho CRM?",
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/incomes/${id}`, {
            method: 'DELETE'
          });
          const data = await response.json();
          if (data.success) {
            showToast("Income deleted successfully!", "success");
            fetchData();
          } else {
            showToast("Failed to delete income: " + (data.error || 'Unknown error'), "error");
          }
        } catch (err) {
          showToast("Error: " + err.message, "error");
        }
      }
    });
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const uniqueExpenseCategoriesCount = new Set(
    expenses.map(exp => exp.Expense_Type?.id).filter(Boolean)
  ).size;

  return (
    <div className="shell">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        expensesCount={expenses.length}
        categoriesCount={uniqueExpenseCategoriesCount}
        currentUser={currentUser}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />
      
      <div className="main">
        <Topbar 
          currentView={currentView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
          onAddExpense={() => {
            setEditExpense(null);
            setIsExpenseModalOpen(true);
          }} 
          onAddIncome={() => {
            setEditIncome(null);
            setIsIncomeModalOpen(true);
          }}
        />
        
        <div className="content">
          {loading ? (
            <div style={{ color: 'var(--text3)', padding: '40px', textAlign: 'center' }}>Loading dashboard data...</div>
          ) : currentView === 'overall-dashboard' ? (
            <OverallDashboard
              expenses={expenses}
              incomes={incomes}
              searchQuery={searchQuery}
              onEditExpense={handleEditExpense}
              onDeleteExpense={handleDeleteExpense}
              onEditIncome={handleEditIncome}
              onDeleteIncome={handleDeleteIncome}
            />
          ) : currentView === 'dashboard' ? (
            <>
              <Stats expenses={expenses} />
              <ActivityGraph expenses={expenses} />
              <ExpenseList 
                expenses={expenses} 
                searchQuery={searchQuery}
                isAllExpensesView={false} 
                onEdit={handleEditExpense} 
                onDelete={handleDeleteExpense} 
                onViewAll={() => setCurrentView('all-expenses')}
              />
            </>
          ) : currentView === 'income-dashboard' ? (
            <>
              <IncomeStats incomes={incomes} />
              <IncomeGraph incomes={incomes} />
              <IncomeList 
                incomes={incomes} 
                searchQuery={searchQuery}
                isAllIncomesView={false} 
                onEdit={handleEditIncome} 
                onDelete={handleDeleteIncome} 
              />
            </>
          ) : (
            <div className="all-expenses-view animate-fade-in">
              <ExpenseList 
                expenses={expenses} 
                searchQuery={searchQuery}
                isAllExpensesView={true} 
                onEdit={handleEditExpense} 
                onDelete={handleDeleteExpense} 
              />
            </div>
          )}
        </div>
      </div>

      <AddExpenseModal 
        isOpen={isExpenseModalOpen} 
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditExpense(null);
        }} 
        onSaveSuccess={fetchData}
        editRecord={editExpense}
        showToast={showToast}
      />
      <AddIncomeModal 
        isOpen={isIncomeModalOpen} 
        onClose={() => {
          setIsIncomeModalOpen(false);
          setEditIncome(null);
        }} 
        onSaveSuccess={fetchData}
        editRecord={editIncome}
        showToast={showToast}
      />

      {/* Premium Custom Toast Container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast-card toast-${t.type}`}>
            <i className={t.type === 'success' ? 'ti ti-circle-check' : 'ti ti-alert-triangle'}></i>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Premium Custom Confirmation Modal */}
      {confirmData && (
        <div className="modal-overlay" style={{ zIndex: 100000 }}>
          <div className="modal-content animate-fade-in" style={{ width: '380px', textAlign: 'center', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <i className="ti ti-alert-triangle" style={{ fontSize: '38px', color: '#f85149', marginBottom: '12px', display: 'block' }}></i>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: 'var(--text)' }}>Confirm Action</h4>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text2)', lineHeight: '1.5' }}>
              {confirmData.message}
            </p>
            <div className="modal-actions" style={{ justifyContent: 'center', gap: '12px' }}>
              <button className="btn" onClick={() => setConfirmData(null)}>Cancel</button>
              <button 
                className="btn btn-danger" 
                onClick={() => {
                  confirmData.onConfirm();
                  setConfirmData(null);
                }}
                style={{ background: '#f85149', borderColor: '#f85149', color: 'white' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
