import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const sql = neon(process.env.POSTGRES_URL, { fullResults: true });

// API de Login
export default async function handler(req, res) {
  // Verificar variables de entorno críticas
  if (!process.env.POSTGRES_URL) {
    return res.status(500).json({ error: 'Configuración del servidor incompleta.' });
  }
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'Configuración de seguridad del servidor incompleta.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
  }

  try {
    const { rows } = await sql`SELECT * FROM usuarios WHERE email = ${email};`;
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    return res.status(200).json({ token, user: { email: user.email, nombre: user.nombre } });
  } catch (error) {
    console.error('[Login Error]', error);
    return res.status(500).json({ error: 'Error en el servidor. Intente de nuevo.' });
  }
};
