import { Router } from 'express';
import { prisma } from '../../lib/db.js';

const router = Router();

/**
 * POST /api/v1/webhooks/stripe
 * Stripe sends raw JSON; must use express.raw() for this route (mounted in index before express.json()).
 * Verify with STRIPE_WEBHOOK_SECRET. When PAYMENT_PROVIDER=dummy, no-op (no Stripe events for dummy intents).
 */
router.post('/', async (req, res) => {
  const provider = (process.env.PAYMENT_PROVIDER || 'dummy').toLowerCase();
  if (provider !== 'stripe') {
    return res.json({ received: true });
  }
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET not set, skipping verification');
  } else if (sig && req.body) {
    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      console.log(`Stripe webhook event type=${event.type} id=${event.id}`);
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const piId = paymentIntent.id;
        const booking = await prisma.booking.findFirst({
          where: { stripePaymentIntentId: piId },
        });
        if (booking && booking.status === 'PENDING') {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { status: 'CONFIRMED' },
          });
        }
      }
    } catch (err) {
      console.error('Stripe webhook error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
  res.json({ received: true });
});

export default router;
