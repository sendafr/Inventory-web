import { useState, useEffect } from 'react'
import { createItem, updateItem, getCategories } from '../api/inventory'

export default function InventoryForm({ editingItem, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    quantity: 0,
    cost_price: '0.00',
    selling_price: '0.00',
    reorder_level: 10
  })
  const [categories, setCategories] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getCategories().then(res => setCategories(res.data))
  }, [])

  useEffect(() => {
    if (editingItem) {
      setFormData({
        sku: editingItem.sku,
        name: editingItem.name,
        category: editingItem.category || '',
        quantity: editingItem.quantity,
        cost_price: editingItem.cost_price,
        selling_price: editingItem.selling_price,
        reorder_level: editingItem.reorder_level
      })
    }
  }, [editingItem])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({...prev, [name]: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    
    try {
      if (editingItem) {
        await updateItem(editingItem.id, formData)
      } else {
        await createItem(formData)
      }
      onSuccess()
      setFormData({
        sku: '', name: '', category: '', quantity: 0,
        cost_price: '0.00', selling_price: '0.00', reorder_level: 10
      })
    } catch (err) {
      setErrors(err.response?.data || { detail: 'Failed to save' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-6">
      <h2 className="text-xl font-bold mb-4">
        {editingItem? 'Edit Item' : 'Add New Item'}
      </h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">SKU*</label>
          <input
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
          {errors.sku && <p className="text-red-600 text-sm mt-1">{errors.sku}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Name*</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
          {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="">-- None --</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Quantity*</label>
          <input
            name="quantity"
            type="number"
            min="0"
            value={formData.quantity}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Cost Price*</label>
          <input
            name="cost_price"
            type="number"
            step="0.01"
            min="0"
            value={formData.cost_price}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Selling Price*</label>
          <input
            name="selling_price"
            type="number"
            step="0.01"
            min="0"
            value={formData.selling_price}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Reorder Level</label>
          <input
            name="reorder_level"
            type="number"
            min="0"
            value={formData.reorder_level}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>
      </div>

      {errors.detail && <p className="text-red-600 text-sm mt-4">{errors.detail}</p>}

      <div className="flex gap-2 mt-6">
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {loading? 'Saving...' : editingItem? 'Update' : 'Create'}
        </button>
        {editingItem && (
          <button 
            type="button" 
            onClick={onCancel}
            className="bg-gray-200 px-4 py-2 rounded"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}