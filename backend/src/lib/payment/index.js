/**
 * Payment provider abstraction. Implementations: dummy (default), stripe.
 * Env: PAYMENT_PROVIDER=dummy|stripe
 * See BOOKING_PLATFORM_PLAN.md § 0 (payment strategy).
 */
import dummyProvider from './dummyProvider.js';

const PROVIDER = (process.env.PAYMENT_PROVIDER || 'dummy').toLowerCase();

async function getPaymentProvider() {
  if (PROVIDER === 'stripe') {
    const m = await import('./stripeProvider.js');
    return m.default;
  }
  return dummyProvider;
}

export { getPaymentProvider };
export default getPaymentProvider;
