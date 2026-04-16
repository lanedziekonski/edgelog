const sharp = require('sharp');
const path = require('path');

// Source image: 832x1248
// Bottom ~30% starts at y=874, height=374
// The small app icon square sits in approximately y=1038..1248
const SRC  = path.join(require('os').homedir(), 'Downloads/IMG_4946.JPG');
const DEST = path.join(__dirname, '../public/icon.png');

sharp(SRC)
  .extract({ left: 0, top: 874, width: 832, height: 374 })  // bottom 30%
  .resize(200, 200, { fit: 'cover', position: 'centre' })
  .png()
  .toFile(DEST)
  .then(() => console.log('icon.png written to public/'))
  .catch(err => console.error(err));
