import { useState, useEffect, useMemo, useRef } from 'react'
import { DataGrid } from 'react-data-grid'
import { HyperFormula } from 'hyperformula'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import '../styles/ExcelSheet.css'



// Global HF instance
let hf = null
let SHEET_ID = null
let isInitialized = false

const initHyperFormula = () => {
  if (isInitialized) return true
  try {
    hf = HyperFormula.buildEmpty({
      licenseKey: 'gpl-v3',
      useArrayArithmetic: true
    })
    SHEET_ID = hf.addSheet('Sheet1')
    isInitialized = true
    return true
  } catch (err) {
    console.error('❌ HyperFormula init failed:', err)
    return false
  }
}
initHyperFormula()

const DEFAULT_ROWS = 200
const BASE_HEADERS = ['SKU', 'Name', 'Category', 'Qty', 'Cost', 'Price', 'Reorder', 'Status', 'Formula']
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const getHfCoords = (rowIdx, colIdx) => ({
  sheet: SHEET_ID,
  row: rowIdx + 1,
  col: colIdx + 1
})

const colIndexToLetter = (idx) => {
  let s = ''
  while (idx >= 0) {
    s = String.fromCharCode((idx % 26) + 65) + s
    idx = Math.floor(idx / 26) - 1
  }
  return s
}

