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
      // Auto-migración silenciosa para asegurar que la columna financiero exista
      try {
        await sql`ALTER TABLE propiedades ADD COLUMN IF NOT EXISTS financiero JSONB;`;
        await sql`ALTER TABLE propiedades ADD COLUMN IF NOT EXISTS description TEXT;`;
      } catch (e) {
        // Ignorar si ya existe o hay error de permisos (ya fue manejado en init.js igualmente)
      }

      const { rows } = await sql`
        SELECT p.*, c.nombre_completo as cliente_nombre 
        FROM propiedades p
        LEFT JOIN clientes c ON p.cliente_id = c.id
        ORDER BY p.created_at DESC;
      `;
      return res.status(200).json(rows);
    }

    if (method === 'POST') {
      const p = req.body;
      if (!p.title) return res.status(400).json({ error: 'El título de la propiedad es requerido.' });
      const { rows } = await sql`
        INSERT INTO propiedades (title, location, price, beds, baths, tag, description)
        VALUES (${p.title}, ${p.loc}, ${p.price}, ${p.beds}, ${p.baths}, ${p.tag}, ${p.description || ''})
        RETURNING *;
      `;
      return res.status(201).json(rows[0]);
    }

    if (method === 'PATCH') {
      const { id, status, cliente_id, fecha_cita, financiero, title, loc, price, beds, baths, tag } = req.body;
      if (!id) return res.status(400).json({ error: 'ID is required.' });

      if (title !== undefined) {
        // Full property details update
        const { rows } = await sql`
          UPDATE propiedades 
          SET title=${title}, location=${loc}, price=${price}, beds=${beds}, baths=${baths}, tag=${tag}
          WHERE id = ${id}
          RETURNING *;
        `;
        return res.json(rows[0]);
      } else {
        // Assignment update
        const { rows } = await sql`
          UPDATE propiedades 
          SET status = ${status}, cliente_id = ${cliente_id}, fecha_cita = ${fecha_cita}, financiero = ${financiero ? JSON.stringify(financiero) : null}
          WHERE id = ${id}
          RETURNING *;
        `;

        // Trigger notification if appointment is set
        if (fecha_cita) {
          const { rows: clientRow } = await sql`SELECT nombre_completo FROM clientes WHERE id = ${cliente_id}`;
          const clientName = clientRow[0]?.nombre_completo || 'Cliente';
          await sql`
            INSERT INTO notificaciones (titulo, mensaje, tipo, cliente_id, propiedad_id)
            VALUES ('Nueva Cita Programada', ${`Cita para ${rows[0].title} con ${clientName}`}, 'cita', ${cliente_id}, ${id});
          `;
        }
        return res.json({ success: true });
      }
    }

    if (method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'ID is required' });
      await sql`DELETE FROM propiedades WHERE id = ${id}`;
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[Propiedades Error]', error);
    return res.status(500).json({ error: 'Error de base de datos. Intente de nuevo.' });
  }
}
