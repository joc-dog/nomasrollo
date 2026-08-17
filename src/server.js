const express = require('express');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Habilitar compresión GZIP para mejorar velocidad (SEO Core Web Vitals)
app.use(compression());

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, '..', 'public')));

// Manejar todas las rutas y redirigir a index.html (Single Page Application)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`Servidor de No Más Rollo ejecutándose con éxito.`);
  console.log(`Localhost: http://localhost:${PORT}`);
  console.log(`Presiona Ctrl+C para detener el servidor.`);
  console.log(`==================================================`);
});
