import { createPool } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const pool = createPool({ 
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL 
});

const JWT_SECRET = process.env.JWT_SECRET || 'gensy-secret-key-2026';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  try {
    // 1. Buscar usuario
    const { rows } = await pool.sql`SELECT * FROM usuarios WHERE email = ${email};`;
    const user = rows[0];

    // 2. Si no hay usuarios en la DB, permitir crear el primero (Setup inicial)
    const countRes = await pool.sql`SELECT count(*) FROM usuarios;`;
    const count = countRes.rows[0].count;
    
    if (parseInt(count) === 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.sql`
        INSERT INTO usuarios (email, password_hash, nombre)
        VALUES (${email}, ${hashedPassword}, 'Admin');
      `;
      const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({ message: 'Primer administrador creado.', token });
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // 3. Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // 4. Generar Token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    return res.status(200).json({ token, user: { email: user.email, nombre: user.nombre } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en el servidor.' });
  }
}
