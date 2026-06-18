'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Barcode,
  ArrowLeft,
  Printer,
  PackageCheck,
  User,
  School,
  Truck,
  AlertCircle,
  Eye,
} from 'lucide-react';
import {
  updateOrderFulfillmentStatus,
  updateOrderLinePacked,
  resetOrderPacking,
} from '../crud-actions';
import { OpsRole, formatAddressForRole } from '@/lib/rbac';

interface Product {
  id: string;
  itemName: string;
  sku: string;
  brand: string | null;
  unitPrice: any;
  category: string;
}

interface OrderLine {
  id: string;
  productId: string;
  quantityOrdered: number;
  unitPriceAtSale: any;
  lineSubTotal: any;
  isPacked: boolean;
  product: Product;
}

interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  deliveryAddress: string | null;
}

interface Student {
  firstName: string;
  lastName: string;
  gradeLevel: string;
  school: {
    name: string;
  };
}

interface Delivery {
  id: string;
  orderId: string;
  deliveryMethod: string;
  scheduledDate: string | null;
  actualDate: string | null;
  driverId: string | null;
  proofOfDeliveryUrl: string | null;
}

interface SalesOrder {
  id: string;
  customerId: string;
  studentId: string | null;
  orderDate: string;
  totalAmount: any;
  paymentStatus: string;
  fulfillmentStatus: string;
  notes: string | null;
  customer: Customer;
  student: Student | null;
  orderLines: OrderLine[];
  delivery: Delivery | null;
}

interface PackingQueueClientProps {
  initialOrders: SalesOrder[];
  activeRole: OpsRole;
}

