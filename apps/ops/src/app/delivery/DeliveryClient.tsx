'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Truck,
  MapPin,
  Phone,
  User,
  School,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Trash2,
  Map,
  Compass,
  History,
  FileCheck,
  Search,
} from 'lucide-react';
import { confirmDelivery } from '../crud-actions';
import { OpsRole } from '@/lib/rbac';

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
  delivery: Delivery | null;
}

interface DeliveryClientProps {
  initialOrders: SalesOrder[];
  activeRole: OpsRole;
}

export default function DeliveryClient({ initialOrders, activeRole }: DeliveryClientProps) {
  const router = useRouter();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Signature States
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureCaptured, setSignatureCaptured] = useState(false);
  
  // Geolocation States
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [gpsCaptured, setGpsCaptured] = useState(false);

  // General Transaction States
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  const selectedOrder = initialOrders.find((o) => o.id === selectedOrderId);

  // Group active deliveries vs completed delivered orders
  const activeDeliveries = initialOrders.filter(
    (o) => (o.fulfillmentStatus === 'packed' || o.fulfillmentStatus === 'dispatched') && o.delivery?.deliveryMethod === 'delivery'
  );
  
  const completedDeliveries = initialOrders.filter(
    (o) => o.fulfillmentStatus === 'delivered' && o.delivery?.deliveryMethod === 'delivery'
  );

  const getFilteredOrders = () => {
    const orders = activeTab === 'pending' ? activeDeliveries : completedDeliveries;
    if (!searchQuery.trim()) return orders;
    
    const query = searchQuery.trim().toLowerCase();
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(query) ||
        o.student?.firstName.toLowerCase().includes(query) ||
        o.student?.lastName.toLowerCase().includes(query) ||
        o.customer.firstName.toLowerCase().includes(query) ||
        o.customer.lastName.toLowerCase().includes(query)
    );
  };

  // Start Canvas drawing (handles both touch and mouse coords)
  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setSignatureCaptured(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureCaptured(false);
  };

  // Capture GPS Location
  const captureLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('GPS Location services not supported by your mobile device.');
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setGeoLoading(false);
        setGpsCaptured(true);
        setFeedback({
          type: 'success',
          message: 'GPS Coordinates locked successfully.',
        });
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setGeoError(error.message || 'Failed to capture GPS details. Please allow location access.');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    );
  };

  // Submit delivery proof
  const handleSubmitDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const canvas = canvasRef.current;
    if (!canvas || !signatureCaptured) {
      setFeedback({
        type: 'error',
        message: 'Missing Signature: Please capture customer signature as proof of delivery.',
      });
      return;
    }

    // Convert signature drawing to base64 Data URL string
    const signatureUrl = canvas.toDataURL('image/png');

    setSubmitting(true);
    setFeedback({ type: null, message: '' });

    try {
      await confirmDelivery(selectedOrder.id, signatureUrl, latitude, longitude);
      
      // Reset state and return to queue
      setSignatureCaptured(false);
      setGpsCaptured(false);
      setLatitude(null);
      setLongitude(null);
      setSelectedOrderId(null);
      setFeedback({
        type: 'success',
        message: 'Delivery confirmed! Delivered email notification fired to parent.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Failed to confirm delivery: ${err.message || err}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Adjust signature canvas dimensions when rendering
  useEffect(() => {
    if (selectedOrderId && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.parentElement?.clientWidth || 340;
      canvas.height = 160;
    }
  }, [selectedOrderId]);

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Truck className="text-papaya h-7 w-7" />
            Driver Delivery View
          </h1>
          <p className="text-xs text-gray-500">
            Mobile dispatcher cockpit. Log signatures, timestamp, and GPS.
          </p>
        </div>
      </div>

      {feedback.message && (
        <div
          className={`p-4 rounded-xl border text-xs font-bold flex items-start gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {!selectedOrderId ? (
        // ---------------- QUEUE VIEW ----------------
        <div className="space-y-4">
          {/* Dispatch Navigation Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-black">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'bg-white shadow-xs text-jetblack'
                  : 'text-gray-500 hover:text-jetblack'
              }`}
            >
              <Compass className="h-4 w-4" />
              Active Route ({activeDeliveries.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'completed'
                  ? 'bg-white shadow-xs text-jetblack'
                  : 'text-gray-500 hover:text-jetblack'
              }`}
            >
              <History className="h-4 w-4" />
              Delivered ({completedDeliveries.length})
            </button>
          </div>

          {/* Quick Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student or parent name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold focus:border-papaya focus:outline-none focus:bg-white"
            />
          </div>

          {/* Deliveries List */}
          <div className="space-y-3">
            {getFilteredOrders().length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400">
                <FileCheck className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-bold">No active delivery assignments found.</p>
              </div>
            ) : (
              getFilteredOrders().map((order) => (
                <div
                  key={order.id}
                  onClick={() => {
                    setSelectedOrderId(order.id);
                    setFeedback({ type: null, message: '' });
                  }}
                  className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs hover:border-papaya transition-all cursor-pointer space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[10px] text-gray-400 font-bold uppercase">
                      Ref: #{order.id.slice(0, 8)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        order.fulfillmentStatus === 'delivered'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : order.fulfillmentStatus === 'dispatched'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {order.fulfillmentStatus}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-black text-sm text-gray-900">
                      {order.student?.firstName} {order.student?.lastName}
                    </h3>
                    <p className="text-xs font-bold text-gray-500 flex items-center gap-1">
                      <School className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      {order.student?.school.name} (Gr {order.student?.gradeLevel})
                    </p>
                    <p className="text-xs text-gray-400 flex items-start gap-1">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{order.customer.deliveryAddress || 'No Address'}</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : selectedOrder ? (
        // ---------------- PROOF OF DELIVERY CONFIRMATION VIEW ----------------
        <div className="space-y-5">
          {/* Subheader Back action */}
          <button
            onClick={() => setSelectedOrderId(null)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-jetblack transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Deliveries
          </button>

          {/* Delivery Target Details Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Recipient Address Card</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-papaya/10 text-caramel rounded-xl mt-0.5">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Parent / Contact</p>
                  <p className="font-black text-sm text-gray-900 leading-tight">
                    {selectedOrder.customer.firstName} {selectedOrder.customer.lastName}
                  </p>
                  {selectedOrder.customer.phone && (
                    <a
                      href={`tel:${selectedOrder.customer.phone}`}
                      className="text-xs font-bold text-blue-600 flex items-center gap-1 mt-1 hover:underline"
                    >
                      <Phone className="h-3 w-3" />
                      {selectedOrder.customer.phone}
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl mt-0.5">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Delivery Destination</p>
                  <p className="font-bold text-xs text-gray-700 mt-0.5 leading-relaxed">
                    {selectedOrder.customer.deliveryAddress || 'No Address Specified'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl mt-0.5">
                  <School className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Student Pack Details</p>
                  <p className="font-bold text-xs text-gray-700 leading-tight">
                    {selectedOrder.student?.firstName} {selectedOrder.student?.lastName}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {selectedOrder.student?.school.name} (Grade {selectedOrder.student?.gradeLevel})
                  </p>
                </div>
              </div>
            </div>
          </div>

          {selectedOrder.fulfillmentStatus !== 'delivered' ? (
            // Form to Submit Proof
            <form onSubmit={handleSubmitDelivery} className="space-y-5">
              {/* Geolocation Coordinate Capture */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
                <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                  <Compass className="text-papaya h-5 w-5" />
                  GPS Location Log
                </h4>
                <p className="text-[11px] text-gray-500 leading-normal">
                  Log the location coordinates of the final dropoff step. Location access permissions are required.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={captureLocation}
                    disabled={geoLoading}
                    className="px-4 py-2 bg-jetblack text-white hover:bg-caramel disabled:bg-gray-300 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Map className="h-3.5 w-3.5" />
                    {geoLoading ? 'Locking GPS...' : 'Capture Coordinates'}
                  </button>

                  <div className="text-left">
                    {gpsCaptured ? (
                      <div className="text-[11px] text-green-700 font-bold">
                        Captured: {latitude?.toFixed(5)}, {longitude?.toFixed(5)}
                      </div>
                    ) : geoError ? (
                      <div className="text-[10px] text-vermillion font-bold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        {geoError}
                      </div>
                    ) : (
                      <div className="text-[10px] text-gray-400">GPS not logged yet</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Draw Signature Canvas */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-sm text-gray-900">Proof of Delivery Signature</h4>
                  {signatureCaptured && (
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-vermillion hover:text-red-700 text-xs flex items-center gap-1 font-bold"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 leading-normal">
                  Have the customer sign with their finger or stylus on the canvas drawing pad below:
                </p>

                {/* Draw Canvas Element */}
                <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-gray-50/50 relative">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full block bg-white cursor-crosshair touch-none"
                  />
                  {!signatureCaptured && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-gray-300 font-semibold select-none">
                      Sign Here...
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Dispatch Action */}
              <button
                type="submit"
                disabled={submitting || !signatureCaptured}
                className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-black text-sm rounded-xl transition-all disabled:bg-gray-200 disabled:text-gray-400 shadow-sm flex items-center justify-center gap-2"
              >
                {submitting ? 'Confirming Delivery...' : 'Confirm Dropoff Delivery'}
              </button>
            </form>
          ) : (
            // Completed Details Preview
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-green-700 font-extrabold text-sm">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Delivery Completed</span>
              </div>
              
              {selectedOrder.delivery?.proofOfDeliveryUrl && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Proof of Delivery Signature:</p>
                  <div className="border border-gray-200 rounded-xl bg-gray-50 p-2 max-w-xs overflow-hidden">
                    {/* Render Base64 drawing signature */}
                    <img
                      src={selectedOrder.delivery.proofOfDeliveryUrl}
                      alt="Signature Proof"
                      className="max-h-24 object-contain mx-auto"
                    />
                  </div>
                </div>
              )}

              {selectedOrder.notes && (
                <div className="pt-2 border-t border-gray-100 text-xs text-gray-500 font-medium space-y-1">
                  <p className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Logistics Audit Log:</p>
                  <p className="whitespace-pre-line leading-relaxed">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
