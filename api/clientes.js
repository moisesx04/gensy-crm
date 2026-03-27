import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const sql = neon(process.env.POSTGRES_URL, { fullResults: true });

export default async function handler(req, res) {
  // Verificar variables de entorno críticas
  if (!process.env.POSTGRES_URL) {
    return res.status(500).json({ error: 'Configuración del servidor incompleta.' });
  }

  const JWT_SECRET = process.env.JWT_SECRET;

  const { method } = req;

  // POST — Registro público desde el formulario/chatbot (no requiere token)
  if (method === 'POST') {
    const c = req.body;

    if (!c.nombreCompleto) {
      return res.status(400).json({ error: 'El nombre completo es requerido.' });
    }

    try {
      console.log(`[POST /clientes] Iniciando registro para: ${c.nombreCompleto}`);
      // Log enmascarado del host de la DB para diagnóstico de entorno
      if (process.env.POSTGRES_URL) {
        const dbHost = new URL(process.env.POSTGRES_URL).host;
        console.log(`[DB Info] Host: ${dbHost.replace(/[^.]/g, '*', 0, 4)}...`);
      }

      const result = await sql`
        INSERT INTO clientes (
          nombre_completo, telefono, direccion, num_personas, num_habitaciones,
          edades, mascotas, tipo_identificacion, tipo_id_otro, numero_identificacion,
          tipo_social, numero_social, credit_score, cuenta_banco, forma_cobro,
          presento_taxes, monto_taxes, ingresos_mensuales, lugar_trabajo,
          cash_o_programa, programa_asistencia
        ) VALUES (
          ${c.nombreCompleto}, ${c.telefono}, ${c.direccion}, ${c.numPersonas}, ${c.numHabitaciones},
          ${c.edades}, ${c.mascotas}, ${c.tipoIdentificacion}, ${c.tipoIdOtro}, ${c.numeroIdentificacion},
          ${c.tipoSocial}, ${c.numeroSocial}, ${c.creditScore}, ${c.cuentaBanco}, ${c.formaCobro},
          ${c.presentoTaxes}, ${c.montoTaxes}, ${c.ingresosMensuales}, ${c.lugarTrabajo},
          ${c.cashOPrograma}, ${c.programaAsistencia}
        ) RETURNING id;
      `;

      const newId = result.rows[0].id;

      // CREAR NOTIFICACIÓN AUTOMÁTICA
      try {
        await sql`
          INSERT INTO notificaciones (titulo, mensaje, tipo, cliente_id)
          VALUES (
            ${'Nuevo registro: ' + c.nombreCompleto},
            ${'Un nuevo cliente ha completado el formulario.'},
            'info',
            ${newId}
          );
        `;
        console.log(`[POST /clientes] Notificación creada para el cliente ${newId}`);
      } catch (notifError) {
        console.error('Error al crear notificación (no crítico):', notifError);
      }

      return res.status(201).json({ id: newId });
    } catch (error) {
      console.error('Error DB (POST /clientes):', error);
      return res.status(500).json({ error: 'Error al registrar el cliente en el servidor.' });
    }
  }

  // PATCH — Edición del cliente recién creado (flujo post-formulario, sin token)
  if (method === 'PATCH') {
    const c = req.body;
    if (!c.id) return res.status(400).json({ error: 'ID is required for update' });

    // Validar formato UUID para evitar manipulaciones
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(c.id)) {
      return res.status(400).json({ error: 'Formato de ID inválido. Operación denegada.' });
    }

    try {
      const result = await sql`
        UPDATE clientes SET
          nombre_completo = COALESCE(${c.nombreCompleto}, nombre_completo),
          telefono = COALESCE(${c.telefono}, telefono),
          direccion = COALESCE(${c.direccion}, direccion),
          num_personas = COALESCE(${c.numPersonas}, num_personas),
          num_habitaciones = COALESCE(${c.numHabitaciones}, num_habitaciones),
          edades = COALESCE(${c.edades}, edades),
          mascotas = COALESCE(${c.mascotas}, mascotas),
          tipo_identificacion = COALESCE(${c.tipoIdentificacion}, tipo_identificacion),
          tipo_id_otro = COALESCE(${c.tipoIdOtro}, tipo_id_otro),
          numero_identificacion = COALESCE(${c.numeroIdentificacion}, numero_identificacion),
          tipo_social = COALESCE(${c.tipoSocial}, tipo_social),
          numero_social = COALESCE(${c.numeroSocial}, numero_social),
          credit_score = COALESCE(${c.creditScore}, credit_score),
          cuenta_banco = COALESCE(${c.cuentaBanco}, cuenta_banco),
          forma_cobro = COALESCE(${c.formaCobro}, forma_cobro),
          presento_taxes = COALESCE(${c.presentoTaxes}, presento_taxes),
          monto_taxes = COALESCE(${c.montoTaxes}, monto_taxes),
          ingresos_mensuales = COALESCE(${c.ingresosMensuales}, ingresos_mensuales),
          lugar_trabajo = COALESCE(${c.lugarTrabajo}, lugar_trabajo),
          cash_o_programa = COALESCE(${c.cashOPrograma}, cash_o_programa),
          programa_asistencia = COALESCE(${c.programaAsistencia}, programa_asistencia)
        WHERE id = ${c.id}
        RETURNING id;
      `;
      if (!result.rows[0]) return res.status(404).json({ error: 'Cliente no encontrado.' });
      return res.status(200).json({ id: result.rows[0].id, success: true });
    } catch (error) {
      console.error('Error DB (PATCH /clientes):', error);
      return res.status(500).json({ error: 'Error al actualizar el cliente. Intente de nuevo.' });
    }
  }

  // GET y DELETE requieren autenticación
  if (!JWT_SECRET) {
    return res.status(500).json({ error: 'Configuración de seguridad del servidor incompleta.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado. Falta token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error('Error JWT:', err.name);
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }

  try {
    if (method === 'GET') {
      console.log('[GET /clientes] Solicitando lista de clientes...');
      const { rows } = await sql`SELECT * FROM clientes ORDER BY created_at DESC;`;
      console.log(`[GET /clientes] Éxito. Total: ${rows.length}`);

      const mapped = rows.map(r => ({
        id: r.id,
        nombreCompleto: r.nombre_completo,
        telefono: r.telefono,
        direccion: r.direccion,
        numPersonas: r.num_personas,
        numHabitaciones: r.num_habitaciones,
        edades: r.edades,
        mascotas: r.mascotas,
        tipoIdentificacion: r.tipo_identificacion,
        tipoIdOtro: r.tipo_id_otro,
        numeroIdentificacion: r.numero_identificacion,
        tipoSocial: r.tipo_social,
        numeroSocial: r.numero_social,
        creditScore: r.credit_score,
        cuentaBanco: r.cuenta_banco,
        formaCobro: r.forma_cobro,
        presentoTaxes: r.presento_taxes,
        montoTaxes: r.monto_taxes,
        ingresosMensuales: r.ingresos_mensuales,
        lugarTrabajo: r.lugar_trabajo,
        cashOPrograma: r.cash_o_programa,
        programaAsistencia: r.programa_asistencia,
        createdAt: r.created_at
      }));

      return res.status(200).json(mapped);
    }

    if (method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'ID is required' });
      await sql`DELETE FROM clientes WHERE id = ${id}`;
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error DB (GET/DELETE /clientes):', error);
    return res.status(500).json({ error: 'Error de base de datos. Intente de nuevo.' });
  }
};
