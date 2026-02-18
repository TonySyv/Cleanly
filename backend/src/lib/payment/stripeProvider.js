/**
 * Stripe payment provider. Uses STRIPE_SECRET_KEY.
 * Set PAYMENT_PROVIDER=stripe and Stripe env vars. See .env.example.
 */
let stripeInstance = null;

async function getStripe() {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is required when PAYMENT_PROVIDER=stripe');
    const Stripe = (await import('stripe')).default;
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
}

/**
 * @param {number} amountCents
 * @param {string} currency
 * @param {Record<string, string>} metadata
 * @returns {Promise<{ paymentIntentId: string, clientSecret: string | null }>}
 */
export async function createPaymentIntent(amountCents, currency, metadata) {
  const stripe = await getStripe();
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: currency || 'usd',
    automatic_payment_methods: { enabled: true },
    metadata: metadata || {},
  });
  return {
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret ?? null,
  };
}

/**
 * @param {import('@prisma/client').Booking} booking
 * @returns {Promise<boolean>}
 */
export async function isPaymentSucceeded(booking) {
  const id = booking?.stripePaymentIntentId;
  if (!id || id.startsWith('dummy_')) return false;
  const stripe = await getStripe();
  const pi = await stripe.paymentIntents.retrieve(id);
  return pi.status === 'succeeded';
}

const stripeProvider = { createPaymentIntent, isPaymentSucceeded };
export default stripeProvider;
