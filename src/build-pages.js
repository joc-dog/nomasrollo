const fs = require('fs');
const path = require('path');

const citiesFilePath = path.join(__dirname, 'cities.json');
const templateFilePath = path.join(__dirname, '..', 'public', 'index.html');
const outputBaseDir = path.join(__dirname, '..', 'public', 'marketing-digital');
const sitemapFilePath = path.join(__dirname, '..', 'public', 'sitemap.xml');

async function main() {
  try {
    console.log('Iniciando proceso de generación estática para SEO local (SSG)...');
    
    // 1. Cargar ciudades
    if (!fs.existsSync(citiesFilePath)) {
      throw new Error(`No se encuentra el archivo de ciudades: ${citiesFilePath}`);
    }
    const cities = JSON.parse(fs.readFileSync(citiesFilePath, 'utf8'));
    console.log(`Cargadas ${cities.length} ciudades desde la base de datos local.`);
    
    // 2. Cargar plantilla base
    if (!fs.existsSync(templateFilePath)) {
      throw new Error(`No se encuentra el archivo plantilla index.html: ${templateFilePath}`);
    }
    const templateHtml = fs.readFileSync(templateFilePath, 'utf8');
    
    // Asegurar directorio base de salida
    if (!fs.existsSync(outputBaseDir)) {
      fs.mkdirSync(outputBaseDir, { recursive: true });
    }
    
    // 3. Generar página para cada ciudad
    for (const city of cities) {
      console.log(`Generando landing page para: ${city.nombre} (${city.slug})...`);
      let html = templateHtml;
      
      // A. Reemplazo de metatags y etiquetas de cabecera (SEO)
      // Título principal de la página
      html = html.replace(
        '<title>No Más Rollo | Agencia de Marketing Digital</title>',
        `<title>Agencia de Marketing Digital en ${city.nombre} | No Más Rollo</title>`
      );
      
      // Títulos para redes sociales (Open Graph y Twitter)
      html = html.replace(
        '<meta property="og:title" content="No Más Rollo | Agencia de Marketing Digital">',
        `<meta property="og:title" content="Agencia de Marketing Digital en ${city.nombre} | No Más Rollo">`
      );
      html = html.replace(
        '<meta name="twitter:title" content="No Más Rollo | Agencia de Marketing Digital">',
        `<meta name="twitter:title" content="Agencia de Marketing Digital en ${city.nombre} | No Más Rollo">`
      );
      
      // URLs canonical y sociales
      html = html.replace(
        '<link rel="canonical" href="https://nomasrollo.es/">',
        `<link rel="canonical" href="https://www.nomasrollo.es/marketing-digital/${city.slug}">`
      );
      html = html.replace(
        '<meta property="og:url" content="https://nomasrollo.es/">',
        `<meta property="og:url" content="https://www.nomasrollo.es/marketing-digital/${city.slug}">`
      );
      html = html.replace(
        '<meta name="twitter:url" content="https://nomasrollo.es/">',
        `<meta name="twitter:url" content="https://www.nomasrollo.es/marketing-digital/${city.slug}">`
      );
      
      // B. Reemplazo del encabezado visual principal (H1 badge)
      html = html.replace(
        '<h1 class="hero-badge">Agencia de Marketing Digital en Orihuela</h1>',
        `<h1 class="hero-badge">Agencia de Marketing Digital en ${city.nombre}</h1>`
      );
      
      // C. Reemplazo de geolocalización en los datos estructurados JSON-LD
      html = html.replace(
        '"addressLocality": "Orihuela"',
        `"addressLocality": "${city.nombre}"`
      );
      
      // D. Hacer activos los enlaces correspondientes en el footer para dar feedback visual al usuario
      // Reemplaza el tag normal por uno con la clase active
      html = html.replace(
        `href="/marketing-digital/${city.slug}" class="location-tag"`,
        `href="/marketing-digital/${city.slug}" class="location-tag active"`
      );
      
      // E. Convertir todas las rutas relativas en absolutas en subpáginas para evitar 404 de recursos
      html = html.replace(/href="css\//g, 'href="/css/');
      html = html.replace(/src="js\//g, 'src="/js/');
      html = html.replace(/src="assets\//g, 'src="/assets/');
      html = html.replace(/href="favicon/g, 'href="/favicon');
      html = html.replace(/href="apple-touch-icon/g, 'href="/apple-touch-icon');
      
      // Crear directorio de destino para la ciudad
      const cityOutputDir = path.join(outputBaseDir, city.slug);
      if (!fs.existsSync(cityOutputDir)) {
        fs.mkdirSync(cityOutputDir, { recursive: true });
      }
      
      // Escribir el archivo index.html de la subpágina
      fs.writeFileSync(path.join(cityOutputDir, 'index.html'), html);
    }
    
    // 4. Generar sitemap.xml actualizado
    console.log('Generando archivo sitemap.xml completo...');
    const today = new Date().toISOString().split('T')[0];
    
    let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.nomasrollo.es/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
`;

    for (const city of cities) {
      sitemapContent += `  <url>
    <loc>https://www.nomasrollo.es/marketing-digital/${city.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    sitemapContent += '</urlset>\n';
    fs.writeFileSync(sitemapFilePath, sitemapContent);
    console.log(`Sitemap con ${cities.length + 1} URLs guardado en: ${sitemapFilePath}`);
    
    console.log('¡Generación estática (SSG) de páginas y sitemap completada correctamente!');
  } catch (error) {
    console.error('Error durante la generación estática:', error);
    process.exit(1);
  }
}

main();
