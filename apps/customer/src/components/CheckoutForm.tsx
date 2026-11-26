'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createCheckoutOrder } from '@/app/checkout/checkout-actions';
import { ShieldAlert, CreditCard, ClipboardCheck, Heart } from 'lucide-react';

interface CheckoutFormProps {
  prefilledCustomer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    deliveryAddress: string | null;
  };
}

export default function CheckoutForm({ prefilledCustomer }: CheckoutFormProps) {
  const router = useRouter();
  const [cart, setCart] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Load cart from session storage on mount
  useEffect(() => {
    const savedCart = sessionStorage.getItem('p4p_cart');
    if (!savedCart) {
      router.push('/');
      return;
    }
    setCart(JSON.parse(savedCart));
  }, [router]);

  if (!cart) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 font-medium animate-pulse">Loading checkout details...</p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!consentChecked) {
      setError('You must accept the POPIA privacy notice and consent terms to checkout.');
      return;
    }

    setError(null);
    const formData = new FormData(e.currentTarget);

    const customerData = {
      firstName: formData.get('customerFirstName') as string,
      lastName: formData.get('customerLastName') as string,
      phone: formData.get('customerPhone') as string,
      deliveryAddress: formData.get('deliveryAddress') as string,
      deliveryMethod: formData.get('deliveryMethod') as string,
    };

    const studentData = {
      firstName: formData.get('studentFirstName') as string,
      lastName: formData.get('studentLastName') as string,
    };

    startTransition(async () => {
      try {
        const result = await createCheckoutOrder(cart, customerData, studentData, consentChecked);
        if (result && result.orderId) {
          sessionStorage.removeItem('p4p_cart');
          router.push(`/checkout/payfast?orderId=${result.orderId}`);
        }
      } catch (err: any) {
        console.error(err);
        setError(err?.message || 'Failed to place order. Please try again.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Checkout Forms (Customer & Student details) */}
      <div className="lg:col-span-8 space-y-6">
        {error && (
          <div className="rounded-xl bg-vermillion/10 border border-vermillion/20 p-4 text-sm font-bold text-vermillion">
            {error}
          </div>
        )}

        {/* Customer / Parent Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-jetblack text-lg border-b border-gray-100 pb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-papaya/20 text-caramel text-xs font-black">
              1
            </span>
            Parent Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="customerFirstName" className="block text-sm font-semibold text-gray-600">
                First Name
              </label>
              <input
                type="text"
                id="customerFirstName"
                name="customerFirstName"
                defaultValue={prefilledCustomer.firstName}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="customerLastName" className="block text-sm font-semibold text-gray-600">
                Last Name
              </label>
              <input
                type="text"
                id="customerLastName"
                name="customerLastName"
                defaultValue={prefilledCustomer.lastName}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="customerEmail" className="block text-sm font-semibold text-gray-600">
                Email Address
              </label>
              <input
                type="email"
                id="customerEmail"
                name="customerEmail"
                value={prefilledCustomer.email}
                disabled
                className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="customerPhone" className="block text-sm font-semibold text-gray-600">
                Contact Phone
              </label>
              <input
                type="tel"
                id="customerPhone"
                name="customerPhone"
                defaultValue={prefilledCustomer.phone || ''}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Student details */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-jetblack text-lg border-b border-gray-100 pb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-papaya/20 text-caramel text-xs font-black">
              2
            </span>
            Student Details
          </h3>
          <p className="text-xs text-gray-400">
            Provide your child's name. This maps their stationery template and enables printing personalized labels.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="studentFirstName" className="block text-sm font-semibold text-gray-600">
                Student First Name
              </label>
              <input
                type="text"
                id="studentFirstName"
                name="studentFirstName"
                required
                placeholder="e.g. Jane"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="studentLastName" className="block text-sm font-semibold text-gray-600">
                Student Last Name
              </label>
              <input
                type="text"
                id="studentLastName"
                name="studentLastName"
                required
                placeholder="e.g. Miller"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 border border-gray-150 rounded-xl p-4">
            <div>
              <span className="text-xs text-gray-400 block">School</span>
              <span className="font-bold text-jetblack">{cart.schoolName}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Grade / Year</span>
              <span className="font-bold text-jetblack">
                {cart.gradeLevel} ({cart.academicYear})
              </span>
            </div>
          </div>
        </div>

        {/* Delivery options */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-jetblack text-lg border-b border-gray-100 pb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-papaya/20 text-caramel text-xs font-black">
              3
            </span>
            Delivery & Fulfillment
          </h3>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-600">
                Fulfillment Method
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="border rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="delivery"
                    defaultChecked
                    className="text-papaya focus:ring-papaya"
                  />
                  <div>
                    <span className="block font-bold text-xs">Home Delivery</span>
                    <span className="text-[10px] text-gray-400">Door-to-door courier</span>
                  </div>
                </label>
                <label className="border rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="collection"
                    className="text-papaya focus:ring-papaya"
                  />
                  <div>
                    <span className="block font-bold text-xs">Collection</span>
                    <span className="text-[10px] text-gray-400">Collect from P4P office</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="deliveryAddress" className="block text-sm font-semibold text-gray-600">
                Delivery Address (Durban regions only)
              </label>
              <textarea
                id="deliveryAddress"
                name="deliveryAddress"
                required
                rows={3}
                defaultValue={prefilledCustomer.deliveryAddress || ''}
                placeholder="Street address, suburb, Durban postal code"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* POPIA and Consent */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-jetblack text-lg border-b border-gray-100 pb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-papaya/20 text-caramel text-xs font-black">
              4
            </span>
            Consent & POPIA Compliance
          </h3>
          
          <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-4 flex gap-3 items-start">
            <ShieldAlert className="text-caramel h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-xs text-gray-600 space-y-2">
              <p className="font-bold text-jetblack">POPIA Consent Notice</p>
              <p>
                We collect your name, email, phone, and delivery address along with your child's name and grade. This data is processed securely and exclusively to generate customized stationery name-tags, wrap school books, and deliver your order.
              </p>
              <p>
                We do not store your credit card information directly and never share children&apos;s details with external parties. Read our full{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-bold text-caramel underline hover:text-jetblack">
                  POPIA Privacy Notice
                </a>
                .
              </p>
            </div>
          </div>

          <label className="flex items-start gap-3 select-none cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-papaya focus:ring-papaya"
            />
            <span className="text-xs text-gray-500 font-semibold leading-relaxed">
              I consent to the collection, processing, and timestamped registration of my parent details and student details for stationery preparation, labeling, and courier delivery in accordance with the POPIA Privacy Notice.
            </span>
          </label>
        </div>
      </div>

      {/* Cart Summary Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 space-y-6">
          <h3 className="font-black text-lg text-jetblack border-b border-gray-100 pb-3">
            Order Items
          </h3>

          <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 pr-2">
            {cart.items.map((item: any) => (
              <div key={item.productId} className="py-3 flex justify-between text-xs gap-3">
                <div>
                  <p className="font-bold text-jetblack">{item.name}</p>
                  <p className="text-gray-400 mt-0.5">
                    Qty: {item.quantity} × R {item.price.toFixed(2)}
                  </p>
                </div>
                <span className="font-bold shrink-0">R {item.subtotal.toFixed(2)}</span>
              </div>
            ))}

            {cart.services.map((item: any) => (
              <div key={item.productId} className="py-3 flex justify-between text-xs text-caramel gap-3">
                <div>
                  <p className="font-bold">{item.name}</p>
                  <p className="opacity-80 mt-0.5">
                    Qty: {item.quantity} × R {item.price.toFixed(2)}
                  </p>
                </div>
                <span className="font-bold shrink-0">R {item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-500 text-xs">
              <span>Stationery Subtotal</span>
              <span>R {cart.stationerySubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 text-xs">
              <span>Services Subtotal</span>
              <span>R {cart.servicesSubtotal.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between items-end">
              <span className="font-bold text-gray-800">Total Price</span>
              <span className="font-black text-2xl text-caramel">R {cart.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Place Order Button */}
          <button
            type="submit"
            disabled={isPending || !consentChecked}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-jetblack py-4 font-extrabold text-white transition-all hover:bg-caramel hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-jetblack"
          >
            <ClipboardCheck className="h-4 w-4" />
            <span>{isPending ? 'Placing Order...' : 'Place Order'}</span>
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
            <Heart className="h-3 w-3 fill-amber-500 text-amber-500" />
            <span>Your order is prepped with care in Durban</span>
          </div>
        </div>
      </div>
    </form>
  );
}
