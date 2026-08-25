require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const citiesFilePath = path.join(__dirname, 'cities.json');
const blogFilePath = path.join(__dirname, 'blog.json');
const templateFilePath = path.join(__dirname, '..', 'public', 'index.html');
const blogTemplatePath = path.join(__dirname, '..', 'public', 'blog-template.html');
const blogListTemplatePath = path.join(__dirname, '..', 'public', 'blog-list.html');

const outputBaseDir = path.join(__dirname, '..', 'public', 'marketing-digital');
const blogOutputDir = path.join(__dirname, '..', 'public', 'blog');
const sitemapFilePath = path.join(__dirname, '..', 'public', 'sitemap.xml');

// Load environment variables for Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

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
    // 1. OBTENER ARTÍCULOS DESDE BLOG.JSON LOCAL O SUPABASE
    // ==========================================================================
    let articles = [];
    
    // Primero, cargamos los datos por defecto desde blog.json local
    if (fs.existsSync(blogFilePath)) {
      try {
        articles = JSON.parse(fs.readFileSync(blogFilePath, 'utf8'));
        console.log(`Cargados ${articles.length} artículos base desde el archivo local blog.json.`);
      } catch (jsonErr) {
        console.warn('Error al parsear el blog.json local:', jsonErr.message);
      }
    }

    // Si las claves de Supabase están definidas, intentamos sincronizar con la base de datos
    if (supabase) {
      try {
        console.log('Conectando a tu nueva base de datos de Supabase para obtener artículos...');
        const { data: dbArticles, error } = await supabase
          .from('articulos')
          .select('*')
          .eq('published', true)
          .order('id', { ascending: true });

        if (error) {
          throw error;
        }

        if (dbArticles && dbArticles.length > 0) {
          articles = dbArticles;
          console.log(`¡Conectado con éxito! Sincronizados ${articles.length} artículos en vivo desde Supabase.`);
        } else {
          console.log('La tabla de Supabase está vacía. Utilizando artículos locales de blog.json.');
        }
      } catch (dbError) {
        console.warn('No se pudo conectar a Supabase o la tabla no está lista aún. Usando artículos locales:', dbError.message);
      }
    } else {
      console.log('No se configuraron credenciales de Supabase en .env. Compilando únicamente con blog.json local.');
    }

    // ==========================================================================
    // 2. INYECTAR TARJETAS EN INDEX.HTML TEMPLATE (VISTA PREVIA)
    // ==========================================================================
    if (!fs.existsSync(templateFilePath)) {
      throw new Error(`No se encuentra la plantilla base index.html: ${templateFilePath}`);
    }
    let templateHtml = fs.readFileSync(templateFilePath, 'utf8');

    // Tomamos las últimas 4 noticias para la home
    const latestPosts = articles.slice(-4).reverse();
    const latestCardsHtml = latestPosts.map(generateBlogCardHtml).join('\n');
    
    // Inyectamos usando comentarios de inicio y fin para permitir regeneraciones limpias
    const startTag = '<!-- INJECT_LATEST_POSTS_START -->';
    const endTag = '<!-- INJECT_LATEST_POSTS_END -->';
    const regex = new RegExp(`${startTag}[\\s\\S]*?${endTag}`);
    templateHtml = templateHtml.replace(
      regex,
      `${startTag}\n${latestCardsHtml}\n${endTag}`
    );

    // Guardamos la plantilla compilada con los posts de vuelta a public/index.html
    fs.writeFileSync(templateFilePath, templateHtml);
    console.log('Inyectadas las últimas 4 noticias en la página principal index.html.');

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
