const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const outDir = path.join(__dirname, '..', 'public', 'images', 'products');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const images = [
  {
    name: 'gradient-graphic-tshirt.png',
    url: 'https://www.gmcompanystore.com/cdn/shop/files/7462-MilGrnFst-5-DM130MilGrnFstFlatFront2-1200Wcopy.png?v=1755026253&width=2048'
  },
  {
    name: 'polo-tipping.png',
    url: 'https://7d6c0583.aerocdn.com/image-factory/e401c795f3d03d0af5be9bfa81d26770724b40e5~1336x1598:upscale/images/products/YTw0e8TJsty3S8LEjRaE4ujyYAXQhH73NdVPTf4k.jpg'
  },
  {
    name: 'black-striped.png',
    url: 'https://crocodile.in/cdn/shop/files/2_bec645d6-85f6-4a38-b7fa-4e7904aca666.jpg?v=1723798755&width=1080'
  },
  {
    name: 'skinny-fit-jeans.jpg',
    url: 'https://img01.ztat.net/article/spp-media-p1/85488fe3c0674d918ea80bdc447d1b6f/7e195736cbdc494396f3f9538faf1268.jpg?imwidth=1800'
  },
  {
    name: 'checkered-shirt.jpg',
    url: 'https://static.massimodutti.net/assets/public/2198/a473/493c48eea16e/b251e1c84ea8/05100799701-o7/05100799701-o7.jpg?ts=1747897315493'
  },
  {
    name: 'sleeve-striped.jpg',
    url: 'https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/468879/item/goods_57_468879_3x4.jpg'
  },
  {
    name: 'vertical-striped.jpg',
    url: 'https://d1pdzcnm6xgxlz.cloudfront.net/tops/8905875389903-9.jpg'
  },
  {
    name: 'courage-graphic.jpg',
    url: 'https://cdn.media.amplience.net/s/hottopic/31436641_hi'
  },
  {
    name: 'loose-fit-bermuda.jpg',
    url: 'https://i5.walmartimages.com/seo/UTSJKR-Women-s-Baggy-Bermuda-Cargo-Shorts-with-Pockets-High-Waist-Drawstring-Wide-Leg-Denim-Jean-Shorts-Summer-Loose-Fit-Shorts-Black-XXL_62738c2b-63f7-4259-a31d-a8b5096acce2.9012c23d9c30b48d12e3f3497aa9297d.jpeg'
  }
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const request = proto.get(url, (response) => {
      if (response.statusCode >= 400) {
        return reject(new Error('Failed to download ' + url + ' (' + response.statusCode + ')'));
      }
      const file = fs.createWriteStream(dest);
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', (err) => reject(err));
    });
    request.on('error', reject);
  });
}

(async function() {
  for (const img of images) {
    const dest = path.join(outDir, img.name);
    try {
      console.log('Downloading', img.url, '->', dest);
      await download(img.url, dest);
      console.log('Saved', dest);
    } catch (e) {
      console.error('Error saving', img.url, e.message || e);
    }
  }
  console.log('Done.');
})();
