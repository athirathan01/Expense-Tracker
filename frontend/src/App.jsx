import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Stats from './components/Stats';
import ActivityGraph from './components/ActivityGraph';
import ExpenseList from './components/ExpenseList';

import IncomeStats from './components/IncomeStats';
import IncomeGraph from './components/IncomeGraph';
import IncomeList from './components/IncomeList';

import AddExpenseModal from './components/AddExpenseModal';
import AddIncomeModal from './components/AddIncomeModal';

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
  const [currentView, setCurrentView] = useState('dashboard');

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
      const expResponse = await fetch('http://localhost:3000/api/expenses');
      const expData = await expResponse.json();
      if (expData.success) {
        setExpenses(expData.data || []);
      }

      // Fetch dynamic incomes
      const incResponse = await fetch('http://localhost:3000/api/incomes');
      const incData = await incResponse.json();
      if (incData.success) {
        setIncomes(incData.data || []);
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
          const response = await fetch(`http://localhost:3000/api/expenses/${id}`, {
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
          const response = await fetch(`http://localhost:3000/api/incomes/${id}`, {
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
      />
      
      <div className="main">
        <Topbar 
          currentView={currentView}
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
          ) : currentView === 'dashboard' ? (
            <>
              <Stats expenses={expenses} />
              <ActivityGraph expenses={expenses} />
              <ExpenseList 
                expenses={expenses} 
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
                isAllIncomesView={false} 
                onEdit={handleEditIncome} 
                onDelete={handleDeleteIncome} 
              />
            </>
          ) : (
            <div className="all-expenses-view animate-fade-in">
              <ExpenseList 
                expenses={expenses} 
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
