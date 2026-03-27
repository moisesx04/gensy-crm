import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
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
    return res.status(401).json({ error: 'No autorizado. Falta token.' });
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }

  // El ID del usuario viene del token decodificado
  const userId = decoded.id;

  if (method === 'PATCH') {
    const { email, nombre, password } = req.body;

    try {
      let updateFields = [];
      let params = {};

      if (email) {
        updateFields.push('email = ${email}');
        params.email = email;
      }
      if (nombre) {
        updateFields.push('nombre = ${nombre}');
        params.nombre = nombre;
      }
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateFields.push('password_hash = ${password_hash}');
        params.password_hash = hashedPassword;
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron campos para actualizar.' });
      }

      // Re-building the query safely with neon using raw SQL if needed, 
      // but better to use individual COALESCE or separate queries for simplicity if neon doesn't support dynamic columns easily.
      // Since it's neon-serverless, I'll use a direct UPDATE with conditions.

      const result = await sql`
        UPDATE usuarios SET
          email = COALESCE(${email || null}, email),
          nombre = COALESCE(${nombre || null}, nombre),
          password_hash = COALESCE(${params.password_hash || null}, password_hash)
        WHERE id = ${userId}
        RETURNING id, email, nombre;
      `;

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }

      const updatedUser = result.rows[0];
      return res.status(200).json({ 
        success: true, 
        user: { email: updatedUser.email, nombre: updatedUser.nombre } 
      });

    } catch (error) {
      console.error('[Usuarios Error]', error);
      if (error.message.includes('unique constraint') || error.message.includes('usuarios_email_key')) {
        return res.status(400).json({ error: 'El email ya está en uso por otro usuario.' });
      }
      return res.status(500).json({ error: 'Error al actualizar el perfil.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
