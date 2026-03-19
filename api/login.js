import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'gensy-secret-key-2026';

// API de Login - Final Fix
export default async function handler(req, res) {
  // Verificar variables de entorno críticas
  if (!process.env.POSTGRES_URL) {
    return res.status(500).json({ error: 'Falta POSTGRES_URL en las variables de entorno.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  try {
    const countRes = await sql`SELECT count(*) FROM usuarios;`;
    const count = parseInt(countRes.rows[0].count);

    if (count === 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await sql`
        INSERT INTO usuarios (email, password_hash, nombre)
        VALUES (${email}, ${hashedPassword}, 'Admin');
      `;
      const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({ message: 'Primer administrador creado.', token, user: { email, nombre: 'Admin' } });
    }

    const { rows } = await sql`SELECT * FROM usuarios WHERE email = ${email};`;
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(200).json({ token, user: { email: user.email, nombre: user.nombre } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en el servidor: ' + error.message });
  }
};
