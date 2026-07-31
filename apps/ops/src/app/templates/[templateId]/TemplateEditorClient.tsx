'use client';

import { useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import {
  addTemplateLine,
  updateTemplateLine,
  removeTemplateLine,
  importBatchTemplateLines,
  updateSchoolTemplate,
} from '@/app/crud-actions';
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  Upload,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Save,
  X,
  BookOpen,
} from 'lucide-react';

interface Product {
  id: string;
  itemName: string;
  sku: string;
  brand: string | null;
  unitPrice: any;
  category: string;
}

interface TemplateLine {
  id: string;
  productId: string;
  quantityRequired: number;
  isOptional: boolean;
  product: Product;
}

interface School {
  id: string;
  name: string;
}

interface SchoolTemplate {
  id: string;
  schoolId: string;
  name: string;
  gradeLevel: string;
  academicYear: number;
  school: School;
  lines: TemplateLine[];
}

interface TemplateEditorClientProps {
  template: SchoolTemplate;
  products: Product[];
}

export default function TemplateEditorClient({ template, products }: TemplateEditorClientProps) {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [showEditMetaModal, setShowEditMetaModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // AI Import Scanner states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [textList, setTextList] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    parsedItems: Array<{ scannedText: string; productId: string | null; quantity: number; confidence: string; note: string }>;
  } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Add Line states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [manualQty, setManualQty] = useState(1);
  const [manualOptional, setManualOptional] = useState(false);

  // Handle AI Scan submit
  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile && !textList.trim()) return;

    setIsScanning(true);
    setScanError(null);
    setScanResult(null);

    try {
      let fileBase64: string | null = null;
      let fileType: string | null = null;

      if (uploadFile) {
        fileType = uploadFile.type;
        fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(uploadFile);
        });
      }

      const res = await fetch('/api/ai/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textList,
          fileBase64,
          fileType,
          schoolId: template.schoolId,
        }),
      });

      if (!res.ok) {
        throw new Error(`AI Scan server returned status ${res.status}`);
      }

      const data = await res.json();
      setScanResult(data);
    } catch (err: any) {
      console.error('[Template AI Scan Error]:', err);
      setScanError(err.message || 'Failed to parse stationery list. Please check file format.');
    } finally {
      setIsScanning(false);
    }
  };

  // Import AI matched items to template lines
  const handleBatchImport = () => {
    if (!scanResult || !scanResult.parsedItems) return;
    const itemsToImport = scanResult.parsedItems
      .filter((item) => item.productId)
      .map((item) => ({
        productId: item.productId!,
        quantity: item.quantity || 1,
        isOptional: false,
      }));

    if (itemsToImport.length === 0) return;

    startTransition(async () => {
      await importBatchTemplateLines(template.id, itemsToImport);
      setScanResult(null);
      setUploadFile(null);
      setTextList('');
    });
  };

  // Handle manual line add
  const handleManualAddLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    startTransition(async () => {
      await addTemplateLine(template.id, selectedProductId, manualQty, manualOptional);
      setSelectedProductId('');
      setManualQty(1);
      setManualOptional(false);
    });
  };

  // Handle line item quantity adjust
  const handleQtyChange = (lineId: string, currentQty: number, delta: number, isOptional: boolean) => {
    const nextQty = Math.max(1, currentQty + delta);
    startTransition(async () => {
      await updateTemplateLine(lineId, nextQty, isOptional);
    });
  };

  // Handle optional toggle
  const handleOptionalToggle = (lineId: string, quantityRequired: number, currentOptional: boolean) => {
    startTransition(async () => {
      await updateTemplateLine(lineId, quantityRequired, !currentOptional);
    });
  };

  // Handle remove line
  const handleRemoveLine = (lineId: string) => {
    startTransition(async () => {
      await removeTemplateLine(lineId);
    });
  };

  // Handle edit metadata form
  const handleEditMetaSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateSchoolTemplate(template.id, formData);
      setShowEditMetaModal(false);
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="space-y-1">
          <Link href="/templates" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-jetblack mb-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Templates List
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-papaya/20 border border-papaya/40 flex items-center justify-center text-caramel">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-jetblack">{template.name}</h1>
              <p className="text-xs text-gray-500 font-medium">
                {template.school.name} &bull; Grade {template.gradeLevel} ({template.academicYear})
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowEditMetaModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-papaya hover:text-jetblack hover:border-transparent text-xs font-bold text-gray-700 transition-all shadow-xs"
        >
          <Edit3 className="h-4 w-4" />
          <span>Edit Metadata</span>
        </button>
      </div>

      {/* Main Grid: Scanner & Add Form on Left, Items Table on Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Side: Add Items (AI Scanner OR Manual Add) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-5">
            {/* Mode Switcher Tabs */}
            <div className="flex border border-gray-200 rounded-xl p-1 bg-gray-50">
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'ai'
                    ? 'bg-white text-jetblack shadow-xs font-black'
                    : 'text-gray-500 hover:text-jetblack'
                }`}
              >
                <Sparkles className="h-4 w-4 text-papaya" />
                <span>AI List Scanner</span>
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'manual'
                    ? 'bg-white text-jetblack shadow-xs font-black'
                    : 'text-gray-500 hover:text-jetblack'
                }`}
              >
                <Plus className="h-4 w-4 text-caramel" />
                <span>Add Item Manually</span>
              </button>
            </div>

            {/* TAB 1: AI LIST SCANNER */}
            {activeTab === 'ai' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-sm text-jetblack flex items-center gap-2">
                    <Sparkles className="text-papaya h-4 w-4" />
                    Scan School List (PDF/Photo/Text)
                  </h3>
                  <p className="text-xs text-gray-500 leading-normal">
                    Upload a paper list PDF or photo, or paste list text. Preppi AI will match items to the catalog and populate this template automatically!
                  </p>
                </div>

                <form onSubmit={handleScanSubmit} className="space-y-4">
                  {/* Drag & Drop File Upload */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 hover:border-papaya hover:bg-papaya/5 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 relative bg-gray-50/50"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <div className="mx-auto h-10 w-10 rounded-full bg-white flex items-center justify-center border border-gray-200 text-gray-500 shadow-xs">
                      <Upload className="h-5 w-5 text-papaya" />
                    </div>
                    {uploadFile ? (
                      <p className="text-xs font-bold text-jetblack">{uploadFile.name}</p>
                    ) : (
                      <p className="text-xs font-bold text-gray-700">
                        Click to upload list PDF or photo
                      </p>
                    )}
                  </div>

                  {/* Or Text Paste */}
                  <div className="space-y-1">
                    <label htmlFor="textList" className="block text-xs font-semibold text-gray-600">
                      Or Paste List Text
                    </label>
                    <textarea
                      id="textList"
                      rows={4}
                      value={textList}
                      onChange={(e) => setTextList(e.target.value)}
                      placeholder="e.g. 2x HB Pencils, 4x A4 Exercise Books..."
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs focus:border-papaya focus:bg-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isScanning || (!uploadFile && !textList.trim())}
                    className="w-full py-3 bg-jetblack text-white hover:bg-caramel text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4 text-papaya" />
                    <span>{isScanning ? 'Scanning List with AI...' : 'Scan & Extract Items'}</span>
                  </button>
                </form>

                {scanError && (
                  <div className="rounded-xl bg-vermillion/10 border border-vermillion/20 p-3 text-xs font-bold text-vermillion flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{scanError}</span>
                  </div>
                )}

                {/* AI Extracted Results Preview */}
                {scanResult && scanResult.parsedItems && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-xs text-jetblack flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Extracted {scanResult.parsedItems.filter((i) => i.productId).length} Matched Items
                      </h4>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {scanResult.parsedItems.map((item, idx) => {
                        const matchedProd = products.find((p) => p.id === item.productId);
                        return (
                          <div key={idx} className="bg-white p-2.5 rounded-xl border border-gray-200 text-xs flex items-center justify-between">
                            <div>
                              <p className="font-bold text-jetblack">{item.scannedText}</p>
                              {matchedProd ? (
                                <p className="text-[10px] text-green-700 font-bold">
                                  Matched: {matchedProd.itemName} ({matchedProd.sku})
                                </p>
                              ) : (
                                <p className="text-[10px] text-amber-700 font-semibold">Unmatched</p>
                              )}
                            </div>
                            <span className="font-black text-xs text-papaya bg-jetblack px-2 py-0.5 rounded">
                              x{item.quantity || 1}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={handleBatchImport}
                      disabled={isPending}
                      className="w-full py-3 bg-papaya text-jetblack hover:bg-caramel hover:text-white text-xs font-black rounded-xl transition-all shadow-xs"
                    >
                      {isPending ? 'Importing...' : 'Add All Matched Items To Template'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MANUAL ADD ITEM */}
            {activeTab === 'manual' && (
              <form onSubmit={handleManualAddLine} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="productSelect" className="block text-xs font-semibold text-gray-600">
                    Select Catalog Product
                  </label>
                  <select
                    id="productSelect"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs focus:border-papaya focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Choose stationery item --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.itemName} ({p.sku}) &bull; R {Number(p.unitPrice).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="manualQty" className="block text-xs font-semibold text-gray-600">
                      Quantity Required
                    </label>
                    <input
                      type="number"
                      id="manualQty"
                      min={1}
                      value={manualQty}
                      onChange={(e) => setManualQty(Number(e.target.value))}
                      required
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-bold focus:border-papaya focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 flex flex-col justify-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                      <input
                        type="checkbox"
                        checked={manualOptional}
                        onChange={(e) => setManualOptional(e.target.checked)}
                        className="rounded accent-papaya h-4 w-4"
                      />
                      <span>Optional Item?</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending || !selectedProductId}
                  className="w-full py-3 bg-jetblack text-white hover:bg-caramel text-xs font-black rounded-xl transition-all disabled:opacity-50"
                >
                  {isPending ? 'Adding...' : 'Add Item to Template'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Side: Configured Template Items Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-150 px-6 py-4 bg-gray-50/50 flex items-center justify-between">
            <h3 className="font-black text-sm text-gray-900">
              Template Line Items ({template.lines.length})
            </h3>
            <span className="text-xs font-bold text-caramel">
              Total Required: {template.lines.reduce((sum, l) => sum + l.quantityRequired, 0)} units
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-150 text-xs font-black uppercase text-gray-400 tracking-wider">
                  <th className="px-6 py-4">Item & SKU</th>
                  <th className="px-6 py-4 text-center">Quantity</th>
                  <th className="px-6 py-4 text-center">Optional?</th>
                  <th className="px-6 py-4 text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {template.lines.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      No items configured in this template yet. Use the scanner or form on the left to add items.
                    </td>
                  </tr>
                ) : (
                  template.lines.map((line) => (
                    <tr key={line.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="px-6 py-4 text-xs">
                        <p className="font-bold text-sm text-gray-900">{line.product.itemName}</p>
                        <p className="text-gray-400 mt-0.5 font-mono">
                          SKU: {line.product.sku} {line.product.brand ? `• Brand: ${line.product.brand}` : ''}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2 border border-gray-200 rounded-xl px-2 py-1 bg-gray-50">
                          <button
                            onClick={() => handleQtyChange(line.id, line.quantityRequired, -1, line.isOptional)}
                            disabled={isPending || line.quantityRequired <= 1}
                            className="h-6 w-6 rounded-lg bg-white border border-gray-200 hover:bg-papaya font-bold text-xs flex items-center justify-center disabled:opacity-40 transition-colors"
                          >
                            -
                          </button>
                          <span className="font-black text-xs min-w-[20px] text-center">{line.quantityRequired}</span>
                          <button
                            onClick={() => handleQtyChange(line.id, line.quantityRequired, 1, line.isOptional)}
                            disabled={isPending}
                            className="h-6 w-6 rounded-lg bg-white border border-gray-200 hover:bg-papaya font-bold text-xs flex items-center justify-center disabled:opacity-40 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={line.isOptional}
                          onChange={() => handleOptionalToggle(line.id, line.quantityRequired, line.isOptional)}
                          className="rounded accent-papaya h-4 w-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemoveLine(line.id)}
                          disabled={isPending}
                          className="p-2 rounded-xl text-gray-400 hover:text-vermillion hover:bg-vermillion/10 transition-colors"
                          title="Remove from template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Metadata Modal */}
      {showEditMetaModal && (
        <div className="fixed inset-0 z-50 bg-jetblack/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-gray-200 shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowEditMetaModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-jetblack p-1 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-caramel">
                Template Configuration
              </span>
              <h3 className="text-xl font-black text-jetblack">Edit Template Details</h3>
            </div>

            <form onSubmit={handleEditMetaSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="name" className="block text-xs font-semibold text-gray-600">
                  Template Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  defaultValue={template.name}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-bold focus:border-papaya focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="gradeLevel" className="block text-xs font-semibold text-gray-600">
                    Grade Level
                  </label>
                  <input
                    type="text"
                    id="gradeLevel"
                    name="gradeLevel"
                    required
                    defaultValue={template.gradeLevel}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="academicYear" className="block text-xs font-semibold text-gray-600">
                    Academic Year
                  </label>
                  <input
                    type="number"
                    id="academicYear"
                    name="academicYear"
                    required
                    defaultValue={template.academicYear}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-3 bg-papaya text-jetblack hover:bg-caramel hover:text-white font-black text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  <span>{isPending ? 'Saving...' : 'Save Template Updates'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditMetaModal(false)}
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
