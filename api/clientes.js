import { createPool } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

const pool = createPool({ 
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL 
});

const JWT_SECRET = process.env.JWT_SECRET || 'gensy-secret-key-2026';

export default async function handler(req, res) {
  const { method } = req;

  // 1. POST: Registro público de clientes (sin auth)
  if (method === 'POST') {
    const c = req.body;
    try {
      const result = await pool.sql`
        INSERT INTO clientes (
          nombre_completo, telefono, direccion, num_personas, num_habitaciones,
          edades, mascotas, tipo_identificacion, tipo_id_otro, numero_identificacion,
          tipo_social, numero_social, credit_score, cuenta_banco, forma_cobro,
          presento_taxes, monto_taxes, ingresos_mensuales, lugar_trabajo,
          cash_o_programa, programa_asistencia
        ) VALUES (
          ${c.nombreCompleto}, ${c.telefono}, ${c.direccion}, ${c.numPersonas}, ${c.numHabitaciones},
          ${c.edades}, ${c.mascotas}, ${c.tipoIdentificacion}, ${c.tipoId_otro}, ${c.numeroIdentificacion},
          ${c.tipoSocial}, ${c.numeroSocial}, ${c.creditScore}, ${c.cuentaBanco}, ${c.formaCobro},
          ${c.presentoTaxes}, ${c.montoTaxes}, ${c.ingresosMensuales}, ${c.lugarTrabajo},
          ${c.cashOPrograma}, ${c.programaAsistencia}
        ) RETURNING id;
      `;
      return res.status(201).json({ id: result.rows[0].id });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al registrar cliente.' });
    }
  }

  // 2. GET/DELETE: Solo para administradores autenticados
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, JWT_SECRET);

    if (method === 'GET') {
      const { rows } = await pool.sql`SELECT * FROM clientes ORDER BY created_at DESC;`;
      return res.status(200).json(rows);
    }

    if (method === 'DELETE') {
      const { id } = req.query;
      await pool.sql`DELETE FROM clientes WHERE id = ${id};`;
      return res.status(200).json({ message: 'Cliente eliminado.' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
}