export default function PackingQueueClient({ initialOrders, activeRole }: PackingQueueClientProps) {
  const router = useRouter();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'packing' | 'packed' | 'dispatched'>('pending');
  const [scanValue, setScanValue] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'warning' | 'complete' | null;
    message: string;
  }>({ type: null, message: '' });
  const [showBoxNote, setShowBoxNote] = useState(false);
  const [highlightedLineId, setHighlightedLineId] = useState<string | null>(null);

  const scanInputRef = useRef<HTMLInputElement>(null);

  // Synthesize scan beep sounds using Web Audio API
  const playSound = (type: 'success' | 'error' | 'complete') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'complete') {
        // Play clean C-E-G chord sequence
        const now = ctx.currentTime;
        const playNote = (freq: number, start: number, duration: number) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, now + start);
          g.gain.setValueAtTime(0.08, now + start);
          g.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
          o.start(now + start);
          o.stop(now + start + duration);
        };
        playNote(523.25, 0, 0.12); // C5
        playNote(659.25, 0.12, 0.12); // E5
        playNote(783.99, 0.24, 0.3); // G5
      }
    } catch (e) {
      console.warn('AudioContext not supported or blocked by browser autoplay policy:', e);
    }
  };

  const selectedOrder = initialOrders.find((o) => o.id === selectedOrderId);

  // Group and count orders per tab status
  const pendingOrders = initialOrders.filter((o) => o.fulfillmentStatus === 'pending');
  const packingOrders = initialOrders.filter((o) => o.fulfillmentStatus === 'packing');
  const packedOrders = initialOrders.filter((o) => o.fulfillmentStatus === 'packed');
  const dispatchedOrders = initialOrders.filter(
    (o) => o.fulfillmentStatus === 'dispatched' || o.fulfillmentStatus === 'delivered'
  );

  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'pending':
        return pendingOrders;
      case 'packing':
        return packingOrders;
      case 'packed':
        return packedOrders;
      case 'dispatched':
        return dispatchedOrders;
    }
  };

  // Keep focus on barcode scanner input when packing station is active
  useEffect(() => {
    if (selectedOrderId && scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [selectedOrderId]);

  // Handle barcode submission
  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const sku = scanValue.trim().toUpperCase();
    if (!sku) return;

    setScanValue(''); // Clear field instantly to accept next scans

    // Locate matching line item
    const matchingLine = selectedOrder.orderLines.find(
      (line) => line.product.sku.toUpperCase() === sku
    );

    if (!matchingLine) {
      playSound('error');
      setFeedback({
        type: 'error',
        message: `SKU Mismatch! Barcode "${sku}" does not match any item on this list.`,
      });
      return;
    }

    if (matchingLine.isPacked) {
      playSound('error');
      setFeedback({
        type: 'warning',
        message: `Already Packed: "${matchingLine.product.itemName}" is already ticked off.`,
      });
      return;
    }

    // Success scan
    playSound('success');
    setFeedback({
      type: 'success',
      message: `Success: Scanned and packed "${matchingLine.product.itemName}"!`,
    });
    setHighlightedLineId(matchingLine.id);
    setTimeout(() => setHighlightedLineId(null), 2000);

    // Update database
    await updateOrderLinePacked(matchingLine.id, true);

    // If order was pending, auto transition it to packing
    if (selectedOrder.fulfillmentStatus === 'pending') {
      await updateOrderFulfillmentStatus(selectedOrder.id, 'packing');
    }

    // Check if that was the last item to be packed
    const totalLines = selectedOrder.orderLines.length;
    const packedLinesCount = selectedOrder.orderLines.filter((l) => l.isPacked || l.id === matchingLine.id).length;

    if (packedLinesCount === totalLines) {
      setTimeout(() => {
        playSound('complete');
        setFeedback({
          type: 'complete',
          message: `Order Fully Packed! All ${totalLines} items verified. Ready for checkout box note.`,
        });
      }, 500);
    }
  };

  const handleManualToggle = async (lineId: string, currentStatus: boolean) => {
    if (!selectedOrder) return;
    
    // Play sound based on turning on or off
    if (!currentStatus) {
      playSound('success');
      setFeedback({
        type: 'success',
        message: 'Manual override: Item marked as packed.',
      });
    } else {
      setFeedback({
        type: 'warning',
        message: 'Manual override: Item marked as pending.',
      });
    }
    
    await updateOrderLinePacked(lineId, !currentStatus);

    if (selectedOrder.fulfillmentStatus === 'pending' && !currentStatus) {
      await updateOrderFulfillmentStatus(selectedOrder.id, 'packing');
    }
  };

  const handleStartPacking = async () => {
    if (!selectedOrder) return;
    await updateOrderFulfillmentStatus(selectedOrder.id, 'packing');
    setFeedback({
      type: 'success',
      message: 'Fulfillment status updated to: Packing. Get scanning!',
    });
  };

  const handleDispatchOrder = async () => {
    if (!selectedOrder) return;
    await updateOrderFulfillmentStatus(selectedOrder.id, 'dispatched');
    setSelectedOrderId(null);
    setFeedback({ type: null, message: '' });
  };

  const handleResetPacking = async () => {
    if (!selectedOrder) return;
    if (confirm('Are you sure you want to RESET all packing progress for this order?')) {
      await resetOrderPacking(selectedOrder.id);
      setFeedback({
        type: 'warning',
        message: 'Order packing reset. All items marked as pending.',
      });
    }
  };

  // Helper to count lines packed vs total
  const getPackingProgress = (order: SalesOrder) => {
    const packedCount = order.orderLines.filter((l) => l.isPacked).length;
    const totalCount = order.orderLines.length;
    return { packedCount, totalCount, percentage: (packedCount / totalCount) * 100 };
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-2">
            <ClipboardList className="text-papaya h-7 w-7" />
            Warehouse Packing Queue
          </h1>
          <p className="text-sm text-gray-500">
            Fulfill paid stationery packs. Verify contents using barcode scans.
          </p>
        </div>
      </div>

      {/* Main View Grid */}
      {!selectedOrderId ? (
        // ---------------- QUEUE VIEW ----------------
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-6 overflow-x-auto pb-px" aria-label="Tabs">
              {[
                { id: 'pending', name: 'To Pack', count: pendingOrders.length, color: 'bg-amber-100 text-amber-800' },
                { id: 'packing', name: 'Packing', count: packingOrders.length, color: 'bg-indigo-100 text-indigo-800' },
                { id: 'packed', name: 'Packed & Verified', count: packedOrders.length, color: 'bg-green-100 text-green-800' },
                { id: 'dispatched', name: 'Dispatched', count: dispatchedOrders.length, color: 'bg-gray-100 text-gray-800' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`border-b-2 py-4 px-1 text-sm font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-papaya text-caramel'
                      : 'border-transparent text-gray-500 hover:text-jetblack hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-black ${tab.color}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Queue List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredOrders().length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500 shadow-xs">
                <PackageCheck className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <h3 className="font-bold text-gray-800">Queue is Clear!</h3>
                <p className="text-xs text-gray-400 mt-1">
                  No orders currently waiting in this dispatch stage.
                </p>
              </div>
            ) : (
              getFilteredOrders().map((order) => {
                const { packedCount, totalCount, percentage } = getPackingProgress(order);
                const isFull = packedCount === totalCount;
                
                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:border-papaya/50 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="p-5 space-y-4">
                      {/* Top Meta */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-gray-400 font-bold">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            order.fulfillmentStatus === 'pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : order.fulfillmentStatus === 'packing'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : order.fulfillmentStatus === 'packed'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {order.fulfillmentStatus}
                        </span>
                      </div>

                      {/* Student Info */}
                      <div className="space-y-1">
                        <h3 className="font-black text-sm text-gray-900 leading-tight">
                          {order.student?.firstName} {order.student?.lastName}
                        </h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <School className="h-3.5 w-3.5 text-gray-400" />
                          {order.student?.school.name} • Gr {order.student?.gradeLevel}
                        </p>
                      </div>

                      {/* Delivery Preference */}
                      <div className="text-xs text-gray-500 flex items-center gap-1.5 bg-gray-50 p-2.5 rounded-xl border border-gray-150">
                        <Truck className="h-3.5 w-3.5 text-gray-400" />
                        <span className="font-semibold capitalize">
                          Method: {order.delivery?.deliveryMethod || 'Not specified'}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-black">
                          <span className="text-gray-400 uppercase tracking-wider text-[10px]">Packing Status</span>
                          <span className={isFull ? 'text-green-600' : 'text-gray-900'}>
                            {packedCount}/{totalCount} Items ({Math.round(percentage)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isFull ? 'bg-green-500' : 'bg-papaya'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="bg-gray-50 border-t border-gray-100 p-4">
                      <button
                        onClick={() => {
                          setSelectedOrderId(order.id);
                          setFeedback({ type: null, message: '' });
                          setShowBoxNote(false);
                        }}
                        className="w-full bg-jetblack text-white hover:bg-caramel hover:shadow-xs py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Open Packing Station
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : selectedOrder ? (
        // ---------------- PACKING STATION VIEW ----------------
        <div className="space-y-6">
          {/* Station Subheader */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <button
              onClick={() => setSelectedOrderId(null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-jetblack transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Queue
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleResetPacking}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 bg-white hover:bg-red-50 hover:text-vermillion hover:border-red-200 transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Packing
              </button>

              {getPackingProgress(selectedOrder).packedCount === getPackingProgress(selectedOrder).totalCount && (
                <>
                  <button
                    onClick={() => setShowBoxNote(!showBoxNote)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-papaya/30 text-xs font-black text-caramel bg-papaya/10 hover:bg-papaya/20 transition-all"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    {showBoxNote ? 'Hide Box Note' : 'Print Box Note'}
                  </button>

                  {selectedOrder.fulfillmentStatus === 'packed' && (
                    <button
                      onClick={handleDispatchOrder}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-green-600 text-xs font-black text-white hover:bg-green-700 hover:shadow-sm transition-all"
                    >
                      <PackageCheck className="h-3.5 w-3.5" />
                      Dispatch Pack
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Alert / Feedback Panel */}
          {feedback.message && (
            <div
              className={`p-4 rounded-xl border text-sm flex items-start gap-3 animate-pulse shadow-xs ${
                feedback.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : feedback.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : feedback.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-900'
              }`}
            >
              {feedback.type === 'success' && <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />}
              {feedback.type === 'error' && <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />}
              {feedback.type === 'warning' && <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />}
              {feedback.type === 'complete' && <PackageCheck className="h-5 w-5 shrink-0 text-indigo-600" />}
              <div>
                <p className="font-extrabold">{feedback.type === 'complete' ? 'Fulfillment Complete!' : feedback.type === 'success' ? 'Scan Accepted' : 'Scanning Alert'}</p>
                <p className="text-xs font-semibold mt-0.5">{feedback.message}</p>
              </div>
            </div>
          )}

          {/* Grid Layout: Left Scan Panel / Right Checklist */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Scan Panel (Tablet focus) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Order & Student Details */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Fulfillment Details</span>
                  <span className="font-mono text-xs font-extrabold text-gray-500">
                    #{selectedOrder.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-papaya/10 text-caramel rounded-xl">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Student Name</p>
                      <p className="font-extrabold text-sm text-gray-900 leading-tight">
                        {selectedOrder.student?.firstName} {selectedOrder.student?.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                      <School className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">School / Grade</p>
                      <p className="font-extrabold text-sm text-gray-900 leading-tight">
                        {selectedOrder.student?.school.name} (Grade {selectedOrder.student?.gradeLevel})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gray-100 text-gray-600 rounded-xl">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Delivery Instructions</p>
                      <p className="font-semibold text-xs text-gray-600 max-w-xs truncate leading-tight">
                        {formatAddressForRole(selectedOrder.customer.deliveryAddress, activeRole)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Mini Bar */}
                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between items-center text-xs font-black text-gray-900">
                    <span>Packing Progress</span>
                    <span>
                      {getPackingProgress(selectedOrder).packedCount}/{getPackingProgress(selectedOrder).totalCount} Packed
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full bg-papaya transition-all duration-300"
                      style={{ width: `${getPackingProgress(selectedOrder).percentage}%` }}
                    />
                  </div>
                </div>

                {selectedOrder.fulfillmentStatus === 'pending' && (
                  <button
                    onClick={handleStartPacking}
                    className="w-full py-2.5 bg-indigo-600 text-white font-black text-xs rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-1.5"
                  >
                    Start Packing Process
                  </button>
                )}
              </div>

              {/* Barcode Scanner Focus Area */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                  <Barcode className="text-papaya h-5 w-5" />
                  Barcode Scanner Receiver
                </h3>

                <p className="text-[11px] text-gray-500">
                  Focus this input and scan the item barcode using a handheld scanner, or type the SKU and press Enter.
                </p>

                <form onSubmit={handleScanSubmit} className="space-y-3">
                  <div className="relative">
                    <input
                      ref={scanInputRef}
                      type="text"
                      value={scanValue}
                      onChange={(e) => setScanValue(e.target.value)}
                      placeholder="Scan SKU code..."
                      className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-3 py-3 text-center text-sm font-black tracking-widest text-gray-900 focus:border-papaya focus:bg-white focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-jetblack text-white hover:bg-caramel text-xs font-black rounded-xl transition-all"
                  >
                    Scan SKU
                  </button>
                </form>
              </div>

              {/* Scan Simulator / Quick Dev Scan Panel */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
                <h4 className="font-black text-xs uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  Scan Simulator
                </h4>
                <p className="text-[10px] text-gray-400 leading-normal">
                  No handheld scanner connected? Click any button below to simulate scanning that product SKU code.
                </p>

                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedOrder.orderLines.map((line) => (
                    <button
                      key={line.id}
                      disabled={line.isPacked}
                      onClick={() => {
                        setScanValue(line.product.sku);
                        // Brief timeout to simulate input focus and scanner speed
                        setTimeout(() => {
                          if (scanInputRef.current) scanInputRef.current.focus();
                        }, 50);
                      }}
                      className={`text-left px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-between ${
                        line.isPacked
                          ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-papaya/5 border-papaya/20 text-caramel hover:bg-papaya/10 hover:border-papaya/40'
                      }`}
                    >
                      <span className="truncate max-w-[160px]">{line.product.itemName}</span>
                      <span className="font-mono bg-white px-1.5 py-0.5 rounded text-[10px] border border-gray-200">
                        {line.product.sku}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Checklist Table */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="border-b border-gray-150 px-6 py-4 bg-gray-50/50">
                <h3 className="font-black text-sm text-gray-900">Packing List Checklist</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-150 text-xs font-black uppercase text-gray-400 tracking-wider">
                      <th className="px-6 py-4">Item & SKU</th>
                      <th className="px-6 py-4">Brand</th>
                      <th className="px-6 py-4 text-center">Qty Required</th>
                      <th className="px-6 py-4 text-center">Packed Status</th>
                      <th className="px-6 py-4 text-right">Manual Override</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedOrder.orderLines.map((line) => {
                      const isHighlighted = highlightedLineId === line.id;
                      return (
                        <tr
                          key={line.id}
                          className={`transition-all duration-300 ${
                            line.isPacked
                              ? 'bg-green-50/20 text-gray-400 line-through'
                              : isHighlighted
                              ? 'bg-papaya/10 text-jetblack font-bold animate-pulse'
                              : 'hover:bg-gray-50/40'
                          }`}
                        >
                          <td className="px-6 py-4 text-xs font-medium">
                            <p className={`font-bold ${line.isPacked ? 'text-gray-400' : 'text-gray-900'}`}>
                              {line.product.itemName}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                              SKU: {line.product.sku}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                            {line.product.brand || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-xs">
                            {line.quantityOrdered}
                          </td>
                          <td className="px-6 py-4 text-center text-xs">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                                line.isPacked
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {line.isPacked ? 'Packed' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleManualToggle(line.id, line.isPacked)}
                              className={`text-xs px-2.5 py-1.5 rounded-lg font-bold border transition-colors ${
                                line.isPacked
                                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200'
                                  : 'bg-papaya hover:bg-caramel text-jetblack hover:text-white border-transparent'
                              }`}
                            >
                              {line.isPacked ? 'Unpack' : 'Pack Item'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Printable Box Note Preview Overlay Modal */}
          {showBoxNote && (
            <div className="bg-white rounded-2xl border-2 border-papaya p-6 shadow-md max-w-2xl mx-auto space-y-6 print:m-0 print:border-none print:shadow-none">
              
              {/* Box Note Card Printable Styling */}
              <div className="border-4 border-double border-caramel p-6 text-center space-y-6 relative overflow-hidden bg-amber-50/10 rounded-xl">
                
                {/* Brand Logo Header */}
                <div className="flex flex-col items-center gap-1">
                  <h2 className="text-xl font-black tracking-tight text-jetblack uppercase">
                    Prepped 4 Prep
                  </h2>
                  <p className="text-[10px] font-black text-caramel uppercase tracking-widest leading-none">
                    Avoid the fuss, trust us!
                  </p>
                </div>

                <div className="border-t border-b border-dashed border-gray-300 py-4 space-y-2">
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-black">Stationery Package For</p>
                  <h1 className="text-2xl font-black text-gray-900">
                    {selectedOrder.student?.firstName} {selectedOrder.student?.lastName}
                  </h1>
                  <p className="text-sm font-bold text-gray-600">
                    School: {selectedOrder.student?.school.name}
                  </p>
                  <p className="text-xs font-semibold text-gray-500">
                    Grade Level: {selectedOrder.student?.gradeLevel}
                  </p>
                </div>

                {/* Checklist Summary (Warehouse packing confirmation note) */}
                <div className="space-y-2 text-left max-w-md mx-auto">
                  <h4 className="text-xs font-black uppercase tracking-wider text-caramel">Contents Verified</h4>
                  <ul className="text-[11px] text-gray-600 divide-y divide-gray-100">
                    {selectedOrder.orderLines.map((line) => (
                      <li key={line.id} className="py-1 flex justify-between">
                        <span>{line.product.itemName}</span>
                        <span className="font-bold">Qty: {line.quantityOrdered}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Personal Reassurance Quote */}
                <div className="pt-2">
                  <p className="text-xs font-bold italic text-caramel">
                    "Packed with love and care by the Prepped 4 Prep Team. Good luck for the academic year!"
                  </p>
                </div>

                {/* Bottom Signature Line */}
                <div className="flex justify-between items-end text-[10px] text-gray-400 pt-6">
                  <span>Date: {new Date().toLocaleDateString()}</span>
                  <div className="text-right">
                    <p className="border-b border-gray-300 w-24 ml-auto h-5"></p>
                    <p className="mt-1 font-semibold uppercase tracking-wider">Checked By (Staff Signature)</p>
                  </div>
                </div>
              </div>

              {/* Utility buttons */}
              <div className="flex justify-end gap-3 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-jetblack text-white hover:bg-caramel text-xs font-black rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  Print Now
                </button>
                <button
                  onClick={() => setShowBoxNote(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-600 rounded-xl transition-all"
                >
                  Close Preview
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
