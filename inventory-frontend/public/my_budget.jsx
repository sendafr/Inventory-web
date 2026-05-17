import React, { useState, useEffect, useRef } from 'react';
import { budgetAPI } from '../api/api'; 
import '../styles/Budget.css'; 
import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell } from 'docx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const BudgetPage = () => {
  const [activeTab, setActiveTab] = useState('budgets');
  const [budgets, setBudgets] = useState([]);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [newBudget, setNewBudget] = useState({ category: 'Food', limit_amount: '', period: 'monthly' });
  const [newTodo, setNewTodo] = useState({ title: '', due_date: '' });
  const [chartData, setChartData] = useState({ category: [], incomeExpense: [] });

  const exportRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const budgetData = await budgetAPI.getBudgets();
      const todoData = await budgetAPI.getTodos();
      
      setBudgets(budgetData);
      setTodos(todoData);
      
      const categoryData = budgetData.map(b => ({
        name: b.category,
        value: parseFloat(b.limit_amount) || 0
      }));
      
      setChartData({ 
        category: categoryData,
        incomeExpense: [] 
      });
      
    } catch (err) {
      console.error('Fetch Error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('You are not logged in or your session has expired.');
      } else {
        setError(err.message || 'Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Export Functions ---
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Budget & Tasks');

    sheet.addRow(['--- BUDGETS ---']);
    sheet.columns = [
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Limit', key: 'limit_amount', width: 15 },
      { header: 'Period', key: 'period', width: 15 }
    ];
    budgets.forEach(b => sheet.addRow({ category: b.category, limit_amount: b.limit_amount, period: b.period }));

    sheet.addRow([]); 
    sheet.addRow(['--- TO-DO LIST ---']);
    sheet.columns = [
      { header: 'Task', key: 'title', width: 40 },
      { header: 'Due Date', key: 'due_date', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];
    todos.forEach(t => sheet.addRow({ 
      title: t.title, 
      due_date: t.due_date || 'N/A', 
      status: t.is_completed ? 'Completed' : 'Pending' 
    }));

    const buffer = await workbook.xlsx.writeBuffer();
    downloadFile(buffer, 'budget_report.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  const exportToWord = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ text: 'Personal Budget & To-Do Report', heading: 'Heading1', alignment: 'center' }),
          new Paragraph({ text: `Generated: ${new Date().toLocaleDateString()}` }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Budgets', heading: 'Heading2' }),
          new Table({
            width: { size: 100, type: 'pct' },
            rows: [
              new TableRow({ children: ['Category', 'Limit', 'Period'].map(h => new TableCell({ children: [new Paragraph({ text: h, bold: true })] })) }),
              ...budgets.map(b => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(b.category)] }),
                  new TableCell({ children: [new Paragraph(b.limit_amount.toString())] }),
                  new TableCell({ children: [new Paragraph(b.period)] })
                ]
              }))
            ]
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'To-Do List', heading: 'Heading2' }),
          new Table({
            width: { size: 100, type: 'pct' },
            rows: [
              new TableRow({ children: ['Task', 'Due Date', 'Status'].map(h => new TableCell({ children: [new Paragraph({ text: h, bold: true })] })) }),
              ...todos.map(t => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(t.title)] }),
                  new TableCell({ children: [new Paragraph(t.due_date || 'N/A')] }),
                  new TableCell({ children: [new Paragraph(t.is_completed ? 'Completed' : 'Pending')] })
                ]
              }))
            ]
          })
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    downloadFile(blob, 'budget_report.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  };

  const exportToPDF = async () => {
    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.width = '800px';
    element.style.padding = '20px';
    element.style.backgroundColor = 'white';
    element.style.fontFamily = 'Arial, sans-serif';

    let html = `
      <h1 style="text-align:center; color:#333;">Budget & To-Do Report</h1>
      <p style="text-align:center; color:#666;">Generated: ${new Date().toLocaleDateString()}</p>
      <hr/>
      <h2>Budgets</h2>
      <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
        <thead><tr style="background:#f0f0f0;"><th style="border:1px solid #ddd; padding:8px;">Category</th><th style="border:1px solid #ddd; padding:8px;">Limit</th><th style="border:1px solid #ddd; padding:8px;">Period</th></tr></thead>
        <tbody>
          ${budgets.map(b => `<tr><td style="border:1px solid #ddd; padding:8px;">${b.category}</td><td style="border:1px solid #ddd; padding:8px;">${b.limit_amount}</td><td style="border:1px solid #ddd; padding:8px;">${b.period}</td></tr>`).join('')}
        </tbody>
      </table>
      <h2>To-Do List</h2>
      <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
        <thead><tr style="background:#f0f0f0;"><th style="border:1px solid #ddd; padding:8px;">Task</th><th style="border:1px solid #ddd; padding:8px;">Due Date</th><th style="border:1px solid #ddd; padding:8px;">Status</th></tr></thead>
        <tbody>
          ${todos.map(t => `<tr><td style="border:1px solid #ddd; padding:8px;">${t.title}</td><td style="border:1px solid #ddd; padding:8px;">${t.due_date || 'N/A'}</td><td style="border:1px solid #ddd; padding:8px;">${t.is_completed ? 'Completed' : 'Pending'}</td></tr>`).join('')}
        </tbody>
      </table>
    `;

    element.innerHTML = html;
    document.body.appendChild(element);

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('budget_report.pdf');
    } catch (err) {
      console.error('PDF Export Error:', err);
      alert('Failed to generate PDF.');
    } finally {
      document.body.removeChild(element);
    }
  };

  const downloadFile = (blob, fileName, mimeType) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
    // --- Handlers ---
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

  // --- Export Functions (Ensure these are also present) ---
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Budget & Tasks');
    sheet.addRow(['--- BUDGETS ---']);
    sheet.columns = [
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Limit', key: 'limit_amount', width: 15 },
      { header: 'Period', key: 'period', width: 15 }
    ];
    budgets.forEach(b => sheet.addRow({ category: b.category, limit_amount: b.limit_amount, period: b.period }));
    sheet.addRow([]); 
    sheet.addRow(['--- TO-DO LIST ---']);
    sheet.columns = [
      { header: 'Task', key: 'title', width: 40 },
      { header: 'Due Date', key: 'due_date', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];
    todos.forEach(t => sheet.addRow({ 
      title: t.title, 
      due_date: t.due_date || 'N/A', 
      status: t.is_completed ? 'Completed' : 'Pending' 
    }));
    const buffer = await workbook.xlsx.writeBuffer();
    downloadFile(buffer, 'budget_report.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  const exportToWord = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ text: 'Personal Budget & To-Do Report', heading: 'Heading1', alignment: 'center' }),
          new Paragraph({ text: `Generated: ${new Date().toLocaleDateString()}` }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Budgets', heading: 'Heading2' }),
          new Table({
            width: { size: 100, type: 'pct' },
            rows: [
              new TableRow({ children: ['Category', 'Limit', 'Period'].map(h => new TableCell({ children: [new Paragraph({ text: h, bold: true })] })) }),
              ...budgets.map(b => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(b.category)] }),
                  new TableCell({ children: [new Paragraph(b.limit_amount.toString())] }),
                  new TableCell({ children: [new Paragraph(b.period)] })
                ]
              }))
            ]
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'To-Do List', heading: 'Heading2' }),
          new Table({
            width: { size: 100, type: 'pct' },
            rows: [
              new TableRow({ children: ['Task', 'Due Date', 'Status'].map(h => new TableCell({ children: [new Paragraph({ text: h, bold: true })] })) }),
              ...todos.map(t => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(t.title)] }),
                  new TableCell({ children: [new Paragraph(t.due_date || 'N/A')] }),
                  new TableCell({ children: [new Paragraph(t.is_completed ? 'Completed' : 'Pending')] })
                ]
              }))
            ]
          })
        ]
      }]
    });
    const blob = await Packer.toBlob(doc);
    downloadFile(blob, 'budget_report.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  };

  const exportToPDF = async () => {
    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.width = '800px';
    element.style.padding = '20px';
    element.style.backgroundColor = 'white';
    element.style.fontFamily = 'Arial, sans-serif';
    let html = `
      <h1 style="text-align:center; color:#333;">Budget & To-Do Report</h1>
      <p style="text-align:center; color:#666;">Generated: ${new Date().toLocaleDateString()}</p>
      <hr/>
      <h2>Budgets</h2>
      <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
        <thead><tr style="background:#f0f0f0;"><th style="border:1px solid #ddd; padding:8px;">Category</th><th style="border:1px solid #ddd; padding:8px;">Limit</th><th style="border:1px solid #ddd; padding:8px;">Period</th></tr></thead>
        <tbody>
          ${budgets.map(b => `<tr><td style="border:1px solid #ddd; padding:8px;">${b.category}</td><td style="border:1px solid #ddd; padding:8px;">${b.limit_amount}</td><td style="border:1px solid #ddd; padding:8px;">${b.period}</td></tr>`).join('')}
        </tbody>
      </table>
      <h2>To-Do List</h2>
      <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
        <thead><tr style="background:#f0f0f0;"><th style="border:1px solid #ddd; padding:8px;">Task</th><th style="border:1px solid #ddd; padding:8px;">Due Date</th><th style="border:1px solid #ddd; padding:8px;">Status</th></tr></thead>
        <tbody>
          ${todos.map(t => `<tr><td style="border:1px solid #ddd; padding:8px;">${t.title}</td><td style="border:1px solid #ddd; padding:8px;">${t.due_date || 'N/A'}</td><td style="border:1px solid #ddd; padding:8px;">${t.is_completed ? 'Completed' : 'Pending'}</td></tr>`).join('')}
        </tbody>
      </table>
    `;
    element.innerHTML = html;
    document.body.appendChild(element);
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('budget_report.pdf');
    } catch (err) {
      console.error('PDF Export Error:', err);
      alert('Failed to generate PDF.');
    } finally {
      document.body.removeChild(element);
    }
  };

  const downloadFile = (blob, fileName, mimeType) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

    return (
    <div className="budget-container" ref={exportRef}>
      <h1 className="budget-header">Budget & To-Do List</h1>

      <div className="budget-tabs">
        <button onClick={() => setActiveTab('budgets')} className={`tab-btn ${activeTab === 'budgets' ? 'active' : ''}`}>Budgets</button>
        <button onClick={() => setActiveTab('todos')} className={`tab-btn ${activeTab === 'todos' ? 'active' : ''}`}>To-Do List</button>
      </div>

      {activeTab === 'budgets' && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Set New Budget</h3>
          <form onSubmit={handleBudgetSubmit} className="budget-form">
            <select value={newBudget.category} onChange={(e) => setNewBudget({...newBudget, category: e.target.value})} className="form-select">
              {['Food', 'Transport', 'Utilities', 'Salary', 'Entertainment', 'General'].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input type="number" placeholder="Limit Amount" value={newBudget.limit_amount} onChange={(e) => setNewBudget({...newBudget, limit_amount: e.target.value})} className="form-input" required />
            <select value={newBudget.period} onChange={(e) => setNewBudget({...newBudget, period: e.target.value})} className="form-select">
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
            <button type="submit" className="btn-submit">Add Budget</button>
          </form>

          <h3 className="list-header">Your Budgets</h3>
          <ul className="list-container">
            {budgets.length === 0 && <p className="text-gray-500 italic">No budgets set yet.</p>}
            {budgets.map(b => (
              <li key={b.id} className="list-item">
                <span><strong className="item-title">{b.category}</strong> ({b.period}): <span className="item-amount">${b.limit_amount}</span></span>
                <button onClick={() => handleDeleteBudget(b.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'todos' && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Add New Task</h3>
          <form onSubmit={handleTodoSubmit} className="budget-form">
            <input type="text" placeholder="Task description" value={newTodo.title} onChange={(e) => setNewTodo({...newTodo, title: e.target.value})} className="form-input" required />
            <input type="date" value={newTodo.due_date} onChange={(e) => setNewTodo({...newTodo, due_date: e.target.value})} className="form-input" />
            <button type="submit" className="btn-submit">Add Task</button>
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

      {/* Charts */}
      <div className="charts-grid">
        <SpendingByCategory data={chartData.category} />
        <IncomeVsExpense data={chartData.incomeExpense} />
      </div>

      {/* Export Buttons */}
      <div className="export-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={exportToExcel} className="btn btn-excel" style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px' }}>
          Download Excel
        </button>
        <button onClick={exportToWord} className="btn btn-word" style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px' }}>
          Download Word
        </button>
        <button onClick={exportToPDF} className="btn btn-pdf" style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px' }}>
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default BudgetPage;