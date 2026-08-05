import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Stats from './components/Stats';
import ActivityGraph from './components/ActivityGraph';
import ExpenseList from './components/ExpenseList';
import IncomeStats from './components/IncomeStats';
import IncomeList from './components/IncomeList';
import OverallDashboard from './components/OverallDashboard';
import AddExpenseModal from './components/AddExpenseModal';
import AddIncomeModal from './components/AddIncomeModal';
import ConfirmModal from './components/ConfirmModal';
import { API_BASE_URL } from './config/api';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('overall-dashboard');
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Confirmation
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editIncome, setEditIncome] = useState(null);
  const [confirmData, setConfirmData] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Time Filter State for Overall Dashboard
  const formatDateForInput = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const now = new Date();

  const [timeFilter, setTimeFilter] = useState({
    mode: 'all', // 'all' | 'year' | 'month' | 'week' | 'day' | 'custom'
    year: now.getFullYear(),
    month: now.getMonth(),
    date: formatDateForInput(now),
    customFrom: '',
    customTo: ''
  });

  const availableYears = useMemo(() => {
    const set = new Set([now.getFullYear()]);
    [...expenses, ...incomes].forEach(item => {
      const d = item.Expense_Date || item.Income_Date;
      if (d) {
        const yr = new Date(d).getFullYear();
        if (!isNaN(yr)) set.add(yr);
      }
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [expenses, incomes]);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Fetch initial data from Catalyst Serverless / CRM API
  const fetchData = async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
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

      setLastSyncedTime(new Date());
    } catch (error) {
      console.error("Error fetching dynamic CRM data:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load + 30s Auto-Refresh Interval
  useEffect(() => {
    fetchData(false);

    const interval = setInterval(() => {
      if (autoRefreshEnabled) {
        fetchData(true); // Silent background fetch every 30 seconds
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled]);

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
            fetchData(false);
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
            fetchData(false);
          } else {
            showToast("Failed to delete income: " + (data.error || 'Unknown error'), "error");
          }
        } catch (err) {
          showToast("Error: " + err.message, "error");
        }
      }
    });
  };

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
          timeFilter={timeFilter}
          setTimeFilter={setTimeFilter}
          availableYears={availableYears}
          isRefreshing={isRefreshing}
          onRefreshNow={() => fetchData(false)}
          lastSyncedTime={lastSyncedTime}
          autoRefreshEnabled={autoRefreshEnabled}
          onToggleAutoRefresh={() => setAutoRefreshEnabled(prev => !prev)}
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
              timeFilter={timeFilter}
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
                onEditExpense={handleEditExpense} 
                onDeleteExpense={handleDeleteExpense} 
              />
            </>
          ) : currentView === 'income-dashboard' ? (
            <>
              <IncomeStats incomes={incomes} />
              <IncomeList 
                incomes={incomes} 
                searchQuery={searchQuery} 
                onEditIncome={handleEditIncome} 
                onDeleteIncome={handleDeleteIncome} 
              />
            </>
          ) : (
            <ExpenseList 
              expenses={expenses} 
              searchQuery={searchQuery} 
              onEditExpense={handleEditExpense} 
              onDeleteExpense={handleDeleteExpense} 
            />
          )}
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {isExpenseModalOpen && (
        <AddExpenseModal 
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          onSuccess={() => {
            showToast(editExpense ? "Expense updated successfully!" : "Expense added successfully!", "success");
            fetchData(false);
          }}
          editRecord={editExpense}
        />
      )}

      {/* Add / Edit Income Modal */}
      {isIncomeModalOpen && (
        <AddIncomeModal 
          isOpen={isIncomeModalOpen}
          onClose={() => setIsIncomeModalOpen(false)}
          onSuccess={() => {
            showToast(editIncome ? "Income updated successfully!" : "Income added successfully!", "success");
            fetchData(false);
          }}
          editRecord={editIncome}
        />
      )}

      {/* Custom Global Confirm Modal */}
      {confirmData && (
        <ConfirmModal
          isOpen={!!confirmData}
          message={confirmData.message}
          onConfirm={() => {
            confirmData.onConfirm();
            setConfirmData(null);
          }}
          onCancel={() => setConfirmData(null)}
        />
      )}

      {/* Toast Notification Card */}
      {toast && (
        <div className="toast-container">
          <div className={`toast-card toast-${toast.type}`}>
            <i className={toast.type === 'success' ? 'ti ti-circle-check' : 'ti ti-alert-circle'}></i>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
