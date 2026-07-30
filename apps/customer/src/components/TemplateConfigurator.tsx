'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ClipboardList, Shield, HelpCircle } from 'lucide-react';

interface ProductInfo {
  id: string;
  itemName: string;
  sku: string;
  brand: string | null;
  unitPrice: string; // prisma returns Decimals as strings or numbers, we cast to number
  category: string;
}

interface LineInfo {
  id: string;
  productId: string;
  quantityRequired: number;
  isOptional: boolean;
  displayOrder: number;
  product: ProductInfo;
}

interface TemplateDetails {
  id: string;
  name: string;
  gradeLevel: string;
  academicYear: number;
  school: {
    name: string;
  };
  lines: LineInfo[];
}

interface ServiceInfo {
  id: string;
  itemName: string;
  sku: string;
  unitPrice: string;
  brand: string | null;
}

interface TemplateConfiguratorProps {
  template: TemplateDetails;
  bookCoveringService: ServiceInfo | null;
  labelingService: ServiceInfo | null;
}

export default function TemplateConfigurator({
  template,
  bookCoveringService,
  labelingService,
}: TemplateConfiguratorProps) {
  const router = useRouter();

  // Store active cart items in state
  // Key = productId, Value = { quantity, isSelected }
  const [items, setItems] = useState<
    Record<string, { quantity: number; isSelected: boolean; isOptional: boolean; price: number; name: string; sku: string }>
  >({});

  // Add-on services state
  const [includeBookCovering, setIncludeBookCovering] = useState(false);
  const [includeLabeling, setIncludeLabeling] = useState(false);

  // Initialize state from template lines
  useEffect(() => {
    const initialItems: typeof items = {};
    template.lines.forEach((line) => {
      initialItems[line.productId] = {
        quantity: line.quantityRequired,
        isSelected: !line.isOptional, // Optional items start unselected
        isOptional: line.isOptional,
        price: Number(line.product.unitPrice),
        name: line.product.itemName,
        sku: line.product.sku,
      };
    });
    setItems(initialItems);
  }, [template]);

  // Toggle selection for optional items
  const handleToggleSelect = (productId: string) => {
    setItems((prev) => {
      const item = prev[productId];
      if (!item) return prev;
      return {
        ...prev,
        [productId]: {
          ...item,
          isSelected: !item.isSelected,
        },
      };
    });
  };

  // Adjust quantity
  const handleQtyChange = (productId: string, amount: number) => {
    setItems((prev) => {
      const item = prev[productId];
      if (!item) return prev;
      const newQty = Math.max(1, item.quantity + amount);
      return {
        ...prev,
        [productId]: {
          ...item,
          quantity: newQty,
        },
      };
    });
  };

  // Calculate book count for book covering service multiplication
  // Let's assume any item with "Book" in its name or sku starting with "BOK" counts as a book
  const selectedBookCount = Object.entries(items)
    .filter(([_, item]) => item.isSelected && (item.sku.startsWith('BOK') || item.name.toLowerCase().includes('book')))
    .reduce((sum, [_, item]) => sum + item.quantity, 0);

  // Calculations
  const stationerySubtotal = Object.values(items)
    .filter((item) => item.isSelected)
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  const bookCoveringPrice = bookCoveringService ? Number(bookCoveringService.unitPrice) : 0;
  const bookCoveringTotal = includeBookCovering ? bookCoveringPrice * selectedBookCount : 0;

  const labelingPrice = labelingService ? Number(labelingService.unitPrice) : 0;
  const labelingTotal = includeLabeling ? labelingPrice : 0;

  const grandTotal = stationerySubtotal + bookCoveringTotal + labelingTotal;

  const handleCheckoutRedirect = () => {
    // Pack configuration details
    const selectedStationery = Object.entries(items)
      .filter(([_, item]) => item.isSelected)
      .map(([productId, item]) => ({
        productId,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      }));

    const services = [];
    if (includeBookCovering && bookCoveringService) {
      services.push({
        productId: bookCoveringService.id,
        name: bookCoveringService.itemName,
        sku: bookCoveringService.sku,
        quantity: selectedBookCount,
        price: bookCoveringPrice,
        subtotal: bookCoveringTotal,
      });
    }
    if (includeLabeling && labelingService) {
      services.push({
        productId: labelingService.id,
        name: labelingService.itemName,
        sku: labelingService.sku,
        quantity: 1,
        price: labelingPrice,
        subtotal: labelingTotal,
      });
    }

    const cartData = {
      templateId: template.id,
      templateName: template.name,
      schoolName: template.school.name,
      gradeLevel: template.gradeLevel,
      academicYear: template.academicYear,
      items: selectedStationery,
      services,
      stationerySubtotal,
      servicesSubtotal: bookCoveringTotal + labelingTotal,
      grandTotal,
    };

    // Save to sessionStorage for checkout prefill
    sessionStorage.setItem('p4p_cart', JSON.stringify(cartData));
    router.push('/checkout');
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* List of items */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 flex items-center justify-between">
            <h3 className="font-extrabold text-jetblack flex items-center gap-2">
              <ClipboardList className="text-caramel h-5 w-5" />
              List Stationery Items
            </h3>
            <span className="text-xs font-bold text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-md">
              {template.lines.length} items configured
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {template.lines.map((line) => {
              const cartItem = items[line.productId];
              if (!cartItem) return null;

              return (
                <div
                  key={line.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4 transition-colors ${
                    cartItem.isSelected ? 'bg-white' : 'bg-gray-50/50 opacity-60'
                  }`}
                >
                  {/* Item Description */}
                  <div className="flex items-start gap-3 flex-1">
                    {line.isOptional ? (
                      <input
                        type="checkbox"
                        id={`check-${line.id}`}
                        checked={cartItem.isSelected}
                        onChange={() => handleToggleSelect(line.productId)}
                        className="mt-1 h-4.5 w-4.5 rounded border-gray-300 text-papaya focus:ring-papaya"
                      />
                    ) : (
                      <div className="mt-1 flex h-4.5 w-4.5 items-center justify-center rounded bg-papaya/10 text-papaya">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </div>
                    )}
                    <div>
                      <label
                        htmlFor={`check-${line.id}`}
                        className={`font-bold text-sm ${line.isOptional ? 'cursor-pointer' : ''}`}
                      >
                        {line.product.itemName}
                      </label>
                      <div className="flex flex-wrap gap-x-2 text-xs text-gray-400 mt-1">
                        <span>SKU: {line.product.sku}</span>
                        {line.product.brand && (
                          <>
                            <span>•</span>
                            <span>Brand: {line.product.brand}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="font-bold text-caramel">
                          {line.isOptional ? 'Optional' : 'Required'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Adjustment */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
                    <div className="text-right">
                      <span className="text-xs text-gray-400 block">Unit price</span>
                      <span className="font-semibold text-sm">R {cartItem.price.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleQtyChange(line.productId, -1)}
                        disabled={!cartItem.isSelected}
                        className="px-3 py-1.5 transition-colors duration-150 hover:bg-gray-50 font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <span className="px-3 font-semibold text-sm w-8 text-center">{cartItem.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleQtyChange(line.productId, 1)}
                        disabled={!cartItem.isSelected}
                        className="px-3 py-1.5 transition-colors duration-150 hover:bg-gray-50 font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right w-24">
                      <span className="text-xs text-gray-400 block">Total</span>
                      <span className="font-bold text-sm">
                        R {(cartItem.price * (cartItem.isSelected ? cartItem.quantity : 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Premium Up-sell Services */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="font-extrabold text-jetblack flex items-center gap-2">
            <Shield className="text-papaya h-5 w-5" />
            Add-on Services (Prepped with Love)
          </h3>
          <p className="text-sm text-gray-500">
            Let us do the hard work! Select professional book covering and personalized labelling.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Book Covering Service */}
            {bookCoveringService && (
              <div
                role="button"
                tabIndex={0}
                className={`border rounded-xl p-5 flex flex-col justify-between transition-all cursor-pointer select-none ${
                  includeBookCovering
                    ? 'border-papaya bg-papaya/5 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => setIncludeBookCovering(!includeBookCovering)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIncludeBookCovering(!includeBookCovering);
                  }
                }}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-sm text-jetblack">{bookCoveringService.itemName}</span>
                    <input
                      type="checkbox"
                      checked={includeBookCovering}
                      onChange={() => {}} // handled by div click
                      className="h-4.5 w-4.5 rounded border-gray-300 text-papaya focus:ring-papaya"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Every textbook and exercise book will be wrapped in premium, heavy-duty protective plastic.
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-end justify-between">
                  <div className="text-xs text-gray-400">
                    R {bookCoveringPrice.toFixed(2)} × {selectedBookCount} books
                  </div>
                  <div className="font-black text-sm text-jetblack">R {bookCoveringTotal.toFixed(2)}</div>
                </div>
              </div>
            )}

            {/* Custom Labeling Service */}
            {labelingService && (
              <div
                role="button"
                tabIndex={0}
                className={`border rounded-xl p-5 flex flex-col justify-between transition-all cursor-pointer select-none ${
                  includeLabeling
                    ? 'border-papaya bg-papaya/5 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => setIncludeLabeling(!includeLabeling)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIncludeLabeling(!includeLabeling);
                  }
                }}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-sm text-jetblack">{labelingService.itemName}</span>
                    <input
                      type="checkbox"
                      checked={includeLabeling}
                      onChange={() => {}} // handled by div click
                      className="h-4.5 w-4.5 rounded border-gray-300 text-papaya focus:ring-papaya"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    High-quality name label stickers printed and applied directly to every individual item.
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-end justify-between">
                  <div className="text-xs text-gray-400">Flat rate per student</div>
                  <div className="font-black text-sm text-jetblack">R {labelingTotal.toFixed(2)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Summary Sidebar */}
      <div className="lg:col-span-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 sticky top-6 space-y-6">
          <h3 className="font-black text-lg text-jetblack border-b border-gray-100 pb-3">
            Summary
          </h3>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Stationery Pack</span>
              <span className="font-bold text-jetblack">R {stationerySubtotal.toFixed(2)}</span>
            </div>

            {includeBookCovering && (
              <div className="flex justify-between text-gray-600 text-xs">
                <span>Book Covering ({selectedBookCount} items)</span>
                <span>R {bookCoveringTotal.toFixed(2)}</span>
              </div>
            )}

            {includeLabeling && (
              <div className="flex justify-between text-gray-600 text-xs">
                <span>Custom Labeling Service</span>
                <span>R {labelingTotal.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t border-gray-100 pt-4 flex justify-between items-end">
              <span className="font-bold text-gray-800">Total Pack Price</span>
              <span className="font-black text-2xl text-caramel">R {grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCheckoutRedirect}
            disabled={stationerySubtotal === 0}
            className="w-full rounded-xl bg-jetblack py-4 font-extrabold text-white transition-all hover:bg-caramel hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-jetblack"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