const ChartModal = ({ open, onClose, data }) => {
  const [chartType, setChartType] = useState('bar')
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-11/12 max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Chart</h3>
          <div className="flex gap-2">
            <select
              value={chartType}
              onChange={e => setChartType(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="bar">Bar</option>
              <option value="pie">Pie</option>
            </select>
            <button onClick={onClose} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">Close</button>
          </div>
        </div>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            {chartType === 'bar'? (
              <BarChart data={data}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            ) : (
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default function ExcelSheet({ initialData = [], onRowsChange }) {
  const [rows, setRows] = useState([])
  const [columns, setColumns] = useState([])
  const [cellMeta, setCellMeta] = useState({})
  const [selectedRange, setSelectedRange] = useState(null)
  const [formulaBarValue, setFormulaBarValue] = useState('')
  const [hfReady, setHfReady] = useState(false)
  const [chartModalOpen, setChartModalOpen] = useState(false)
  const [chartData, setChartData] = useState([])
  const fileInputRef = useRef(null)

  // Inside ExcelSheet component

// 1. Fix the column initialization effect


  // Only run this if columns haven't been set yet or if hfReady changes
  if (columns.length === 0) {
    const initialCols = BASE_HEADERS.map((name, i) => ({
      key: colIndexToLetter(i),
      name,
      width: 130,
      editable: true,
      // ... rest of column definition
    }));
    setColumns(initialCols);
    setHfReady(true);
 
  }

// ... rest of the component
  // Init columns once
  useEffect(() => {
    const initialCols = BASE_HEADERS.map((name, i) => ({
      key: colIndexToLetter(i),
      name,
      width: 130,
      editable: true,
      colSpan: (args) => {
        if (!args.row) return 1
        const meta = cellMeta[`${args.row.id}-${i}`]
        return meta?.hidden? 0 : meta?.colSpan || 1
      },
      cellStyle: (args) => {
        if (!args.row) return {}
        const meta = cellMeta[`${args.row.id}-${i}`]
        return meta?.style || {}
      },
      renderCell: ({ row, rowIdx }) => {
        if (!row ||!hfReady) return row?.[colIndexToLetter(i)] || ''
        const addr = getHfCoords(rowIdx, i)
        try {
          const detailed = hf.getCellValueDetailed(addr)
          if (detailed?.error) return <span className="text-red-500">#ERROR</span>
          return hf.getCellValue(addr)?? ''
        } catch {
          return row[colIndexToLetter(i)] || ''
        }
      },
      renderEditCell: ({ row, rowIdx, onRowChange, onClose }) => {
        if (!row) return null
        const addr = getHfCoords(rowIdx, i)
        const raw = hfReady
        ? (hf.getCellFormula(addr)?? hf.getCellValue(addr)?? '')
          : row[colIndexToLetter(i)]?? ''

        return (
          <input
            className="w-full h-full px-2 outline-none border-2 border-blue-500"
            defaultValue={raw}
            autoFocus
            onBlur={(e) => {
              const value = e.target.value
              setFormulaBarValue(value)
              if (hfReady) {
                if (value.startsWith('=')) {
                  hf.setCellContents(addr, [[value]])
                } else {
                  const num = Number(value)
                  hf.setCellContents(addr, [[value === ''? null : isNaN(num)? value : num]])
                }
              }
              onRowChange({...row, [colIndexToLetter(i)]: value })
              onClose(true)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.target.blur()
              if (e.key === 'Escape') onClose()
            }}
            onChange={(e) => setFormulaBarValue(e.target.value)}
          />
        )
      }
    }))
    setColumns(initialCols)
    setHfReady(isInitialized && typeof SHEET_ID === 'number')
  }, [cellMeta, hfReady])

  // Sync with parent initialData
  useEffect(() => {
    if (!hfReady) return

    const rowCount = Math.max(initialData.length, DEFAULT_ROWS)
    const newRows = Array.from({ length: rowCount }, (_, i) => {
      const item = initialData[i]
      return {
        id: i,
        A: item?.sku || '',
        B: item?.name || '',
        C: item?.category_name || '',
        D: item?.quantity || 0,
        E: item?.cost_price || 0,
        F: item?.selling_price || 0,
        G: item?.reorder_level || 0,
        H: item?.is_low_stock? 'Low' : 'OK',
        I: item?.formular || '' // NEW
      }
    })
    setRows(newRows)

    const sheetData = newRows.map(r => [r.A, r.B, r.C, r.D, r.E, r.F, r.G, r.H, r.I])
    try {
      hf.clearSheet(SHEET_ID)
      hf.setSheetContent(SHEET_ID, sheetData)
    } catch (err) {
      console.error('HF setSheetContent failed:', err)
    }
  }, [initialData, hfReady])

  useEffect(() => {
    if (!selectedRange ||!hfReady) {
      setFormulaBarValue('')
      return
    }
    const { start } = selectedRange
    const addr = getHfCoords(start.rowIdx, start.idx)
    const formula = hf.getCellFormula(addr)
    const value = hf.getCellValue(addr)
    setFormulaBarValue(formula || value || '')
  }, [selectedRange, hfReady])

  const syncToParent = (newRows) => {
    if (!onRowsChange) return
    const inventoryFormat = newRows
    .filter(r => r.A || r.B)
    .map(r => ({
        sku: r.A,
        name: r.B,
        category_name: r.C,
        quantity: Number(r.D) || 0,
        cost_price: Number(r.E) || 0,
        selling_price: Number(r.F) || 0,
        reorder_level: Number(r.G) || 0,
        is_low_stock: r.H === 'Low',
        formular: r.I || '' // NEW
      }))
    onRowsChange(inventoryFormat)
  }

  const handleRowsChange = (newRows, { indexes }) => {
    setRows(newRows)
    syncToParent(newRows)

    if (!hfReady) return
    indexes.forEach(idx => {
      const row = newRows[idx]
      if (!row) return
      columns.forEach((col, cIdx) => {
        const value = row[col.key]
        const addr = getHfCoords(idx, cIdx)
        if (String(value).startsWith('=')) {
          hf.setCellContents(addr, [[value]])
        } else {
          const num = Number(value)
          hf.setCellContents(addr, [[value === ''? null : isNaN(num)? value : num]])
        }
      })
    })
  }

  const handleFormulaBarCommit = (e) => {
    if (e.key!== 'Enter' ||!selectedRange) return
    const value = e.target.value
    const { start } = selectedRange
    const addr = getHfCoords(start.rowIdx, start.idx)
    const colKey = columns[start.idx].key
    const newRows = [...rows]
    newRows[start.rowIdx][colKey] = value
    setRows(newRows)
    if (value.startsWith('=')) {
      hf.setCellContents(addr, [[value]])
    } else {
      const num = Number(value)
      hf.setCellContents(addr, [[value === ''? null : isNaN(num)? value : num]])
    }
    handleRowsChange(newRows, { indexes: [start.rowIdx] })
    e.target.blur()
  }

  const applyStyle = (styleProp, value) => {
    if (!selectedRange) return
    const key = `${selectedRange.start.rowIdx}-${selectedRange.start.idx}`
    setCellMeta(prev => ({
    ...prev,
      [key]: {
      ...prev[key],
        style: {...prev[key]?.style, [styleProp]: value }
      }
    }))
  }

  const applyBorder = () => {
    if (!selectedRange) return
    const key = `${selectedRange.start.rowIdx}-${selectedRange.start.idx}`
    setCellMeta(prev => ({
    ...prev,
      [key]: {
      ...prev[key],
        style: {...prev[key]?.style, border: '1px solid #000' }
      }
    }))
  }

  const mergeCells = () => {
    if (!selectedRange) return
    const { start, end } = selectedRange
    const rowSpan = end.rowIdx - start.rowIdx + 1
    const colSpan = end.idx - start.idx + 1
    if (rowSpan === 1 && colSpan === 1) return

    const key = `${start.rowIdx}-${start.idx}`
    setCellMeta(prev => ({
    ...prev,
      [key]: {...prev[key], colSpan, rowSpan },
    ...Array.from({ length: rowSpan }, (_, r) =>
        Array.from({ length: colSpan }, (_, c) =>
          r === 0 && c === 0? null : { [`${start.rowIdx + r}-${start.idx + c}`]: { hidden: true } }
        )
      ).flat().reduce((acc, cur) => cur? {...acc,...cur } : acc, {})
    }))
  }

  const unmergeCells = () => {
    if (!selectedRange) return
    const key = `${selectedRange.start.rowIdx}-${selectedRange.start.idx}`
    const meta = cellMeta[key]
    if (!meta?.colSpan) return

    const newMeta = {...cellMeta }
    delete newMeta[key]
    for (let r = 0; r < meta.rowSpan; r++) {
      for (let c = 0; c < meta.colSpan; c++) {
        if (r === 0 && c === 0) continue
        delete newMeta[`${selectedRange.start.rowIdx + r}-${selectedRange.start.idx + c}`]
      }
    }
    setCellMeta(newMeta)
  }

  const addRow = () => {
    if (!hfReady) return
    hf.insertRows(SHEET_ID, rows.length, 1)
    const newRow = { id: rows.length }
    columns.forEach(col => newRow[col.key] = '')
    const newRows = [...rows, newRow]
    setRows(newRows)
    syncToParent(newRows)
  }

  const deleteRow = () => {
    if (!selectedRange ||!hfReady) return
    const start = selectedRange.start.rowIdx
    const count = selectedRange.end.rowIdx - start + 1
    hf.removeRows(SHEET_ID, start + 1, count)
    const newRows = rows.filter((_, i) => i < start || i > start + count - 1)
    .map((r, i) => ({...r, id: i }))
    setRows(newRows)
    syncToParent(newRows)
  }

  const addColumn = () => {
    const nextIdx = columns.length
    const nextKey = colIndexToLetter(nextIdx)
    const newCol = {
      key: nextKey,
      name: nextKey,
      width: 130,
      editable: true,
    ...columns[0]
    }
    setColumns([...columns, newCol])
    setRows(rows.map(r => ({...r, [nextKey]: '' })))
  }

  const deleteColumn = () => {
    if (columns.length <= 1) return
    const lastKey = columns[columns.length - 1].key
    setColumns(columns.slice(0, -1))
    setRows(rows.map(r => {
      const { [lastKey]: _,...rest } = r
      return rest
    }))
  }

  const insertFormula = (formula) => {
    if (!selectedRange) return
    const { start, end } = selectedRange
    const rangeStr = `${colIndexToLetter(start.idx)}${start.rowIdx + 2}:${colIndexToLetter(end.idx)}${end.rowIdx + 2}`
    const fullFormula = `${formula}${rangeStr})`
    const rowIdx = start.rowIdx
    const colIdx = start.idx
    const colKey = columns[colIdx].key
    const newRows = [...rows]
    newRows[rowIdx][colKey] = fullFormula
    setRows(newRows)
    handleRowsChange(newRows, { indexes: [rowIdx] })
  }

  const undo = () => hfReady && hf.undo()
  const redo = () => hfReady && hf.redo()

  const openChart = () => {
    const data = rows
    .filter(r => r.B && r.F)
    .slice(0, 50)
    .map(r => ({ name: String(r.B), value: Number(r.F) || 0 }))
    setChartData(data)
    setChartModalOpen(true)
  }

  const handleExport = async () => {
    if (!hfReady) return alert('HyperFormula not initialized')
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Inventory')

    worksheet.addRow(columns.map(c => c.name)).font = { bold: true }
    const data = hf.getSheetValues(SHEET_ID)

    data.forEach((row, rIdx) => {
      if (!row || row.every(c => c === null)) return
      const excelRow = worksheet.addRow(row)
      row.forEach((_, cIdx) => {
        const meta = cellMeta[`${rIdx}-${cIdx}`]
        const cell = excelRow.getCell(cIdx + 1)

        if (meta?.style) {
          if (meta.style.fontWeight === 'bold') cell.font = {...cell.font, bold: true }
          if (meta.style.fontSize) cell.font = {...cell.font, size: parseInt(meta.style.fontSize) }
          if (meta.style.color) cell.font = {...cell.font, color: { argb: meta.style.color.replace('#', '') } }
          if (meta.style.backgroundColor) cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: meta.style.backgroundColor.replace('#', '') }
          }
          if (meta.style.border) {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            }
          }
        }
        if (cIdx >= 3 && cIdx <= 6) {
          cell.numFmt = '0.00'
        }
      })
    })

    Object.entries(cellMeta).forEach(([key, meta]) => {
      if (meta.colSpan && meta.rowSpan && meta.colSpan > 1) {
        const [r, c] = key.split('-').map(Number)
        const startCell = `${colIndexToLetter(c)}${r + 2}`
        const endCell = `${colIndexToLetter(c + meta.colSpan - 1)}${r + meta.rowSpan + 1}`
        worksheet.mergeCells(`${startCell}:${endCell}`)
      }
    })

    const buffer = await workbook.xlsx.writeBuffer()
    saveAs(new Blob([buffer]), `inventory_${Date.now()}.xlsx`)
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const workbook = new ExcelJS.Workbook()
    const buffer = await file.arrayBuffer()
    await workbook.xlsx.load(buffer)
    const worksheet = workbook.getWorksheet(1)
    const data = []

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      const rowValues = []
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        rowValues[colNumber - 1] = cell.formula? `=${cell.formula}` : cell.value
      })
      data.push(rowValues)
    })

    if (hfReady) {
      hf.clearSheet(SHEET_ID)
      const sheetData = Array(DEFAULT_ROWS).fill(null).map(() => Array(columns.length).fill(null))
      data.forEach((row, rIdx) => {
        row.forEach((cell, cIdx) => {
          if (rIdx < DEFAULT_ROWS && cIdx < columns.length) {
            sheetData[rIdx][cIdx] = cell
          }
        })
      })
      hf.setSheetContent(SHEET_ID, sheetData)
    }

    const newRows = Array.from({ length: DEFAULT_ROWS }, (_, i) => {
      const row = { id: i }
      columns.forEach((col, cIdx) => {
        row[col.key] = data[i]?.[cIdx]?? ''
      })
      return row
    })
    setRows(newRows)
    syncToParent(newRows)
    e.target.value = ''
  }

  return (
    <div className="container mx-auto flex flex-col gap-2 border rounded" style={{ height: '600px' , overflow: 'auto' , backgroundColor: '#f01818' }}>
      <ChartModal open={chartModalOpen} onClose={() => setChartModalOpen(false)} data={chartData} />

      <div className="flex items-center gap-2 p-2 bg-gray-50 border-b">
        <span className="text-sm text-gray-600 w-20 font-mono">
          {selectedRange? `${colIndexToLetter(selectedRange.start.idx)}${selectedRange.start.rowIdx + 2}` : ''}
        </span>
        <input
          type="text"
          value={formulaBarValue}
          onChange={(e) => setFormulaBarValue(e.target.value)}
          onKeyDown={handleFormulaBarCommit}
          placeholder="Enter value or formula"
          className="flex-1 px-2 py-1 border rounded text-sm outline-none focus:border-blue-500"
        />
      </div>

      <div className="bg-white p-2 flex gap-2 border-b flex-wrap items-center">
        <button onClick={handleExport} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">Export</button>
        <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">Import</button>
        <div className="w-px h-6 bg-gray-300"></div>

        <button onClick={addRow} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">+ Row</button>
        <button onClick={deleteRow} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">- Row</button>
        <button onClick={addColumn} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">+ Col</button>
        <button onClick={deleteColumn} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">- Col</button>

        <div className="w-px h-6 bg-gray-300"></div>

        <select
          onChange={(e) => insertFormula(e.target.value)}
          value=""
          className="px-2 py-1 border rounded text-sm"
        >
          <option value="">Formulas</option>
          <option value="=SUM(">SUM</option>
          <option value="=AVERAGE(">AVERAGE</option>
          <option value="=MAX(">MAX</option>
          <option value="=MIN(">MIN</option>
        </select>

        <div className="w-px h-6 bg-gray-300"></div>

        <button
          onClick={() => applyStyle('fontWeight', cellMeta[`${selectedRange?.start.rowIdx}-${selectedRange?.start.idx}`]?.style?.fontWeight === 'bold'? 'normal' : 'bold')}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm font-bold"
        >
          B
        </button>

        <select onChange={(e) => applyStyle('fontSize', e.target.value)} className="px-2 py-1 border rounded text-sm">
          <option value="">Size</option>
          <option value="12px">12</option>
          <option value="14px">14</option>
          <option value="16px">16</option>
          <option value="18px">18</option>
        </select>

        <input type="color" onChange={(e) => applyStyle('color', e.target.value)} title="Text Color" className="w-8 h-8 border rounded cursor-pointer" />
        <input type="color" onChange={(e) => applyStyle('backgroundColor', e.target.value)} title="Fill Color" className="w-8 h-8 border rounded cursor-pointer" />

        <button onClick={applyBorder} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">Border</button>

        <div className="w-px h-6 bg-gray-300"></div>

        <button onClick={mergeCells} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">Merge</button>
        <button onClick={unmergeCells} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">Unmerge</button>
        <button onClick={undo} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">Undo</button>
        <button onClick={redo} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">Redo</button>

        <div className="w-px h-6 bg-gray-300"></div>
        <button onClick={openChart} className="px-3 py-1 bg-blue-100 rounded hover:bg-blue-200 text-sm">Chart</button>

        <div className="ml-auto text-sm text-gray-500">
          {hfReady? 'Formulas: On' : 'Formulas: Off'}
        </div>
      </div>

      <input type="file" accept=".xlsx" onChange={handleImport} ref={fileInputRef} style={{ display: 'none' }} />

      <DataGrid
        key={initialData.length}
        columns={columns}
        rows={rows}
        onRowsChange={handleRowsChange}
        onSelectedCellRangeChange={setSelectedRange}
        rowKeyGetter={(row) => row.id}
        className="rdg-light flex-1"
        rowHeight={32}
        headerRowHeight={40}
      />
    </div>
  )
}