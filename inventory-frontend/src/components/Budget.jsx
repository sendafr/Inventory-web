// src/components/Budget.jsx
import React, { useState, useEffect ,useMemo} from 'react';
// Updated import to use 'budgetAPI' instead of 'accountingAPI'
import { budgetAPI } from '../api/api'; 
import '../styles/Budget.css'; // Optional: Add custom styles for the budget page
import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell } from 'docx';
import { PDFViewer, Document as PDFDoc, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';


const BudgetPage = () => {
  const [activeTab, setActiveTab] = useState('budgets');
  const [budgets, setBudgets] = useState([]);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [budgetData, setBudgetData] = useState([0]); // For charts
  const [chartData, setChartData] = useState({ category: [], incomeExpense: [] });
  const [exportToExcel, setExportToExcel] = useState(false);
  const [exportToWord, setExportToWord] = useState(false);



  // --- PDF Styles ---
const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica' },
  header: { fontSize: 20, marginBottom: 20, fontWeight: 'bold', textAlign: 'center' },
  row: { flexDirection: 'row', borderBottom: 1, borderColor: '#000', paddingVertical: 5 },
  label: { width: '25%', fontSize: 10 },
  value: { width: '75%', fontSize: 10 }
});

const ReceiptPDF = ({ budgetData }) => (
  <PDFDoc>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Personal Accounting Report</Text>
      <Text style={{ marginBottom: 10, fontSize: 10 }}>Generated: {new Date().toLocaleDateString()}</Text>
      {budgetData.map((t, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.label}>{t.date}</Text>
          <Text style={styles.value}>{t.description} ({t.category}) - {t.amount}</Text>
        </View>
      ))}
    </Page>
  </PDFDoc>
);

