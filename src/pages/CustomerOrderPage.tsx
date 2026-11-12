import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
}

interface Booking {
  id: number;
  status: string;
  guestCount: number;
  date: string;
  table: {
    tableNumber: number;
    branch: { id: number; name: string };
  };
}

export default function CustomerOrderPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = parseInt(searchParams.get('bookingId') ?? '0', 10);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'IN_STORE' | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'CUSTOMER') {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!bookingId) {
      setError('Booking ID is required to place an order.');
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const bookingRes = await api.get(`/customer/bookings/${bookingId}`);
        setBooking(bookingRes.data);
        const branchId = bookingRes.data.table.branch.id;
        const menuRes = await api.get(`/menu/${branchId}`);
        setMenu(menuRes.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load order page.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bookingId]);

  const updateQuantity = (menuItemId: number, delta: number) => {
    setCart(prev => {
      const current = prev[menuItemId] ?? 0;
      const next = Math.max(0, current + delta);
      const nextCart = { ...prev };
      if (next === 0) {
        delete nextCart[menuItemId];
      } else {
        nextCart[menuItemId] = next;
      }
      return nextCart;
    });
  };

  const handleSubmit = async () => {
    if (!booking || !paymentMethod) return;
    setError('');
    if (Object.keys(cart).length === 0) {
      setError('Add at least one menu item to the cart.');
      return;
    }
    const items = Object.entries(cart).map(([menuItemId, quantity]) => ({
      menuItemId: Number(menuItemId),
      quantity,
    }));

    try {
      setIsSubmitting(true);
      const response = await api.post('/customer/orders', {
        bookingId: booking.id,
        items,
        paymentMethod,
        paymentStatus: paymentMethod === 'IN_STORE' ? 'PAID_IN_STORE' : 'PENDING',
      });

      if (paymentMethod === 'CARD') {
        setPendingOrderId(response.data.id);
        setShowCardModal(true);
      } else {
        navigate('/customer');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCardPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pendingOrderId === null) return;

    setError('');
    setIsSubmitting(true);
    try {
      await api.post(`/customer/orders/${pendingOrderId}/pay`, {
        paymentMethod: 'CARD',
        paymentStatus: 'PAID',
      });
      navigate('/customer');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process the mock payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cartItems = menu.filter(item => cart[item.id] > 0).map(item => ({
    item,
    quantity: cart[item.id],
  }));
  const total = cartItems.reduce((sum, cartItem) => sum + cartItem.item.price * cartItem.quantity, 0);

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">Loading order page...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Place Your Order</h1>
        <p className="page-description">Select items from the menu for your confirmed booking.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {booking ? (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <span className="card-title">Booking #{booking.id}</span>
              <span className={`badge badge-${booking.status.toLowerCase()}`}>{booking.status}</span>
            </div>
            <p>Location: {booking.table.branch.name}</p>
            <p>Table {booking.table.tableNumber}</p>
            <p>{booking.guestCount} guests</p>
            <p>{new Date(booking.date).toLocaleString()}</p>
          </div>

          {booking.status !== 'CONFIRMED' ? (
            <div className="empty-state">
              Orders can only be placed once the booking is confirmed. Please check your dashboard for status updates.
            </div>
          ) : (
            <div className="order-grid">
              <div className="menu-list">
                <h2>Menu Items</h2>
                {menu.length === 0 ? (
                  <div className="empty-state">No menu items available for this branch.</div>
                ) : (
                  menu.map(item => (
                    <div className="card menu-card" key={item.id}>
                      <div className="card-header">
                        <span className="card-title">{item.name}</span>
                        <span>${item.price.toFixed(2)}</span>
                      </div>
                      {item.description && <p>{item.description}</p>}
                      <div className="menu-actions">
                        <button className="btn btn-secondary btn-sm" type="button" onClick={() => updateQuantity(item.id, -1)}>
                          -
                        </button>
                        <span className="menu-qty">{cart[item.id] ?? 0}</span>
                        <button className="btn btn-primary btn-sm" type="button" onClick={() => updateQuantity(item.id, 1)}>
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="cart-summary card">
                <h2>Order Cart</h2>
                {cartItems.length === 0 ? (
                  <div className="empty-state">Add items to your cart to submit an order.</div>
                ) : (
                  <div>
                    {cartItems.map(({ item, quantity }) => (
                      <div key={item.id} className="cart-item">
                        <div>{item.name} ×{quantity}</div>
                        <div>${(item.price * quantity).toFixed(2)}</div>
                      </div>
                    ))}
                    <div className="cart-total">
                      <strong>Total</strong>
                      <strong>${total.toFixed(2)}</strong>
                    </div>
                  </div>
                )}
                <div className="payment-options">
                  <label className="payment-option">
                    <input
                      type="checkbox"
                      checked={paymentMethod === 'CARD'}
                      onChange={() => setPaymentMethod(current => current === 'CARD' ? null : 'CARD')}
                    />
                    <span>Pay Online (Card)</span>
                  </label>
                  <label className="payment-option">
                    <input
                      type="checkbox"
                      checked={paymentMethod === 'IN_STORE'}
                      onChange={() => setPaymentMethod(current => current === 'IN_STORE' ? null : 'IN_STORE')}
                    />
                    <span>Pay in Store</span>
                  </label>
                </div>
                <button
                  className="btn btn-primary"
                  disabled={cartItems.length === 0 || booking.status !== 'CONFIRMED' || paymentMethod === null || isSubmitting}
                  onClick={handleSubmit}
                  style={{ width: '100%', marginTop: '1rem' }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Order'}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">Booking not found.</div>
      )}
      {showCardModal && (
        <div className="payment-modal-backdrop">
          <section className="payment-modal" role="dialog" aria-modal="true" aria-labelledby="card-payment-title">
            <h2 id="card-payment-title">Card Details</h2>
            <p className="page-description">Enter mock card details to complete your payment.</p>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCardPayment}>
              <div className="form-group">
                <label className="form-label" htmlFor="card-number">Card Number</label>
                <input
                  className="form-input"
                  id="card-number"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  required
                  value={cardNumber}
                  onChange={event => setCardNumber(event.target.value)}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="card-expiry">Expiry</label>
                  <input
                    className="form-input"
                    id="card-expiry"
                    type="text"
                    placeholder="MM/YY"
                    autoComplete="cc-exp"
                    required
                    value={expiry}
                    onChange={event => setExpiry(event.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="card-cvv">CVV</label>
                  <input
                    className="form-input"
                    id="card-cvv"
                    type="password"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    required
                    value={cvv}
                    onChange={event => setCvv(event.target.value)}
                  />
                </div>
              </div>
              <button className="btn btn-primary" type="submit" disabled={isSubmitting} style={{ width: '100%' }}>
                {isSubmitting ? 'Processing...' : 'Pay Now'}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
