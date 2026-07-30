'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Upload,
  FileText,
  Loader2,
  Check,
  AlertTriangle,
  ArrowRight,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  HelpCircle,
  Undo2,
  CheckCircle,
} from 'lucide-react';

interface School {
  id: string;
  name: string;
}

interface Product {
  id: string;
  itemName: string;
  brand: string;
  sku: string;
  unitPrice: number;
  category: string;
}

interface ListImporterClientProps {
  schools: School[];
  catalog: Product[];
}

interface DraftItem {
  id: string; // client-side unique ID
  scannedText: string;
  productId: string | null;
  quantity: number;
  isSelected: boolean;
  confidence: 'high' | 'medium' | 'low';
  note: string;
}

export default function ListImporterClient({ schools, catalog }: ListImporterClientProps) {
  const router = useRouter();

  // Step state: 'upload' | 'scanning' | 'review'
  const [step, setStep] = useState<'upload' | 'scanning' | 'review'>('upload');

  // Input states
  const [textList, setTextList] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  // Scanned results states
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [activeSubstitutions, setActiveSubstitutions] = useState<any[]>([]);
  const [suggestedUpsells, setSuggestedUpsells] = useState<any[]>([]);

  // Selected upsells state
  const [includeBookCovering, setIncludeBookCovering] = useState(false);
  const [includeLabeling, setIncludeLabeling] = useState(false);

  const [scanError, setScanError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert uploaded file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (file.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textList.trim() && !uploadFile) {
      setScanError('Please enter some text list or upload a photo/PDF list.');
      return;
    }

    setStep('scanning');
    setScanError(null);

    try {
      let fileBase64 = '';
      let fileType = '';

      if (uploadFile) {
        fileBase64 = await fileToBase64(uploadFile);
        fileType = uploadFile.type;
      }

      // Query AI Scanner route
      const response = await fetch('/api/ai/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          textList,
          fileBase64,
          fileType,
          schoolId: selectedSchoolId,
          gradeLevel: selectedGrade,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();

      // Format parsedItems to local draft checklist model
      const formattedDrafts: DraftItem[] = (result.parsedItems || []).map((item: any, idx: number) => ({
        id: `draft-${idx}`,
        scannedText: item.scannedText,
        productId: item.productId,
        quantity: item.quantity || 1,
        isSelected: !!item.productId,
        confidence: item.confidence || 'medium',
        note: item.note || '',
      }));

      setDraftItems(formattedDrafts);
      setActiveSubstitutions(result.substitutions || []);
      setSuggestedUpsells(result.upsells || []);

      // If upsell suggestions are present, let's toggle them in draft state as recommendations
      const hasCoveringUpsell = (result.upsells || []).some((u: any) =>
        catalog.find((p) => p.id === u.serviceProductId)?.itemName.toLowerCase().includes('covering')
      );
      const hasLabelingUpsell = (result.upsells || []).some((u: any) =>
        catalog.find((p) => p.id === u.serviceProductId)?.itemName.toLowerCase().includes('label')
      );
      
      setIncludeBookCovering(hasCoveringUpsell);
      setIncludeLabeling(hasLabelingUpsell);

      setStep('review');
    } catch (err: any) {
      console.error('Scan error:', err);
      setScanError(err.message || 'AI scanner encountered a processing failure.');
      setStep('upload');
    }
  };

  // Draft operations
  const handleToggleSelectItem = (id: string) => {
    setDraftItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isSelected: !item.isSelected } : item))
    );
  };

  const handleQtyChange = (id: string, amount: number) => {
    setDraftItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + amount) } : item
      )
    );
  };

  const handleProductOverride = (id: string, nextProductId: string) => {
    setDraftItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              productId: nextProductId || null,
              isSelected: !!nextProductId,
              note: nextProductId ? 'Manually selected override' : 'Unmapped',
            }
          : item
      )
    );
  };

  // Substitution switch
  const handleApplySubstitution = (originalProductId: string, cheaperProductId: string) => {
    setDraftItems((prev) =>
      prev.map((item) =>
        item.productId === originalProductId
          ? {
              ...item,
              productId: cheaperProductId,
              note: 'Switched to cheaper substitution',
            }
          : item
      )
    );
    // Remove the applied substitution suggestion card from view
    setActiveSubstitutions((prev) =>
      prev.filter((sub) => sub.originalProductId !== originalProductId)
    );
  };

  // Calculations
  const getProductDetails = (productId: string | null) => {
    if (!productId) return null;
    return catalog.find((p) => p.id === productId) || null;
  };

  // Count items eligible for book covering
  const selectedBookCount = draftItems
    .filter((item) => item.isSelected && item.productId)
    .map((item) => ({ item, prod: getProductDetails(item.productId) }))
    .filter(({ prod }) => prod && (prod.sku.startsWith('BOK') || prod.itemName.toLowerCase().includes('book')))
    .reduce((sum, { item }) => sum + item.quantity, 0);

  const stationerySubtotal = draftItems
    .filter((item) => item.isSelected && item.productId)
    .reduce((sum, item) => {
      const prod = getProductDetails(item.productId);
      return sum + (prod ? prod.unitPrice : 0) * item.quantity;
    }, 0);

  // Resolve upsell services pricing
  const bookCoveringService = catalog.find(
    (p) => p.category === 'Service' && p.itemName.toLowerCase().includes('covering')
  );
  const labelingService = catalog.find(
    (p) => p.category === 'Service' && p.itemName.toLowerCase().includes('label')
  );

  const bookCoveringTotal =
    includeBookCovering && bookCoveringService
      ? bookCoveringService.unitPrice * selectedBookCount
      : 0;

  const labelingTotal = includeLabeling && labelingService ? labelingService.unitPrice : 0;

  const grandTotal = stationerySubtotal + bookCoveringTotal + labelingTotal;

  // Add items and checkout
  const handleAddToCheckout = () => {
    const selectedStationery = draftItems
      .filter((item) => item.isSelected && item.productId)
      .map((item) => {
        const prod = getProductDetails(item.productId)!;
        return {
          productId: prod.id,
          name: prod.itemName,
          sku: prod.sku,
          quantity: item.quantity,
          price: prod.unitPrice,
          subtotal: prod.unitPrice * item.quantity,
        };
      });

    const services: any[] = [];
    if (includeBookCovering && bookCoveringService) {
      services.push({
        productId: bookCoveringService.id,
        name: bookCoveringService.itemName,
        sku: bookCoveringService.sku,
        quantity: selectedBookCount,
        price: bookCoveringService.unitPrice,
        subtotal: bookCoveringTotal,
      });
    }
    if (includeLabeling && labelingService) {
      services.push({
        productId: labelingService.id,
        name: labelingService.itemName,
        sku: labelingService.sku,
        quantity: 1,
        price: labelingService.unitPrice,
        subtotal: labelingTotal,
      });
    }

    const cartData = {
      templateId: 'ai-list-import',
      templateName: 'AI Scanned Stationery List',
      schoolName: schools.find((s) => s.id === selectedSchoolId)?.name || 'Custom List',
      gradeLevel: selectedGrade || 'Custom Grade',
      academicYear: new Date().getFullYear(),
      items: selectedStationery,
      services,
      stationerySubtotal,
      servicesSubtotal: bookCoveringTotal + labelingTotal,
      grandTotal,
    };

    // Prefill local checkout
    sessionStorage.setItem('p4p_cart', JSON.stringify(cartData));
    router.push('/checkout');
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      
      {/* Importer Steps Layout */}
      {step === 'upload' ? (
        // ---------------- STEP 1: UPLOAD PAGE ----------------
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main upload options */}
          <div className="lg:col-span-8 bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-papaya/10 text-caramel">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-extrabold text-lg text-gray-900 flex items-center gap-1.5">
                  Ask Preppi AI List Scanner
                </h2>
                <p className="text-xs text-gray-500">
                  Upload a photo, PDF list, or paste lines from WhatsApp. Preppi matches items automatically.
                </p>
              </div>
            </div>

            {scanError && (
              <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{scanError}</span>
              </div>
            )}

            <form onSubmit={handleScanSubmit} className="space-y-6">
              
              {/* File upload drag drop block */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-600">
                  Upload Stationery List (PDF or Photo)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 hover:border-papaya hover:bg-papaya/5 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3 relative bg-gray-50/50"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="mx-auto h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-xs border border-gray-150 text-gray-400">
                    <Upload className="h-5 w-5" />
                  </div>
                  {uploadFile ? (
                    <div>
                      <p className="text-xs font-bold text-gray-900">{uploadFile.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-gray-800">
                        Drag and drop your file here, or click to browse
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Supports JPEG, PNG, or PDF. Max size 5MB.
                      </p>
                    </div>
                  )}

                  {filePreview && (
                    <div className="mt-4 relative h-32 w-full max-w-[120px] mx-auto rounded-lg overflow-hidden border border-gray-200">
                      <img src={filePreview} alt="Preview" className="object-cover h-full w-full" />
                    </div>
                  )}
                </div>
              </div>

              {/* Pasted text list alternative */}
              <div className="space-y-2">
                <label htmlFor="textList" className="block text-sm font-semibold text-gray-600">
                  Or Paste List Items
                </label>
                <textarea
                  id="textList"
                  rows={6}
                  value={textList}
                  onChange={(e) => setTextList(e.target.value)}
                  placeholder="e.g.&#13;1x 30cm Ruler&#13;2x HB Writing Pencils&#13;4x A4 Exercise Books 72pg"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-xs font-bold focus:border-papaya focus:bg-white focus:outline-none placeholder-gray-400"
                />
              </div>

              {/* Submit Scan Button */}
              <button
                type="submit"
                className="w-full bg-jetblack text-white hover:bg-caramel hover:shadow-md py-4 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Scan and Match Stationery Pack
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Context Picker Sidebar (Right) */}
          <div className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <Sparkles className="text-papaya h-4 w-4" />
              Preppi Helper Setup
            </h3>
            
            <p className="text-xs text-gray-500 leading-normal">
              Selecting your child's school and grade helps Preppi accurately map generic stationery items and suggest appropriate exercise templates.
            </p>

            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <label htmlFor="school" className="block text-xs font-semibold text-gray-500">
                  Select School (Optional)
                </label>
                <select
                  id="school"
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-bold focus:border-papaya focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="">-- Any School --</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="grade" className="block text-xs font-semibold text-gray-500">
                  Select Grade (Optional)
                </label>
                <select
                  id="grade"
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-bold focus:border-papaya focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="">-- Any Grade --</option>
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((g) => (
                    <option key={g} value={g}>
                      Grade {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex gap-3 items-center">
              <div className="relative h-14 w-8 shrink-0">
                <Image src="/brand/preppi-mascot.svg" alt="Preppi" fill className="object-contain" />
              </div>
              <p className="text-[10px] text-gray-400 italic leading-snug">
                "Hi! I'm Preppi. Simply feed me your list and I will arrange your stationery checkout in seconds."
              </p>
            </div>
          </div>
        </div>
      ) : step === 'scanning' ? (
        // ---------------- STEP 2: LOADING SCANNING SCREEN ----------------
        <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center shadow-xs max-w-lg mx-auto py-16 space-y-6">
          <div className="relative h-28 w-16 mx-auto animate-bounce">
            <Image src="/brand/preppi-mascot.svg" alt="Preppi Mascot" fill className="object-contain" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-extrabold text-base text-gray-900 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-caramel" />
              Preppi is scanning...
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
              Extracting details, matching products to Durban school templates, and checking inventory pricing. Please hold on!
            </p>
          </div>
        </div>
      ) : (
        // ---------------- STEP 3: REVIEW draft CART SCREEN ----------------
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Mapped item list checklist (Left) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 flex items-center justify-between">
                <h3 className="font-extrabold text-jetblack flex items-center gap-2">
                  <Sparkles className="text-papaya h-5 w-5" />
                  AI Scanned Stationery Package
                </h3>
                <span className="text-xs bg-white px-2.5 py-1 rounded-md border border-gray-200 font-bold text-gray-500">
                  {draftItems.filter((i) => i.isSelected && i.productId).length} items matching
                </span>
              </div>

              {/* Items List checklist */}
              <div className="divide-y divide-gray-100">
                {draftItems.map((item) => {
                  const prod = getProductDetails(item.productId);
                  return (
                    <div
                      key={item.id}
                      className={`p-5 flex flex-col gap-4 sm:flex-row sm:items-center justify-between transition-all ${
                        item.isSelected ? 'bg-white' : 'bg-gray-50/50 opacity-50'
                      }`}
                    >
                      {/* Left: Check and details */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={item.isSelected}
                          onChange={() => handleToggleSelectItem(item.id)}
                          className="mt-1 h-4.5 w-4.5 rounded border-gray-300 text-papaya focus:ring-papaya"
                        />
                        <div className="space-y-1 w-full">
                          <p className="font-extrabold text-xs text-gray-400 leading-none">
                            SCANNED: "{item.scannedText}"
                          </p>
                          
                          {/* Product mapping overrides selector */}
                          <div className="pt-1 select-wrapper max-w-sm">
                            <select
                              value={item.productId || ''}
                              onChange={(e) => handleProductOverride(item.id, e.target.value)}
                              className="w-full rounded-lg border border-gray-200 bg-gray-50/80 px-2.5 py-1.5 text-xs font-bold text-gray-800 focus:outline-none focus:bg-white"
                            >
                              <option value="">-- Match Manually (Override) --</option>
                              {catalog.map((p) => (
                                <option key={p.id} value={p.id}>
                                  [{p.sku}] {p.itemName} (R {p.unitPrice.toFixed(2)})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Confidence details */}
                          <div className="flex items-center gap-2.5 text-[10px] mt-1.5">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                item.confidence === 'high'
                                  ? 'bg-green-500'
                                  : item.confidence === 'medium'
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                            />
                            <span className="font-semibold text-gray-500">
                              {item.confidence} Confidence Match
                            </span>
                            {item.note && <span className="text-gray-400">• {item.note}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Right: Quantity and price totals */}
                      {prod && (
                        <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-2 sm:pt-0">
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 block font-bold">UNIT</span>
                            <span className="font-bold text-xs">R {prod.unitPrice.toFixed(2)}</span>
                          </div>

                          {/* Qty increments */}
                          <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleQtyChange(item.id, -1)}
                              disabled={!item.isSelected}
                              className="px-2 py-1 hover:bg-gray-50 font-black disabled:opacity-30"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-2 font-bold text-xs text-center w-6">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleQtyChange(item.id, 1)}
                              disabled={!item.isSelected}
                              className="px-2 py-1 hover:bg-gray-50 font-black disabled:opacity-30"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="text-right w-20">
                            <span className="text-[10px] text-gray-400 block font-bold">TOTAL</span>
                            <span className="font-black text-xs">
                              R {(prod.unitPrice * (item.isSelected ? item.quantity : 0)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Substitution Suggestions Panel */}
            {activeSubstitutions.length > 0 && (
              <div className="bg-white border border-gray-150 rounded-2xl shadow-sm p-6 space-y-4">
                <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                  <Sparkles className="text-papaya h-5 w-5" />
                  Generic Substitutions (Cheaper Options)
                </h3>
                <p className="text-xs text-gray-500">
                  Save on your stationery list! Switch branded items to our quality generic alternatives.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeSubstitutions.map((sub, idx) => {
                    const original = getProductDetails(sub.originalProductId);
                    const cheaper = getProductDetails(sub.cheaperProductId);
                    if (!original || !cheaper) return null;

                    return (
                      <div
                        key={idx}
                        className="border border-papaya/20 bg-papaya-light/5 p-4 rounded-xl flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-caramel leading-none">
                            Switch & Save R {sub.priceSaving.toFixed(2)}
                          </p>
                          <h4 className="font-extrabold text-xs text-jetblack leading-tight mt-1.5">
                            Original: {original.itemName} (R {original.unitPrice.toFixed(2)})
                          </h4>
                          <p className="text-[11px] text-gray-600">
                            Generic alternative: <strong>{cheaper.itemName}</strong> (R {cheaper.unitPrice.toFixed(2)})
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplySubstitution(sub.originalProductId, sub.cheaperProductId)}
                          className="w-full py-1.5 bg-jetblack text-white hover:bg-caramel text-[10px] font-black rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Check className="h-3 w-3" />
                          Switch to Cheaper Alternative
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Cart totals and up-sell services sidebar (Right) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Upsell services card */}
            <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <CheckCircle className="text-papaya h-4 w-4" />
                Add-on Services
              </h3>

              {/* Book Covering toggle */}
              {bookCoveringService && (
                <div
                  onClick={() => setIncludeBookCovering(!includeBookCovering)}
                  className={`border rounded-xl p-4 flex flex-col justify-between transition-all cursor-pointer select-none ${
                    includeBookCovering
                      ? 'border-papaya bg-papaya/5 shadow-sm font-semibold'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-xs text-jetblack">{bookCoveringService.itemName}</span>
                    <input
                      type="checkbox"
                      checked={includeBookCovering}
                      onChange={() => {}} // handled by click
                      className="h-4 w-4 rounded border-gray-300 text-papaya focus:ring-papaya"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">
                    wrap exercise books and textbooks in heavy-duty plastic sleeves.
                  </p>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-gray-400">
                      R {bookCoveringService.unitPrice.toFixed(2)} &times; {selectedBookCount} books
                    </span>
                    <span className="font-extrabold text-jetblack">R {bookCoveringTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Custom Labeling toggle */}
              {labelingService && (
                <div
                  onClick={() => setIncludeLabeling(!includeLabeling)}
                  className={`border rounded-xl p-4 flex flex-col justify-between transition-all cursor-pointer select-none ${
                    includeLabeling
                      ? 'border-papaya bg-papaya/5 shadow-sm font-semibold'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-xs text-jetblack">{labelingService.itemName}</span>
                    <input
                      type="checkbox"
                      checked={includeLabeling}
                      onChange={() => {}} // handled by click
                      className="h-4 w-4 rounded border-gray-300 text-papaya focus:ring-papaya"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">
                    Personalized name labeling applied directly to pencils, rulers, and book covers.
                  </p>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-gray-400">Flat rate</span>
                    <span className="font-extrabold text-jetblack">R {labelingTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Subtotal & Checkout card */}
            <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-md sticky top-6 space-y-6">
              <h3 className="font-black text-base text-jetblack border-b border-gray-100 pb-2.5">
                Import Cart Summary
              </h3>

              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Stationery Subtotal</span>
                  <span className="font-bold text-jetblack">R {stationerySubtotal.toFixed(2)}</span>
                </div>

                {includeBookCovering && (
                  <div className="flex justify-between text-gray-600 text-[11px]">
                    <span>Book Covering ({selectedBookCount} books)</span>
                    <span>R {bookCoveringTotal.toFixed(2)}</span>
                  </div>
                )}

                {includeLabeling && (
                  <div className="flex justify-between text-gray-600 text-[11px]">
                    <span>Custom Labeling Service</span>
                    <span>R {labelingTotal.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-4 flex justify-between items-end">
                  <span className="font-bold text-gray-800">Grand Total</span>
                  <span className="font-black text-xl text-caramel">R {grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleAddToCheckout}
                  disabled={stationerySubtotal === 0}
                  className="w-full bg-jetblack text-white hover:bg-caramel hover:shadow-lg disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  Confirm & Go to Checkout
                </button>
                
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="w-full py-2.5 border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-500 hover:text-jetblack rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  Scan New List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
