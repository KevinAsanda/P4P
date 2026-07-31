'use client';

import { useState, useTransition } from 'react';
import { createProduct, updateProduct, updateProductStock } from '@/app/crud-actions';
import { Plus, Edit3, X, Check, Save } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
}

interface Product {
  id: string;
  itemName: string;
  sku: string;
  brand: string | null;
  unitPrice: any;
  qtyOnHand: number;
  reorderThreshold: number;
  category: string;
  supplierId: string | null;
  supplier: Supplier | null;
}

interface ProductsClientProps {
  products: Product[];
  suppliers: Supplier[];
}

export default function ProductsClient({ products, suppliers }: ProductsClientProps) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUpdateStockInline = (productId: string, newQty: number) => {
    const formData = new FormData();
    formData.set('productId', productId);
    formData.set('qtyOnHand', String(newQty));
    startTransition(async () => {
      await updateProductStock(productId, newQty);
    });
  };

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const formElement = e.currentTarget;
    startTransition(async () => {
      await createProduct(formData);
      formElement.reset();
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateProduct(formData);
      setEditingProduct(null);
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Products Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-150 text-xs font-black uppercase text-gray-400 tracking-wider">
                  <th className="px-6 py-4">Item Details</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Unit Price</th>
                  <th className="px-6 py-4 text-center">Stock / Threshold</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      No products registered yet. Use the form to enroll items.
                    </td>
                  </tr>
                ) : (
                  products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="px-6 py-4 text-xs">
                        <p className="font-bold text-sm text-gray-900">{prod.itemName}</p>
                        <p className="text-gray-400 mt-0.5 font-mono">
                          SKU: {prod.sku} {prod.brand ? `• Brand: ${prod.brand}` : ''}
                        </p>
                        {prod.supplier && (
                          <p className="text-[10px] text-gray-400 mt-1 font-semibold">
                            Vendor: {prod.supplier.name}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                            prod.category === 'Service'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {prod.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 text-xs">
                        R {Number(prod.unitPrice).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center text-xs">
                        <span className={`font-black ${prod.qtyOnHand <= prod.reorderThreshold ? 'text-vermillion' : 'text-gray-900'}`}>
                          {prod.qtyOnHand}
                        </span>
                        <span className="text-gray-400 block text-[10px]">Threshold: {prod.reorderThreshold}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingProduct(prod)}
                            className="p-2 rounded-xl bg-gray-100 hover:bg-papaya hover:text-jetblack text-gray-700 border border-gray-200 transition-colors"
                            title="Edit Product Details"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Creation Form (Right Sidebar) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
            <Plus className="text-papaya h-5 w-5" />
            Register Product
          </h3>

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="itemName" className="block text-xs font-semibold text-gray-600">
                Item Name
              </label>
              <input
                type="text"
                id="itemName"
                name="itemName"
                required
                placeholder="e.g. Staedtler Tradition HB Pencil"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="sku" className="block text-xs font-semibold text-gray-600">
                  SKU Code
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  required
                  placeholder="e.g. PENCIL-HB-01"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-mono focus:border-papaya focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="brand" className="block text-xs font-semibold text-gray-600">
                  Brand (Optional)
                </label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  placeholder="e.g. Staedtler"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="unitPrice" className="block text-xs font-semibold text-gray-600">
                  Unit Price (ZAR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="unitPrice"
                  name="unitPrice"
                  required
                  placeholder="12.50"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="category" className="block text-xs font-semibold text-gray-600">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                >
                  <option value="Stationery">Stationery</option>
                  <option value="Books & Paper">Books &amp; Paper</option>
                  <option value="Art & Crafts">Art &amp; Crafts</option>
                  <option value="Service">Service (Covering / Labeling)</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="qtyOnHand" className="block text-xs font-semibold text-gray-600">
                  Initial Stock
                </label>
                <input
                  type="number"
                  id="qtyOnHand"
                  name="qtyOnHand"
                  defaultValue={100}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="reorderThreshold" className="block text-xs font-semibold text-gray-600">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  id="reorderThreshold"
                  name="reorderThreshold"
                  defaultValue={20}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="supplierId" className="block text-xs font-semibold text-gray-600">
                Supplier (Optional)
              </label>
              <select
                id="supplierId"
                name="supplierId"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
              >
                <option value="">-- Select vendor --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-jetblack text-white hover:bg-caramel text-xs font-black rounded-xl transition-all disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Add to Catalog'}
            </button>
          </form>
        </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-jetblack/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-gray-200 shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setEditingProduct(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-jetblack p-1 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-caramel">
                Catalog Maintenance
              </span>
              <h3 className="text-xl font-black text-jetblack">Edit Product Details</h3>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <input type="hidden" name="productId" value={editingProduct.id} />

              <div className="space-y-1">
                <label htmlFor="edit-itemName" className="block text-xs font-semibold text-gray-600">
                  Item Name
                </label>
                <input
                  type="text"
                  id="edit-itemName"
                  name="itemName"
                  required
                  defaultValue={editingProduct.itemName}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="edit-sku" className="block text-xs font-semibold text-gray-600">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    id="edit-sku"
                    name="sku"
                    required
                    defaultValue={editingProduct.sku}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-mono focus:border-papaya focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="edit-brand" className="block text-xs font-semibold text-gray-600">
                    Brand
                  </label>
                  <input
                    type="text"
                    id="edit-brand"
                    name="brand"
                    defaultValue={editingProduct.brand || ''}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="edit-unitPrice" className="block text-xs font-semibold text-gray-600">
                    Unit Price (ZAR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="edit-unitPrice"
                    name="unitPrice"
                    required
                    defaultValue={Number(editingProduct.unitPrice)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-bold focus:border-papaya focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="edit-category" className="block text-xs font-semibold text-gray-600">
                    Category
                  </label>
                  <select
                    id="edit-category"
                    name="category"
                    required
                    defaultValue={editingProduct.category}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                  >
                    <option value="Stationery">Stationery</option>
                    <option value="Books & Paper">Books &amp; Paper</option>
                    <option value="Art & Crafts">Art &amp; Crafts</option>
                    <option value="Service">Service (Covering / Labeling)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="edit-qtyOnHand" className="block text-xs font-semibold text-gray-600">
                    Quantity On Hand
                  </label>
                  <input
                    type="number"
                    id="edit-qtyOnHand"
                    name="qtyOnHand"
                    defaultValue={editingProduct.qtyOnHand}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none font-bold text-gray-900"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="edit-reorderThreshold" className="block text-xs font-semibold text-gray-600">
                    Reorder Threshold
                  </label>
                  <input
                    type="number"
                    id="edit-reorderThreshold"
                    name="reorderThreshold"
                    defaultValue={editingProduct.reorderThreshold}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="edit-supplierId" className="block text-xs font-semibold text-gray-600">
                  Supplier Vendor
                </label>
                <select
                  id="edit-supplierId"
                  name="supplierId"
                  defaultValue={editingProduct.supplierId || ''}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                >
                  <option value="">-- None --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-3 bg-papaya text-jetblack hover:bg-caramel hover:text-white font-black text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  <span>{isPending ? 'Saving...' : 'Save Product Updates'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-3 border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
