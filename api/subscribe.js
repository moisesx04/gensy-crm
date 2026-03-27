import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import webpush from 'web-push';

const sql = neon(process.env.POSTGRES_URL);

// You MUST set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in your env variables.
// If using testing keys below, they are hardcoded from npx web-push generate-vapid-keys
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BIfYRWry-iCfBDkDnzZAxT2cSYr2K5EAzO9O_5-Y8ZMIjcAg2WyLiWSMYwrB07ma-9xI0hN1iBgLjTZPvd-gs9s';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || '5wEExrxJmaPUe4NzSYnicAEsvNJqZ1WlRvw5nq9qVEw';

webpush.setVapidDetails(
  'mailto:test@test.com',
  publicVapidKey,
  privateVapidKey
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET);

    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription object' });
    }

    // Upsert subscription into database
    await sql`
      INSERT INTO push_subscriptions (endpoint, keys, p256dh, auth)
      VALUES (
        ${subscription.endpoint}, 
        ${JSON.stringify(subscription.keys)}::jsonb, 
        ${subscription.keys.p256dh}, 
        ${subscription.keys.auth}
      )
      ON CONFLICT (endpoint) DO UPDATE 
      SET keys = excluded.keys, p256dh = excluded.p256dh, auth = excluded.auth, updated_at = CURRENT_TIMESTAMP;
    `;

    // Send a welcome notification
    const payload = JSON.stringify({
      title: 'Notificaciones Activadas',
      body: 'Recibirás avisos de clientes nuevos y citas aquí.',
      icon: '/icons/icon-192x192.png'
    });

    await webpush.sendNotification(subscription, payload);

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('Push Subscription Setup Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
