import { createPool } from '@vercel/postgres';

const pool = createPool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL
});

export default async function handler(req, res) {
  try {
    await pool.sql`
      CREATE TABLE IF NOT EXISTS clientes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre_completo TEXT NOT NULL,
        telefono TEXT,
        direccion TEXT,
        num_personas INTEGER,
        num_habitaciones INTEGER,
        edades TEXT,
        mascotas TEXT,
        tipo_identificacion TEXT,
        tipo_id_otro TEXT,
        numero_identificacion TEXT,
        tipo_social TEXT,
        numero_social TEXT,
        credit_score INTEGER,
        cuenta_banco TEXT,
        forma_cobro TEXT,
        presento_taxes TEXT,
        monto_taxes NUMERIC,
        ingresos_mensuales NUMERIC,
        lugar_trabajo TEXT,
        cash_o_programa TEXT,
        programa_asistencia TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.sql`
      CREATE TABLE IF NOT EXISTS usuarios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        nombre TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.sql`
      CREATE TABLE IF NOT EXISTS propiedades (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        location TEXT,
        price TEXT,
        beds INTEGER,
        baths INTEGER,
        sqft INTEGER,
        tag TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    return res.status(200).json({ message: 'Base de datos inicializada con éxito.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
