import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import InventoryTable from '../components/InventoryTable'
import ExcelSheet from '../components/ExcelSheet'
import InventoryForm from '../components/InventoryForm'
import { inventoryAPI } from '../api/api'
import { exportToExcel } from '../utils/exportExcel'

 
const PAGE_SIZE = 20

export default function Home() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [editingItem, setEditingItem] = useState(null)
  const [filters, setFilters] = useState({ search: '', category: '', low_stock: false, page: 1 })
  const [pagination, setPagination] = useState({ count: 0, current_page: 1, total_pages: 1, has_next: false, has_previous: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [useExcelView, setUseExcelView] = useState(false)
  const fileInputRef = useRef(null)

  const fetchData = async () => {
  setLoading(true)
  setError(null)
  try {
    const params = new URLSearchParams()
    if (filters.search) params.append('search', filters.search)
    if (filters.category) params.append('category', filters.category)
    if (filters.low_stock) params.append('low_stock', 'true')
    
    // If Excel view is on, fetch all. Otherwise paginate
    if (!useExcelView) {
      params.append('page', filters.page)
      params.append('page_size', PAGE_SIZE)
    } else {
      params.append('page_size', 1000) // or remove pagination on backend
    }

    const [itemsRes, catsRes] = await Promise.all([
      inventoryAPI.getAll(params.toString()),
      inventoryAPI.getCategories()
    ])

    const data = itemsRes.data
    const catsData = catsRes.data
    const rawItems = data.results || data // handle paginated vs non-paginated response
    const totalCount = data.count || rawItems.length

    setItems(rawItems)
    setCategories(catsData)

    const totalPages = Math.ceil(totalCount / PAGE_SIZE)
    const currentPage = filters.page || 1

    setPagination({
      count: totalCount,
      current_page: currentPage,
      total_pages: totalPages,
      has_next: currentPage < totalPages,
      has_previous: currentPage > 1
    })

  } catch (err) {
    console.error("Fetch error:", err)
    setError(err.message || "Failed to load data")
  } finally {
    setLoading(false)
  }
}

useEffect(() => {
  fetchData()
}, [filters.search, filters.category, filters.low_stock, filters.page, useExcelView])

  const handleRefresh = () => fetchData()

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data } = await inventoryAPI.importExcel(formData)
      alert(`Imported ${data.created} items. Errors: ${data.errors.length}`)
      if (data.errors.length) console.table(data.errors)
      fetchData()
    } catch (err) {
      alert('Import failed: ' + (err.response?.data?.file?.[0] || err.message))
    }
    e.target.value = ''
  }

  const handleExcelUpdate = async (updatedRows) => {
    // Update local state immediately for UI responsiveness
    setItems(updatedRows)

    // Optional: auto-save grid edits to backend
    // Uncomment if you want each cell edit to hit the API
    /*
    try {
      await Promise.all(
        updatedRows
         .filter(row => row.id) // only save rows that have an id
         .map(row => inventoryAPI.updateItem(row.id, row))
      )
    } catch (err) {
      alert('Auto-save failed: ' + err.message)
      fetchData() // rollback on error
    }
    */
  }

  const handleExportWithFormulas = async () => {
    await exportToExcel(items, 'inventory_export')
  }

  const handleDownloadTemplate = async () => {
    const template = [{
      sku: 'EXAMPLE-001',
      name: 'Example Item',
      category_name: 'Electronics',
      quantity: 10,
      cost_price: 5.99,
      selling_price: 9.99,
      reorder_level: 5,
      formular: '',
      total_value: 59.9,
      is_low_stock: false
    }]
    await exportToExcel(template, 'inventory_template')
  }

  if (loading && items.length === 0) return <div className="loading">Loading...</div>
  if (error && items.length === 0) return <div className="error">Error: {error}</div>

  return (
    <Layout>
      <InventoryForm
        editingItem={editingItem}
        onSuccess={() => {
          setEditingItem(null)
          fetchData() // re-fetch after create/update so serializer fields are included
        }}
        onCancel={() => setEditingItem(null)}
        categories={categories}
      />

      <div className="bg-card p-4 rounded shadow mb-4 flex gap-2 items-center flex-wrap">
        <button onClick={handleExportWithFormulas} className="btn btn-secondary">
          Export with Formulas
        </button>

        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleImport}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-secondary"
        >
          Import Excel
        </button>

        <button onClick={handleDownloadTemplate} className="btn btn-secondary">
          Download Template
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted">View:</span>
          <button
            onClick={() => setUseExcelView(false)}
            className={`btn ${!useExcelView? 'btn-primary' : 'btn-secondary'}`}
          >
            Table
          </button>
          <button
            onClick={() => setUseExcelView(true)}
            className={`btn ${useExcelView? 'btn-primary' : 'btn-secondary'}`}
          >
            Excel
          </button>
        </div>
      </div>

      <div className="bg-card p-4 rounded shadow mb-4 flex gap-4 items-end flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="form-label">Search SKU/Name</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
            placeholder="Search..."
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">Category</label>
          <select
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value, page: 1})}
            className="form-select"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 pb-2">
          <input
            type="checkbox"
            checked={filters.low_stock}
            onChange={(e) => setFilters({...filters, low_stock: e.target.checked, page: 1})}
          />
          <span className="text-sm">Low Stock Only</span>
        </label>
      </div>

      {useExcelView? (
        <div className="flex-1 min-h-0" style={{ height: '600px' }}>
        <ExcelSheet
          key={items.length} // forces remount when rows change
          initialData={items} // pass backend data to sheet
          onRowsChange={handleExcelUpdate} // sync grid edits back to state
        />
        </div>
      ) : (
        <InventoryTable
          items={items}
          onEdit={setEditingItem}
          onRefresh={handleRefresh}
          pagination={pagination}
          onPageChange={(page) => setFilters({...filters, page})}
        />
      )}
    </Layout>
  )
}