import express from 'express';
import Stripe from 'stripe';
import User from '../models/User.js';
import {authMiddleware} from './auth.js'

const stripe= new Stripe(process.env.STRIPE_SECRET_KEY)
const router = express.Router();

// Create a subscription
router.post('/create-subscription', authMiddleware, async (req, res) => {
  try {
    const { priceId, paymentMethodId } = req.body;
    const user = await User.findById(req.user.id);

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        payment_method: paymentMethodId,
        invoice_settings: { default_payment_method: paymentMethodId },
      });
      stripeCustomerId = customer.id;
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }

    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent'],
    });

    user.subscriptionId = subscription.id;
    user.subscriptionStatus = subscription.status;
    await user.save();

    res.json(subscription);
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
});

// Create a Stripe Customer Portal session
router.post('/create-customer-portal-session', authMiddleware, async (req, res) => {
    const user = await User.findById(req.user.id);
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: 'http://localhost:3000/dashboard',
    });
    res.json({ url: portalSession.url });
});

// Stripe Webhook Handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const user = await User.findOne({ stripeCustomerId: subscription.customer });
    if (user) {
      user.subscriptionStatus = subscription.status;
      await user.save();
    }
  }

  res.json({ received: true });
});

router.get('/subscription-status', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.subscriptionId) {
            return res.status(404).json({ msg: 'No subscription found' });
        }
        // You could also fetch the subscription from Stripe for the most up-to-date status
        // const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);
        res.json({ status: user.subscriptionStatus });
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

export default router;