import { inventoryAPI } from '../api/api';
import '../styles/InventoryTable.css'

export default function InventoryTable({ items, onEdit, onRefresh, pagination, onPageChange }) {
  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      await inventoryAPI.deleteItem(id);
      onRefresh();
    } catch (err) {
      console.error("Failed to delete:", err);
      alert("Failed to delete item. Please try again.");
    }
  };

  // Safely handle pagination data
  // If pagination is undefined (loading), default to page 1
  const currentPage = pagination?.current_page || 1;
  const totalItems = pagination?.count || 0;
  const totalPages = pagination?.total_pages || 1;

  // Fallback if pagination object is missing entirely
  const hasPrev = pagination?.has_previous || false;
  const hasNext = pagination?.has_next || false;

  return (
    <div className="bg-white rounded shadow" style={{width: '100%', overflowX: 'auto',backgroundColor: '#24b091'}}>
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
          {!items || items.length === 0 ? (
            <tr>
              <td colSpan="7" className="p-8 text-center text-gray-500">
                {pagination ? "No items found" : "Loading items..."}
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-mono text-sm">{item.sku}</td>
                <td className="p-3">{item.name}</td>
                <td className="p-3">{item.category_name || '-'}</td>
                <td className="p-3">{item.quantity}</td>
                <td className="p-3">${item.selling_price}</td>
                <td className="p-3">
                  {item.is_low_stock ? (
                    <span className="text-red-600 font-semibold text-sm">Low Stock</span>
                  ) : (
                    <span className="text-green-600 text-sm">In Stock</span>
                  )}
                </td>
                <td className="p-3 space-x-3">
                  <button
                    onClick={() => onEdit(item)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      {pagination && (
        <div className="flex justify-between items-center p-4 border-t">
          <div className="text-sm text-gray-600">
            Showing {items?.length || 0} of {totalItems} items
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!hasPrev}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!hasNext}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}