// --- Chart Components ---
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const SpendingByCategory = ({ data }) => {
  const chartData = useMemo(() => {
    const grouped = data.reduce((acc, curr) => {
      if (curr.type === 'expense') {
        acc[curr.category] = (acc[curr.category] || 0) + parseFloat(curr.amount);
      }
      return acc;
    }, {});
    return Object.keys(grouped).map(key => ({ name: key, value: grouped[key] }));
  }, [data]);

  if (chartData.length === 0) return <div className="card"><h3>Spending by Category</h3><p>No expense data available.</p></div>;

  return (
    <div className="card">
      <h3>Spending by Category</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" labelLine={false} 
             label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
             outerRadius={80} fill="#8884d8" dataKey="value">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const IncomeVsExpense = ({ data }) => {
  const chartData = useMemo(() => {
    const grouped = data.reduce((acc, curr) => {
      const dateKey = curr.date;
      if (!acc[dateKey]) acc[dateKey] = { date: dateKey, income: 0, expense: 0 };
      if (curr.type === 'income') acc[dateKey].income += parseFloat(curr.amount);
      else acc[dateKey].expense += parseFloat(curr.amount);
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [data]);

  if (chartData.length === 0) return <div className="card"><h3>Income vs. Expenses</h3><p>No data available.</p></div>;

  return (
    <div className="card">
      <h3>Income vs. Expenses</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="income" fill="#10b981" name="Income" />
          <Bar dataKey="expense" fill="#ef4444" name="Expense" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};


  // Form States
  const [newBudget, setNewBudget] = useState({ category: 'Food', limit_amount: '', period: 'monthly' });
  const [newTodo, setNewTodo] = useState({ title: '', due_date: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // budgetAPI.getBudgets() returns response.data directly
      const budgetData = await budgetAPI.getBudgets();
      const todoData = await budgetAPI.getTodos();
     

      setBudgets(budgetData);
      setTodos(todoData);
     
    } catch (err) {
      console.error('Fetch Error:', err);
      
      // Specific error handling for auth issues
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('You are not logged in or your session has expired. Please log in again.');
      } else {
        setError(err.message || 'Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Budget Handlers ---
  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    try {
      await budgetAPI.createBudget(newBudget);
      setNewBudget({ category: 'Food', limit_amount: '', period: 'monthly' });
      fetchData();
    } catch (err) {
      alert('Error creating budget: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteBudget = async (id) => {
    if (window.confirm('Delete this budget?')) {
      try {
        await budgetAPI.deleteBudget(id);
        fetchData();
      } catch (err) {
        alert('Error deleting budget');
      }
    }
  };

  // --- Todo Handlers ---
  const handleTodoSubmit = async (e) => {
    e.preventDefault();
    if (!newTodo.title.trim()) return;
    try {
      await budgetAPI.createTodo(newTodo);
      setNewTodo({ title: '', due_date: '' });
      fetchData();
    } catch (err) {
      alert('Error creating todo: ' + (err.message || 'Unknown error'));
    }
  };

  const toggleTodo = async (todo) => {
    try {
      await budgetAPI.updateTodo(todo.id, { is_completed: !todo.is_completed });
      fetchData();
    } catch (err) {
      alert('Error updating todo');
    }
  };

  const handleDeleteTodo = async (id) => {
    if (window.confirm('Delete this task?')) {
      try {
        await budgetAPI.deleteTodo(id);
        fetchData();
      } catch (err) {
        alert('Error deleting task');
      }
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Loading...</div>;
  if (error) return (
    <div className="budget-container">
      <h2 className="text-xl font-bold mb-2">Error</h2>
      <p>{error}</p>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Reload Page
      </button>
    </div>
  );

  return (
    <div className="budget-container">
      <h1 className="budget-header">Budget & To-Do List</h1>

      {/* Tabs */}
      <div className="budget-tabs ">
        <button 
          onClick={() => setActiveTab('budgets')} 
          className={`tab-btn ${activeTab === 'budgets' ? 'active' : ''}`}
        >
          Budgets
        </button>
        <button 
          onClick={() => setActiveTab('todos')} 
          className={`tab-btn ${activeTab === 'todos' ? 'active' : ''}`}
        >
          To-Do List
        </button>
      </div>

      {/* --- Budget Section --- */}
      {activeTab === 'budgets' && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Set New Budget</h3>
          <form onSubmit={handleBudgetSubmit} className="budget-form">
            <select 
              value={newBudget.category} 
              onChange={(e) => setNewBudget({...newBudget, category: e.target.value})}
              className="form-select"
            >
              {['Food', 'Transport', 'Utilities', 'Salary', 'Entertainment', 'General'].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input 
              type="number" 
              placeholder="Limit Amount" 
              value={newBudget.limit_amount}
              onChange={(e) => setNewBudget({...newBudget, limit_amount: e.target.value})}
              className="form-input"
              required
            />
            <select 
              value={newBudget.period} 
              onChange={(e) => setNewBudget({...newBudget, period: e.target.value})}
              className="form-select"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
            <button type="submit" className="btn-submit">
              Add Budget
            </button>
          </form>

          <h3 className="list-header">Your Budgets</h3>
          <ul className="list-container">
            {budgets.length === 0 && <p className="text-gray-500 italic">No budgets set yet.</p>}
            {budgets.map(b => (
              <li key={b.id} className="list-item">
                <span>
                  <strong className="item-title">{b.category}</strong> ({b.period}): <span className="item-amount">${b.limit_amount}</span>
                </span>
                <button onClick={() => handleDeleteBudget(b.id)} className="text-red-500 hover:text-red-700 text-sm">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* --- Todo Section --- */}
      {activeTab === 'todos' && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Add New Task</h3>
          <form onSubmit={handleTodoSubmit} className="budget-form">
            <input 
              type="text" 
              placeholder="Task description" 
              value={newTodo.title}
              onChange={(e) => setNewTodo({...newTodo, title: e.target.value})}
              className="form-input"
              required
            />
            <input 
              type="date" 
              value={newTodo.due_date}
              onChange={(e) => setNewTodo({...newTodo, due_date: e.target.value})}
              className="form-input"
            />
            <button type="submit" className="btn-submit">
              Add Task
            </button>
          </form>

          <h3 className="list-header">Tasks</h3>
          <ul className="list-container">
            {todos.length === 0 && <p className="text-gray-500 italic">No tasks yet.</p>}
            {todos.map(t => (
              <li key={t.id} className="list-item">
                <div className="item-info">
                  <span className={`text-lg ${t.is_completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {t.title}
                  </span>
                  {t.due_date && <span className="text-sm text-gray-500">Due: {t.due_date}</span>}
                </div>
                <div className="item-actions">
                  <button onClick={() => toggleTodo(t)} className={`btn-toggle ${t.is_completed ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
                    {t.is_completed ? 'Undo' : 'Done'}
                  </button>
                  <button onClick={() => handleDeleteTodo(t.id)} className="btn-delete">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Charts X */}
          <div className="charts-grid">
            <SpendingByCategory data={budgetData} />
            <IncomeVsExpense data={budgetData} />
          </div> 

          {/* Export Buttons */}
          <div className="export-actions">
            <button onClick={() => exportToExcel()} className="btn btn-excel">Download Excel</button>
            <button onClick={() => exportToWord()} className="btn btn-word">Download Word</button>
          </div>

          {/* PDF Preview */}
          <div className="card">
            <h3>PDF Preview</h3>
            <div className="pdf-container">
              <PDFViewer style={{ width: '100%', height: '100%' }}>
                <ReceiptPDF budgetData={budgetData} />
              </PDFViewer>
            </div>
          </div>

    </div>
  );
};

export default BudgetPage;