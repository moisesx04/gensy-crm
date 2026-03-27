import jwt from 'jsonwebtoken';

export function verifyAuthToken(req, res) {
  if (!process.env.JWT_SECRET) {
    res.status(500).json({ error: 'Configuración de seguridad del servidor incompleta.' });
    return null;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autorizado. Falta token.' });
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    console.error('Error JWT:', err.name);
    res.status(403).json({ error: 'Token inválido o expirado.' });
    return null;
  }
}
