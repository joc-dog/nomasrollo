require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const citiesFilePath = path.join(__dirname, 'cities.json');
const templateFilePath = path.join(__dirname, '..', 'public', 'index.html');
const blogTemplatePath = path.join(__dirname, '..', 'public', 'blog-template.html');
const blogListTemplatePath = path.join(__dirname, '..', 'public', 'blog-list.html');

const outputBaseDir = path.join(__dirname, '..', 'public', 'marketing-digital');
const blogOutputDir = path.join(__dirname, '..', 'public', 'blog');
const sitemapFilePath = path.join(__dirname, '..', 'public', 'sitemap.xml');

// Supabase Connection credentials
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fallback articles to guarantee the build works even if Supabase is offline or not yet configured
const fallbackArticles = [
  {
    slug: 'dominio-hosting-servidor-diferencias',
    title: 'Dominio, hosting y servidor: las diferencias que conviene conocer',
    description: 'Comprender qué hace cada uno ayuda a entender cómo funciona una página web y a tomar mejores decisiones al crear un proyecto digital.',
    date: '10 jul 2026',
    category: 'Desarrollo',
    image: '/assets/blog/dominio-hosting.jpg',
    content: '<h3>El punto de partida de tu proyecto</h3><p>Para lanzar un proyecto digital necesitas tres elementos básicos: el dominio (el nombre de tu web), el hosting (el servidor donde se guardan tus archivos) y el servidor DNS (el traductor que los conecta).</p><h3>¿Qué es el dominio?</h3><p>El dominio es la dirección de tu casa digital. Por ejemplo, <strong>nomasrollo.es</strong>. Es el nombre único y exclusivo que los usuarios escriben en el navegador para encontrarte.</p><h3>¿Qué es el hosting?</h3><p>El hosting o alojamiento web es el terreno físico donde construyes tu casa. Es un espacio en un servidor conectado a internet las 24 horas del día donde se almacenan las imágenes, el código y el contenido de tu página web.</p><h3>¿Qué es el servidor?</h3><p>El servidor es la computadora física real que aloja el hosting. Tiene una potencia muy elevada y está optimizada para servir las solicitudes de los usuarios en milisegundos.</p>'
  },
  {
    slug: 'metricas-marketing-digital-empresas',
    title: '¿Qué métricas de marketing debería conocer cualquier empresa?',
    description: 'Medir los datos adecuados permite entender cómo se comportan los usuarios y tomar decisiones más acertadas para hacer crecer un negocio.',
    date: '10 jul 2026',
    category: 'Analítica',
    image: '/assets/blog/metricas.jpg',
    content: '<h3>El valor de los datos reales</h3><p>En el marketing digital, lo que no se mide no se puede mejorar. Analizar las métricas correctas es la diferencia entre ir a ciegas o tomar decisiones rentables basándote en el comportamiento de tus clientes.</p><h3>1. Costo de Adquisición de Cliente (CAC)</h3><p>El CAC te dice exactamente cuánto dinero te cuesta conseguir un nuevo cliente. Se calcula dividiendo la inversión total en marketing y ventas entre el número de clientes captados.</p><h3>2. Retorno de la Inversión Publicitaria (ROAS)</h3><p>El ROAS mide el beneficio generado por cada euro invertido en campañas de anuncios. Si gastas 100€ en Google Ads y facturas 500€, tu ROAS es de 5:1 (un 500%).</p><h3>3. Tasa de Conversión</h3><p>Es el porcentaje de usuarios que completan una acción deseada en tu web (como rellenar el formulario de contacto o realizar una compra). Una tasa de conversión óptima suele rondar entre el 1% y el 3%.</p>'
  },
  {
    slug: 'paradoja-de-la-eleccion-conversiones',
    title: 'La paradoja de la elección: cuando ofrecer demasiado hace perder clientes',
    description: 'Más opciones no siempre significan más ventas. En muchos casos, un exceso de alternativas genera dudas, ralentiza la decisión y hace que los clientes abandonen.',
    date: '10 jul 2026',
    category: 'CRO',
    image: '/assets/blog/paradoja-eleccion.jpg',
    content: '<h3>Menos es más en el diseño web</h3><p>El psicólogo Barry Schwartz describió cómo el exceso de opciones paraliza al consumidor en lugar de liberarlo. En el diseño de páginas web y landing pages, este principio (conocido como CRO o conversión) es fundamental para evitar fugas de clientes.</p><h3>¿Por qué demasiadas opciones reducen tus ventas?</h3><p>Cuando un visitante entra a tu web y ve 15 servicios diferentes, 3 CTAs principales y 5 formas de contacto, su cerebro se fatiga. Ante la duda de no saber cuál elegir, el usuario prefiere cerrar la pestaña y marcharse.</p><h3>Cómo simplificar tu estructura para vender más</h3><p>1. <strong>Un solo objetivo principal por página</strong>: Cada landing page debe tener un CTA claro (ej. "Llamar ahora" o "Pedir presupuesto").<br>2. <strong>Estructura clara de servicios</strong>: Agrupa tus servicios en categorías lógicas y presenta la información de forma progresiva.<br>3. <strong>Formularios cortos</strong>: Pide solo los datos estrictamente necesarios (Nombre, Email y Teléfono) para evitar fricciones de salida.</p>'
  }
];

