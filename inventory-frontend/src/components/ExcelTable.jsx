import { DataGrid } from 'react-data-grid' // curly braces added
import 'react-data-grid/lib/styles.css'
import { useState, useEffect } from 'react'

export default function ExcelTable({ items, onUpdate }) {
  const [rows, setRows] = useState(items)

  useEffect(() => {
    setRows(items)
  }, [items])

  const columns = [
    { key: 'sku', name: 'SKU', editable: true, width: 120 },
    { key: 'name', name: 'Name', editable: true, width: 200 },
    { key: 'category_name', name: 'Category', editable: false, width: 120 },
    { key: 'quantity', name: 'Qty', editable: true, type: 'number', width: 80 },
    { key: 'cost_price', name: 'Cost', editable: true, type: 'number', width: 100 },
    { key: 'selling_price', name: 'Price', editable: true, type: 'number', width: 100 },
    { key: 'total_value', name: 'Total', editable: false, width: 100 },
    { key: 'is_low_stock', name: 'Low', editable: false, width: 60,
      renderCell: ({ row }) => row.is_low_stock? '⚠' : ''
    }
  ]

  const onRowsChange = (newRows, { indexes, column }) => {
    setRows(newRows)
    const changedRow = newRows[indexes[0]]
    if (['sku', 'name', 'quantity', 'cost_price', 'selling_price'].includes(column.key)) {
      onUpdate(changedRow.id, changedRow)
    }
  }

  return (
    <div className="bg-card rounded shadow overflow-hidden">
      <DataGrid
        columns={columns}
        rows={rows}
        onRowsChange={onRowsChange}
        style={{ height: 500 }}
      />
    </div>
  )
}