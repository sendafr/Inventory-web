import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

export const exportToExcel = async (data, fileName = 'inventory') => {
  if (!data || data.length === 0) {
    alert('No data to export')
    return
  }

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Inventory')

  // Define columns with headers and widths
  worksheet.columns = [
    { header: 'SKU', key: 'sku', width: 15 },
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Category', key: 'category', width: 15 },
    { header: 'Quantity', key: 'quantity', width: 10 },
    { header: 'Cost Price', key: 'cost_price', width: 12 },
    { header: 'Selling Price', key: 'selling_price', width: 12 },
    { header: 'Reorder Level', key: 'reorder_level', width: 12 },
    { header: 'Total Value', key: 'total_value', width: 12 },
    { header: 'Low Stock', key: 'low_stock', width: 10 }
  ]

  // Add rows
  data.forEach(item => {
    worksheet.addRow({
      sku: item.sku || '',
      name: item.name || '',
      category: item.category_name || '',
      quantity: Number(item.quantity) || 0,
      cost_price: Number(item.cost_price) || 0,
      selling_price: Number(item.selling_price) || 0,
      reorder_level: Number(item.reorder_level) || 0,
      total_value: Number(item.total_value) || 0,
      low_stock: item.is_low_stock? 'Yes' : 'No'
    })
  })

  // Style header row
  worksheet.getRow(1).font = { bold: true }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }

  // Generate buffer and save
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  saveAs(blob, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`)
}