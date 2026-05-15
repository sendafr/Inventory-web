import { inventoryAPI } from '../api/client'

export default function InventoryTable({ items, onEdit, onRefresh, pagination, onPageChange }) {
  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return
    await inventoryAPI.deleteItem(id)
    onRefresh()
  }

  const totalPages = Math.ceil(pagination.count / 20) // PAGE_SIZE = 20
  const currentPage = pagination.next? 
    new URL(pagination.next).searchParams.get('page') - 1 : 
    pagination.previous? 
      Number(new URL(pagination.previous).searchParams.get('page') || 1) + 1 : 1

  return (
    <div className="bg-white rounded shadow">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="p-3 text-left">SKU</th>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Category</th>
            <th className="p-3 text-left">Qty</th>
            <th className="p-3 text-left">Price</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0? (
            <tr>
              <td colSpan="7" className="p-8 text-center text-gray-500">No items found</td>
            </tr>
          ) : items.map(item => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              <td className="p-3 font-mono text-sm">{item.sku}</td>
              <td className="p-3">{item.name}</td>
              <td className="p-3">{item.category_name || '-'}</td>
              <td className="p-3">{item.quantity}</td>
              <td className="p-3">${item.selling_price}</td>
              <td className="p-3">
                {item.is_low_stock? 
                  <span className="text-red-600 font-semibold text-sm">Low Stock</span> : 
                  <span className="text-green-600 text-sm">In Stock</span>
                }
              </td>
              <td className="p-3 space-x-3">
                <button onClick={() => onEdit(item)} className="text-blue-600 hover:underline text-sm">
                  Edit
                </button>
                <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline text-sm">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center p-4 border-t">
        <div className="text-sm text-gray-600">
          Showing {items.length} of {pagination.count} items
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!pagination.previous}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!pagination.next}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}