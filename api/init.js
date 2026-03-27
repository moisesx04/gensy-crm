import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.POSTGRES_URL, { fullResults: true });

export default async function handler(req, res) {
  // Verificar variables de entorno críticas
  if (!process.env.POSTGRES_URL) {
    return res.status(500).json({ error: 'Configuración del servidor incompleta.' });
  }

  // Proteger con INIT_SECRET para evitar llamadas no autorizadas
  const initSecret = req.headers['x-init-secret'];
  if (!process.env.INIT_SECRET || initSecret !== process.env.INIT_SECRET) {
    return res.status(401).json({ error: 'No autorizado. Se requiere x-init-secret.' });
  }

  try {
    await sql`
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

    await sql`
      CREATE TABLE IF NOT EXISTS usuarios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        nombre TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS propiedades (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        location TEXT,
        price TEXT,
        beds INTEGER,
        baths INTEGER,
        sqft INTEGER,
        tag TEXT,
        status TEXT DEFAULT 'Disponible',
        cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
        fecha_cita TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS notificaciones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        titulo TEXT NOT NULL,
        mensaje TEXT,
        tipo TEXT DEFAULT 'info',
        leida BOOLEAN DEFAULT FALSE,
        cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
        propiedad_id UUID REFERENCES propiedades(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Seed primer administrador desde variables de entorno (si no hay usuarios)
    const { rows: userCount } = await sql`SELECT count(*) FROM usuarios;`;
    if (parseInt(userCount[0].count) === 0) {
      const seedEmail = process.env.ADMIN_SEED_EMAIL;
      const seedPassword = process.env.ADMIN_SEED_PASSWORD;

      if (seedEmail && seedPassword) {
        const hashedPassword = await bcrypt.hash(seedPassword, 10);
        await sql`
          INSERT INTO usuarios (email, password_hash, nombre)
          VALUES (${seedEmail}, ${hashedPassword}, 'Admin')
          ON CONFLICT (email) DO NOTHING;
        `;
        console.log(`[Init] Admin creado: ${seedEmail}`);
      } else {
        console.warn('[Init] No se encontraron ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD. No se creó admin inicial.');
      }
    }

    // Seed propiedades iniciales si no hay ninguna
    const { rows: propCount } = await sql`SELECT count(*) FROM propiedades;`;
    if (parseInt(propCount[0].count) === 0) {
      const initialProps = [
        ['Luxury Villa GENSY', 'Piantini, Santo Domingo', '$450,000', 5, 4, 4200, 'Venta'],
        ['Modern Loft Downtown', 'Naco, Santo Domingo', '$280,000', 2, 2, 1800, 'Alquiler'],
        ['Beach House Premium', 'Juan Dolio, San Pedro', '$650,000', 6, 5, 6000, 'Venta'],
        ['Garden Residence', 'Los Cacicazgos, SD', '$320,000', 4, 3, 3100, 'Venta'],
        ['Skyline Apartment', 'Bella Vista, SD', '$390,000', 3, 2, 2200, 'Alquiler'],
        ['Family Estate', 'Arroyo Hondo, SD', '$580,000', 7, 6, 7500, 'Venta'],
      ];
      for (const p of initialProps) {
        await sql`
          INSERT INTO propiedades (title, location, price, beds, baths, sqft, tag)
          VALUES (${p[0]}, ${p[1]}, ${p[2]}, ${p[3]}, ${p[4]}, ${p[5]}, ${p[6]});
        `;
      }
    }

    return res.status(200).json({ message: 'Base de datos inicializada con éxito.' });
  } catch (error) {
    console.error('[Init Error]', error);
    return res.status(500).json({ error: 'Error al inicializar la base de datos.' });
  }
};
