import { useState, useEffect } from 'react'
import { getItems, deleteItem } from '../api/inventory'

export default function InventoryTable({ onEdit }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchItems = async () => {
    try {
      const { data } = await getItems()
      setItems(data)
    } catch (err) {
      console.error('Failed to fetch items:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return
    await deleteItem(id)
    fetchItems()
  }

  if (loading) return <p>Loading...</p>

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-100">
          <th className="p-2 text-left">SKU</th>
          <th className="p-2 text-left">Name</th>
          <th className="p-2 text-left">Category</th>
          <th className="p-2 text-left">Qty</th>
          <th className="p-2 text-left">Price</th>
          <th className="p-2 text-left">Status</th>
          <th className="p-2 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.id} className="border-b">
            <td className="p-2">{item.sku}</td>
            <td className="p-2">{item.name}</td>
            <td className="p-2">{item.category_name || '-'}</td>
            <td className="p-2">{item.quantity}</td>
            <td className="p-2">${item.selling_price}</td>
            <td className="p-2">
              {item.is_low_stock ? 
                <span className="text-red-600 font-semibold">Low</span> : 
                <span className="text-green-600">OK</span>
              }
            </td>
            <td className="p-2 space-x-2">
              <button onClick={() => onEdit(item)} className="text-blue-600">Edit</button>
              <button onClick={() => handleDelete(item.id)} className="text-red-600">Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}