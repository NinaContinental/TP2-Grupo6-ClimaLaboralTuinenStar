// Variables de entorno SOLO para pruebas: no se usa la base de datos real
// ni el .env del desarrollador.
process.env.JWT_SECRET = 'secreto-solo-para-pruebas';
process.env.JWT_EXPIRES_IN = '30m';
