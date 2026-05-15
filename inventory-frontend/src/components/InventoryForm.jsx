import { useState, useEffect } from 'react'
import { inventoryAPI } from '../api/api'
import '../styles/InventoryForm.css'

export default function InventoryForm({ editingItem, onSuccess, onCancel, categories }) {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    quantity: 0,
    cost_price: '0.00',
    selling_price: '0.00',
    reorder_level: 10,
    formular: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editingItem) {
      setFormData({
        sku: editingItem.sku || '',
        name: editingItem.name || '',
        category: editingItem.category?.toString() || '',
        quantity: editingItem.quantity || 0,
        cost_price: editingItem.cost_price || '0.00',
        selling_price: editingItem.selling_price || '0.00',
        reorder_level: editingItem.reorder_level || 10,
        formular: editingItem.formular || ''
      })
    } else {
      setFormData({
        sku: '', name: '', category: '', quantity: 0,
        cost_price: '0.00', selling_price: '0.00', reorder_level: 10,
        formular: ''
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
      const dataToSubmit = {...formData }

      // Convert category to int/null for backend
      dataToSubmit.category = dataToSubmit.category === '' || dataToSubmit.category === null
       ? null
        : Number(dataToSubmit.category)

      // Convert numbers
      dataToSubmit.quantity = Number(dataToSubmit.quantity)
      dataToSubmit.reorder_level = Number(dataToSubmit.reorder_level)
      dataToSubmit.cost_price = Number(dataToSubmit.cost_price)
      dataToSubmit.selling_price = Number(dataToSubmit.selling_price)

      if (editingItem) {
        await inventoryAPI.updateItem(editingItem.id, dataToSubmit)
      } else {
        await inventoryAPI.createItem(dataToSubmit)
      }
      onSuccess()
    } catch (err) {
      if (err.response?.data) {
        setErrors(err.response.data)
      } else {
        setErrors({ detail: 'Failed to save. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <h2 className="form-title">
        {editingItem? 'Edit Item' : 'Add New Item'}
      </h2>

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">SKU*</label>
          <input
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            className="form-input"
            required
          />
          {errors.sku && <p className="error-text">{errors.sku}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">Name*</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="form-input"
            required
          />
          {errors.name && <p className="error-text">{errors.name}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">-- None --</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Quantity*</label>
          <input
            name="quantity"
            type="number"
            min="0"
            value={formData.quantity}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Cost Price*</label>
          <input
            name="cost_price"
            type="number"
            step="0.01"
            min="0"
            value={formData.cost_price}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Selling Price*</label>
          <input
            name="selling_price"
            type="number"
            step="0.01"
            min="0"
            value={formData.selling_price}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Reorder Level</label>
          <input
            name="reorder_level"
            type="number"
            min="0"
            value={formData.reorder_level}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Formula</label>
          <input
            name="formular"
            type="text"
            value={formData.formular}
            onChange={handleChange}
            placeholder="e.g. =A2*B2 or text note"
            className="form-input"
          />
          {errors.formular && <p className="error-text">{errors.formular}</p>}
        </div>
      </div>

      {errors.detail && <p className="error-text">{errors.detail}</p>}

      <div className="form-actions">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
        >
          {loading? 'Saving...' : editingItem? 'Update' : 'Create'}
        </button>
        {editingItem && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}