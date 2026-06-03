import { useState, useEffect, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell } from 'docx';
import { PDFViewer, Document as PDFDoc, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import '../styles/Persional_acc.css';

// --- Configuration ---
// Build a consistent base URL for the persio_acc endpoints.
const rawApiUrl = import.meta.env.VITE_API_URL || '/api';
const trimmedApiUrl = rawApiUrl.replace(/\/$/, '');
const PERSIO_API_BASE = trimmedApiUrl.endsWith('/api')
  ? `${trimmedApiUrl}/persio_acc`
  : `${trimmedApiUrl}/api/persio_acc`;

// --- PDF Styles ---
const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica' },
  header: { fontSize: 20, marginBottom: 20, fontWeight: 'bold', textAlign: 'center' },
  row: { flexDirection: 'row', borderBottom: 1, borderColor: '#000', paddingVertical: 5 },
  label: { width: '25%', fontSize: 10 },
  value: { width: '75%', fontSize: 10 }
});

const ReceiptPDF = ({ transactions }) => (
  <PDFDoc>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Personal Accounting Report</Text>
      <Text style={{ marginBottom: 10, fontSize: 10 }}>Generated: {new Date().toLocaleDateString()}</Text>
      {transactions.map((t, i) => (
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

// --- Main App Component ---
function Persional_acc() {
  const [transactions, setTransactions] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [formData, setFormData] = useState({ 
    date: new Date().toISOString().split('T'), 
    description: '', 
    amount: '', 
    category: 'General', 
    type: 'expense' 
  });

  // Fetch Data from Django API
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setDataLoading(true);
    try {
      const response = await fetch(`${PERSIO_API_BASE}/transactions/`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching:', error);
      alert('Error fetching data. Is the Django server running?');
    }
    setDataLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    try {
      const response = await fetch(`${PERSIO_API_BASE}/transactions/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        }),
      });

      if (response.ok) {
        setFormData({ 
          date: new Date().toISOString().split('T'), 
          description: '', 
          amount: '', 
          category: 'General', 
          type: 'expense' 
        });
        fetchTransactions(); // Refresh list
      } else {
        const errorData = await response.json();
        alert('Error adding transaction: ' + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Check console.');
    }
  };

  // --- Export to Excel (Formulas Only) ---
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const dataSheet = workbook.addWorksheet('Transactions');

    dataSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Type', key: 'type', width: 10 },
      { header: 'Amount', key: 'amount', width: 15 }
    ];

    let lastRow = 1;
    transactions.forEach(t => {
      dataSheet.addRow({
        date: t.date,
        description: t.description,
        category: t.category,
        type: t.type,
        amount: parseFloat(t.amount)
      });
      lastRow++;
    });

    // Summary Formulas
    const summaryRow = lastRow + 1;
    dataSheet.getRow(summaryRow).getCell(1).value = "TOTAL INCOME:";
    dataSheet.getRow(summaryRow).getCell(1).font = { bold: true };
    dataSheet.getRow(summaryRow).getCell(5).value = { 
      formula: `SUMIF(D2:D${lastRow}, "income", E2:E${lastRow})` 
    };
    dataSheet.getRow(summaryRow).getCell(5).numFmt = '#,##0.00';

    const expenseRow = lastRow + 2;
    dataSheet.getRow(expenseRow).getCell(1).value = "TOTAL EXPENSE:";
    dataSheet.getRow(expenseRow).getCell(1).font = { bold: true };
    dataSheet.getRow(expenseRow).getCell(5).value = { 
      formula: `SUMIF(D2:D${lastRow}, "expense", E2:E${lastRow})` 
    };
    dataSheet.getRow(expenseRow).getCell(5).numFmt = '#,##0.00';

    const netRow = lastRow + 3;
    dataSheet.getRow(netRow).getCell(1).value = "NET BALANCE:";
    dataSheet.getRow(netRow).getCell(1).font = { bold: true };
    dataSheet.getRow(netRow).getCell(5).value = { 
      formula: `E${summaryRow} - E${expenseRow}` 
    };
    dataSheet.getRow(netRow).getCell(5).numFmt = '#,##0.00';
    dataSheet.getRow(netRow).getCell(5).font = { bold: true, color: { argb: 'FF0000FF' } };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `accounting_report_${new Date().toISOString().split('T')}.xlsx`;
    link.click();
  };

  // --- Export to Word ---
  const exportToWord = async () => {
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: 'Financial Summary', bold: true, size: 32 })] }),
          new Paragraph({ text: `Date: ${new Date().toLocaleDateString()}` }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Date')] }),
                  new TableCell({ children: [new Paragraph('Description')] }),
                  new TableCell({ children: [new Paragraph('Amount')] }),
                  new TableCell({ children: [new Paragraph('Category')] })
                ]
              }),
              ...transactions.map(t => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(t.date)] }),
                  new TableCell({ children: [new Paragraph(t.description)] }),
                  new TableCell({ children: [new Paragraph(t.amount.toString())] }),
                  new TableCell({ children: [new Paragraph(t.category)] })
                ]
              }))
            ]
          })
        ]
      }]
    });
    const blob = await Packer.toBlob(doc);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `financial_summary_${new Date().toISOString().split('T')}.docx`;
    link.click();
  };

  // --- Render Dashboard ---
  return (
    <div className="container">
      <div className="dashboard-header">
        <h1 style={{ color: 'blue', textAlign: 'center' }}>PERSONAL ACCOUNTING</h1>
      </div>

      {dataLoading ? (
        <p>Loading transactions from Django...</p>
      ) : (
        <>
          {/* Input Form */}
          <div className="card">
            <h3>Add Transaction</h3>
            <form onSubmit={handleSubmit} className="transaction-form">
              <div className="form-group">
                <label>Date</label>
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" placeholder="e.g. Groceries" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Amount</label>
                <input type="number" step="0.01" placeholder="0.00" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option>Food</option><option>Transport</option><option>Utilities</option><option>Salary</option><option>Entertainment</option><option>General</option>
                </select>
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <button type="submit" className="add-btn">Add</button>
            </form>
          </div>

          {/* Charts */}
          <div className="charts-grid">
            <SpendingByCategory data={transactions} />
            <IncomeVsExpense data={transactions} />
          </div>

          {/* Export Buttons */}
          <div className="export-actions">
            <button onClick={exportToExcel} className="btn btn-excel">Download Excel</button>
            <button onClick={exportToWord} className="btn btn-word">Download Word</button>
          </div>

          {/* PDF Preview */}
          <div className="card">
            <h3>PDF Preview</h3>
            <div className="pdf-container">
              <PDFViewer style={{ width: '100%', height: '100%' }}>
                <ReceiptPDF transactions={transactions} />
              </PDFViewer>
            </div>
          </div>

          {/* Data Table */}
          <div className="card">
            <h3>Transaction History</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No transactions found. Add one above!</td></tr>
                  ) : (
                    transactions.map(t => (
                      <tr key={t.id}>
                        <td>{t.date}</td>
                        <td>{t.description}</td>
                        <td>{t.category}</td>
                        <td>{t.type}</td>
                        <td className={t.type === 'income' ? 'amount-income' : 'amount-expense'}>
                          {t.type === 'income' ? '+' : '-'}{parseFloat(t.amount).toFixed(2)}
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
    </div>
  );
}

export default Persional_acc;