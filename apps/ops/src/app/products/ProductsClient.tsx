'use client';

import { useState, useTransition, useRef } from 'react';
import { createProduct, updateProduct, updateProductStock, importBatchProducts } from '@/app/crud-actions';
import { Plus, Edit3, X, Save, Sparkles, Upload, CheckCircle2, AlertTriangle, Trash2, FileSpreadsheet } from 'lucide-react';

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
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Bulk AI Importer states
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkText, setBulkText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [extractedProducts, setExtractedProducts] = useState<Array<{
    itemName: string;
    sku: string;
    brand: string;
    unitPrice: number;
    qtyOnHand: number;
    reorderThreshold: number;
    category: string;
  }> | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Run AI extraction on uploaded supplier document or text list
  const handleBulkScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFile && !bulkText.trim()) return;

    setIsScanning(true);
    setScanError(null);
    setExtractedProducts(null);

    try {
      let fileBase64: string | null = null;
      let fileType: string | null = null;

      if (bulkFile) {
        fileType = bulkFile.type;
        fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(bulkFile);
        });
      }

      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textContent: bulkText,
          fileBase64,
          fileType,
        }),
      });

      if (!res.ok) {
        throw new Error(`Catalog import server returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.parsedProducts && Array.isArray(data.parsedProducts)) {
        setExtractedProducts(data.parsedProducts);
      } else {
        throw new Error('No items parsed from document');
      }
    } catch (err: any) {
      console.error('[Bulk Product Scan Error]:', err);
      setScanError(err.message || 'Failed to extract products from document.');
    } finally {
      setIsScanning(false);
    }
  };

  // Commit extracted products to database in bulk
  const handleCommitBulkImport = () => {
    if (!extractedProducts || extractedProducts.length === 0) return;

    startTransition(async () => {
      await importBatchProducts(extractedProducts);
      setShowBulkModal(false);
      setExtractedProducts(null);
      setBulkFile(null);
      setBulkText('');
    });
  };

  // Inline edit in extracted verification table before committing
  const handleExtractedRowChange = (index: number, field: string, value: any) => {
    if (!extractedProducts) return;
    const updated = [...extractedProducts];
    updated[index] = { ...updated[index], [field]: value };
    setExtractedProducts(updated);
  };

  const handleExtractedRowDelete = (index: number) => {
    if (!extractedProducts) return;
    setExtractedProducts(extractedProducts.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <span className="text-xs font-bold text-gray-500">
          Showing {products.length} registered products
        </span>
        <button
          onClick={() => setShowBulkModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-jetblack text-papaya hover:bg-caramel hover:text-white font-black text-xs transition-all shadow-sm"
        >
          <Sparkles className="h-4 w-4 text-papaya" />
          <span>⚡ Bulk AI Document Import</span>
        </button>
      </div>

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
                      No products registered yet. Use the form or Bulk AI Importer to enroll items.
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
            Register Single Product
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

      {/* MODAL 1: Bulk AI Document Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-jetblack/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full border-2 border-papaya shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowBulkModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-jetblack p-1 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-caramel flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Automated Inventory Ingestion
              </span>
              <h3 className="text-xl font-black text-jetblack">Bulk AI Product Document Import</h3>
              <p className="text-xs text-gray-500">
                Upload a supplier price list (PDF / photo) or paste text product data. Preppi AI will parse and extract all items into a structured catalog for your verification.
              </p>
            </div>

            {/* Document Upload Form */}
            <form onSubmit={handleBulkScanSubmit} className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 hover:border-papaya hover:bg-papaya/5 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 relative bg-gray-50/50"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <div className="mx-auto h-10 w-10 rounded-full bg-white flex items-center justify-center border border-gray-200 text-gray-500 shadow-xs">
                  <Upload className="h-5 w-5 text-papaya" />
                </div>
                {bulkFile ? (
                  <p className="text-xs font-bold text-jetblack">{bulkFile.name}</p>
                ) : (
                  <p className="text-xs font-bold text-gray-700">
                    Click to upload supplier invoice or price list (PDF or photo)
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="bulkText" className="block text-xs font-semibold text-gray-600">
                  Or Paste Supplier Product List / CSV
                </label>
                <textarea
                  id="bulkText"
                  rows={4}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="e.g. Staedtler HB Pencil R12.50&#13;Croxley A4 72pg Exercise Book R14.00..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-mono focus:border-papaya focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isScanning || (!bulkFile && !bulkText.trim())}
                className="w-full py-3 bg-jetblack text-white hover:bg-caramel text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4 text-papaya" />
                <span>{isScanning ? 'Extracting Products with AI...' : 'Scan & Extract Product Catalog'}</span>
              </button>
            </form>

            {scanError && (
              <div className="rounded-xl bg-vermillion/10 border border-vermillion/20 p-3 text-xs font-bold text-vermillion flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{scanError}</span>
              </div>
            )}

            {/* Extracted Verification Grid */}
            {extractedProducts && (
              <div className="space-y-4 pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-jetblack flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Verify Extracted Products ({extractedProducts.length} items)
                  </h4>
                  <span className="text-[11px] text-gray-500">
                    You can edit any field below before importing
                  </span>
                </div>

                <div className="overflow-x-auto max-h-64 border border-gray-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200 sticky top-0">
                        <th className="p-2.5">Item Name</th>
                        <th className="p-2.5">SKU</th>
                        <th className="p-2.5">Brand</th>
                        <th className="p-2.5">Price (ZAR)</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5">Stock</th>
                        <th className="p-2.5 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {extractedProducts.map((prod, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-2">
                            <input
                              type="text"
                              value={prod.itemName}
                              onChange={(e) => handleExtractedRowChange(idx, 'itemName', e.target.value)}
                              className="w-full bg-transparent border-b border-gray-200 focus:border-papaya focus:outline-none font-bold"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={prod.sku}
                              onChange={(e) => handleExtractedRowChange(idx, 'sku', e.target.value)}
                              className="w-full bg-transparent border-b border-gray-200 focus:border-papaya focus:outline-none font-mono text-[11px]"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={prod.brand || ''}
                              onChange={(e) => handleExtractedRowChange(idx, 'brand', e.target.value)}
                              className="w-full bg-transparent border-b border-gray-200 focus:border-papaya focus:outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              value={prod.unitPrice}
                              onChange={(e) => handleExtractedRowChange(idx, 'unitPrice', Number(e.target.value))}
                              className="w-20 bg-transparent border-b border-gray-200 focus:border-papaya focus:outline-none font-bold"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={prod.category || 'Stationery'}
                              onChange={(e) => handleExtractedRowChange(idx, 'category', e.target.value)}
                              className="bg-transparent border-b border-gray-200 focus:border-papaya focus:outline-none"
                            >
                              <option value="Stationery">Stationery</option>
                              <option value="Books & Paper">Books &amp; Paper</option>
                              <option value="Art & Crafts">Art &amp; Crafts</option>
                              <option value="Service">Service</option>
                              <option value="Other">Other</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={prod.qtyOnHand || 100}
                              onChange={(e) => handleExtractedRowChange(idx, 'qtyOnHand', Number(e.target.value))}
                              className="w-16 bg-transparent border-b border-gray-200 focus:border-papaya focus:outline-none text-center font-bold"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleExtractedRowDelete(idx)}
                              className="text-gray-400 hover:text-vermillion p-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCommitBulkImport}
                    disabled={isPending}
                    className="flex-1 py-3 bg-papaya text-jetblack hover:bg-caramel hover:text-white font-black text-xs rounded-xl transition-all shadow-sm"
                  >
                    {isPending ? 'Importing Products...' : `Import All ${extractedProducts.length} Verified Products`}
                  </button>
                  <button
                    onClick={() => setExtractedProducts(null)}
                    className="px-4 py-3 border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                  >
                    Reset Extracted List
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Product Modal */}
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