function generateBlogCardHtml(post) {
  return `
        <article class="blog-card">
          <div class="card-image-wrapper">
            <img src="${post.image}" alt="${post.title}" class="card-image" loading="lazy">
            <span class="card-date-badge">${post.date}</span>
          </div>
          <div class="blog-card-content">
            <span class="blog-card-category">${post.category}</span>
            <h3 class="blog-card-title"><a href="/blog/${post.slug}">${post.title}</a></h3>
            <p class="blog-card-excerpt">${post.description}</p>
            <div class="blog-card-footer">
              <a href="/blog/${post.slug}" class="card-read-more">Leer más &rarr;</a>
            </div>
          </div>
        </article>`;
}

async function main() {
  try {
    console.log('Iniciando proceso de generación estática (SSG) de Blog y SEO Local...');

    // ==========================================================================
    // 1. OBTENER ARTÍCULOS DE SUPABASE O USAR FALLBACKS
    // ==========================================================================
    let articles = [];
    try {
      console.log('Conectando a Supabase para descargar artículos...');
      const { data: dbArticles, error } = await supabase
        .from('articulos')
        .select('*')
        .eq('published', true)
        .order('id', { ascending: true }); // Mantiene orden original

      if (error) {
        throw error;
      }
      if (dbArticles && dbArticles.length > 0) {
        articles = dbArticles;
        console.log(`Descargados con éxito ${articles.length} artículos desde Supabase.`);
      } else {
        console.log('No se encontraron artículos en la tabla de Supabase. Usando artículos por defecto.');
        articles = fallbackArticles;
      }
    } catch (dbError) {
      console.warn('Error al conectar a Supabase, usando artículos locales por defecto:', dbError.message);
      articles = fallbackArticles;
    }

    // ==========================================================================
    // 2. INYECTAR TARJETAS EN INDEX.HTML TEMPLATE (VISTA PREVIA)
    // ==========================================================================
    if (!fs.existsSync(templateFilePath)) {
      throw new Error(`No se encuentra la plantilla base index.html: ${templateFilePath}`);
    }
    let templateHtml = fs.readFileSync(templateFilePath, 'utf8');

    // Tomamos las últimas 3 noticias para la home
    const latestPosts = articles.slice(-3).reverse();
    const latestCardsHtml = latestPosts.map(generateBlogCardHtml).join('\n');
    
    // Inyectamos preservando el tag de reemplazo para futuras compilaciones
    templateHtml = templateHtml.replace(
      '<!-- INJECT_LATEST_POSTS -->',
      `<!-- INJECT_LATEST_POSTS -->\n${latestCardsHtml}`
    );

    // ==========================================================================
    // 3. GENERAR PÁGINAS INDIVIDUALES DEL BLOG
    // ==========================================================================
    if (fs.existsSync(blogTemplatePath)) {
      const blogPostTemplate = fs.readFileSync(blogTemplatePath, 'utf8');
      
      for (const post of articles) {
        console.log(`Generando página de artículo: /blog/${post.slug}`);
        let postHtml = blogPostTemplate;
        
        postHtml = postHtml.replace(/{{TITLE}}/g, post.title);
        postHtml = postHtml.replace(/{{SLUG}}/g, post.slug);
        postHtml = postHtml.replace(/{{DESCRIPTION}}/g, post.description);
        postHtml = postHtml.replace(/{{IMAGE}}/g, post.image);
        postHtml = postHtml.replace(/{{DATE}}/g, post.date);
        postHtml = postHtml.replace(/{{CATEGORY}}/g, post.category);
        postHtml = postHtml.replace(/{{CONTENT}}/g, post.content);

        const postOutputDir = path.join(blogOutputDir, post.slug);
        if (!fs.existsSync(postOutputDir)) {
          fs.mkdirSync(postOutputDir, { recursive: true });
        }
        fs.writeFileSync(path.join(postOutputDir, 'index.html'), postHtml);
      }
    } else {
      console.warn(`Plantilla de artículo de blog no encontrada en ${blogTemplatePath}`);
    }

    // ==========================================================================
    // 4. GENERAR LISTADO GENERAL DE BLOG (/blog/index.html)
    // ==========================================================================
    if (fs.existsSync(blogListTemplatePath)) {
      let blogListHtml = fs.readFileSync(blogListTemplatePath, 'utf8');
      const allCardsHtml = articles.map(generateBlogCardHtml).reverse().join('\n');
      
      blogListHtml = blogListHtml.replace(
        '<!-- INJECT_BLOG_CARDS -->',
        `<!-- INJECT_BLOG_CARDS -->\n${allCardsHtml}`
      );

      if (!fs.existsSync(blogOutputDir)) {
        fs.mkdirSync(blogOutputDir, { recursive: true });
      }
      fs.writeFileSync(path.join(blogOutputDir, 'index.html'), blogListHtml);
      console.log('Listado general de blog generado en: /blog/index.html');
    } else {
      console.warn(`Plantilla de listado de blog no encontrada en ${blogListTemplatePath}`);
    }

    // ==========================================================================
    // 5. GENERAR PÁGINAS DE CIUDADES (SEO LOCAL)
    // ==========================================================================
    if (!fs.existsSync(citiesFilePath)) {
      throw new Error(`No se encuentra el archivo de ciudades: ${citiesFilePath}`);
    }
    const cities = JSON.parse(fs.readFileSync(citiesFilePath, 'utf8'));

    if (!fs.existsSync(outputBaseDir)) {
      fs.mkdirSync(outputBaseDir, { recursive: true });
    }

    for (const city of cities) {
      console.log(`Generando landing page local para: ${city.nombre} (${city.slug})...`);
      let html = templateHtml; // Utiliza la plantilla que ya tiene las últimas noticias inyectadas

      // Reemplazo de metatags y etiquetas de cabecera
      html = html.replace(
        '<title>No Más Rollo | Agencia de Marketing Digital</title>',
        `<title>Agencia de Marketing Digital en ${city.nombre} | No Más Rollo</title>`
      );
      html = html.replace(
        '<meta property="og:title" content="No Más Rollo | Agencia de Marketing Digital">',
        `<meta property="og:title" content="Agencia de Marketing Digital en ${city.nombre} | No Más Rollo">`
      );
      html = html.replace(
        '<meta name="twitter:title" content="No Más Rollo | Agencia de Marketing Digital">',
        `<meta name="twitter:title" content="Agencia de Marketing Digital en ${city.nombre} | No Más Rollo">`
      );
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

      // Reemplazo del encabezado visual principal (H1 badge)
      html = html.replace(
        '<h1 class="hero-badge">Agencia de Marketing Digital en Orihuela</h1>',
        `<h1 class="hero-badge">Agencia de Marketing Digital en ${city.nombre}</h1>`
      );

      // Reemplazo de geolocalización en los datos estructurados JSON-LD
      html = html.replace(
        '"addressLocality": "Orihuela"',
        `"addressLocality": "${city.nombre}"`
      );

      // Activar el link correspondiente en el footer
      html = html.replace(
        `href="/marketing-digital/${city.slug}" class="location-tag"`,
        `href="/marketing-digital/${city.slug}" class="location-tag active"`
      );

      // Convertir rutas relativas a absolutas en subcarpetas para evitar errores 404
      html = html.replace(/href="css\//g, 'href="/css/');
      html = html.replace(/src="js\//g, 'src="/js/');
      html = html.replace(/src="assets\//g, 'src="/assets/');
      html = html.replace(/href="favicon/g, 'href="/favicon');
      html = html.replace(/href="apple-touch-icon/g, 'href="/apple-touch-icon');

      const cityOutputDir = path.join(outputBaseDir, city.slug);
      if (!fs.existsSync(cityOutputDir)) {
        fs.mkdirSync(cityOutputDir, { recursive: true });
      }
      fs.writeFileSync(path.join(cityOutputDir, 'index.html'), html);
    }

    // ==========================================================================
    // 6. GENERAR SITEMAP.XML ACTUALIZADO
    // ==========================================================================
    console.log('Generando mapa de sitio sitemap.xml completo...');
    const today = new Date().toISOString().split('T')[0];
    
    let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.nomasrollo.es/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.nomasrollo.es/blog/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;

    // Añadir artículos de blog al sitemap
    for (const post of articles) {
      sitemapContent += `  <url>
    <loc>https://www.nomasrollo.es/blog/${post.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
    }

    // Añadir páginas de SEO local
    for (const city of cities) {
      sitemapContent += `  <url>
    <loc>https://www.nomasrollo.es/marketing-digital/${city.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
    }

    sitemapContent += '</urlset>\n';
    fs.writeFileSync(sitemapFilePath, sitemapContent);
    console.log(`Sitemap generado con éxito en: ${sitemapFilePath}`);

    console.log('¡Generación estática (SSG) de Blog, SEO Local y Sitemap completada con éxito!');
  } catch (error) {
    console.error('Error durante la generación de páginas:', error);
    process.exit(1);
  }
}

main();
