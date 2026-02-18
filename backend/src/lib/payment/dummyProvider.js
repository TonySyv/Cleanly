/**
 * Dummy payment provider for development and testing.
 * Always succeeds: createPaymentIntent returns a dummy id, isPaymentSucceeded returns true.
 * No Stripe keys required. Set PAYMENT_PROVIDER=dummy (default).
 */
import { randomUUID } from 'crypto';

/**
 * @param {number} amountCents
 * @param {string} _currency
 * @param {Record<string, string>} _metadata
 * @returns {Promise<{ paymentIntentId: string, clientSecret: null }>}
 */
export async function createPaymentIntent(amountCents, _currency, _metadata) {
  const paymentIntentId = `dummy_${randomUUID()}`;
  return { paymentIntentId, clientSecret: null };
}

/**
 * For dummy provider, payment is always considered succeeded (e.g. after user taps "Confirm booking").
 * @param {import('@prisma/client').Booking} booking
 * @returns {boolean}
 */
export function isPaymentSucceeded(booking) {
  const id = booking?.stripePaymentIntentId ?? null;
  if (!id) return true; // no intent = dummy flow, confirm-payment will mark success
  return id.startsWith('dummy_');
}

const dummyProvider = { createPaymentIntent, isPaymentSucceeded };
export default dummyProvider;
