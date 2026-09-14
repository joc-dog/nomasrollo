const { Jimp } = require('jimp');
const path = require('path');

async function transform() {
  try {
    const inputPath = path.join(__dirname, '..', 'public', 'assets', 'blog', 'metricas.jpg');
    const outputPath = path.join(__dirname, '..', 'public', 'assets', 'blog', 'dominio-hosting.jpg');
    
    // Read the image
    const image = await Jimp.read(inputPath);
    
    // Flip horizontally
    image.flip({ horizontal: true, vertical: false });
    
    // Crop center/zoom slightly and modify pixel colors (hue shift manually)
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    // Perform hue shift by manipulating RGB pixels directly
    image.scan(0, 0, width, height, function(x, y, idx) {
      // Swapping color channels (r <-> g) for a cool vibrant neon shift while keeping dark background dark
      let r = this.bitmap.data[idx + 0];
      let g = this.bitmap.data[idx + 1];
      let b = this.bitmap.data[idx + 2];
      
      // Swap green and red channels to give a unique golden-copper electric tone
      this.bitmap.data[idx + 0] = Math.min(255, g * 1.1);
      this.bitmap.data[idx + 1] = Math.min(255, r * 0.9);
    });

    await image.write(outputPath);
    console.log('Image successfully transformed and saved to:', outputPath);
  } catch (err) {
    console.error('Error transforming image with Jimp:', err);
  }
}

transform();
