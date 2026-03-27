import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const sql = neon(process.env.POSTGRES_URL, { fullResults: true });

export default async function handler(req, res) {
  if (!process.env.POSTGRES_URL) {
    return res.status(500).json({ error: 'Configuración del servidor incompleta.' });
  }
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'Configuración de seguridad del servidor incompleta.' });
  }

  const { method } = req;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }

  try {
    if (method === 'GET') {
      const { rows } = await sql`SELECT * FROM notificaciones ORDER BY created_at DESC LIMIT 20;`;
      return res.status(200).json(rows);
    }

    if (method === 'DELETE') {
      const { id } = req.query;
      if (id) {
        await sql`DELETE FROM notificaciones WHERE id = ${id};`;
      } else {
        await sql`DELETE FROM notificaciones;`;
      }
      return res.status(200).json({ message: 'Notificación eliminada' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[Notificaciones Error]', error);
    return res.status(500).json({ error: 'Error de base de datos. Intente de nuevo.' });
  }
}
