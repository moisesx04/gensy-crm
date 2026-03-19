import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const sql = neon(process.env.POSTGRES_URL, { fullResults: true });

const JWT_SECRET = process.env.JWT_SECRET || 'gensy-secret-key-2026';

export default async function handler(req, res) {
  // Verificar variables de entorno críticas
  if (!process.env.POSTGRES_URL) {
    return res.status(500).json({ error: 'Falta POSTGRES_URL en las variables de entorno.' });
  }

  const { method } = req;

  // El método POST no requiere token en este diseño específico (registro desde fuera)?
  // No, el diseño original parece permitirlo. Lo mantenemos igual.
  if (method === 'POST') {
    const c = req.body;
    try {
      const result = await sql`
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
      console.error('Error DB (POST /clientes):', error);
      return res.status(500).json({ error: 'Error DB al registrar cliente: ' + error.message });
    }
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado. Falta token.' });
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error('Error JWT:', err);
    return res.status(403).json({ error: 'Token inválido o expirado: ' + err.message });
  }

  try {
    if (method === 'GET') {
      const { rows } = await sql`SELECT * FROM clientes ORDER BY created_at DESC;`;
      return res.status(200).json(rows);
    }

    if (method === 'DELETE') {
      const { id } = req.query;
      await sql`DELETE FROM clientes WHERE id = ${id};`;
      return res.status(200).json({ message: 'Cliente eliminado.' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error DB (GET/DELETE /clientes):', error);
    return res.status(500).json({ error: 'Error de base de datos: ' + error.message });
  }
};
