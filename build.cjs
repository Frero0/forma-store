const fs = require('node:fs');
fs.mkdirSync('dist', {recursive:true});
require('esbuild').buildSync({entryPoints:['src/index.js'],bundle:true,minify:true,outfile:'dist/app.js',loader:{'.js':'jsx'},define:{'process.env.NODE_ENV':'"production"'}});
fs.copyFileSync('public/index.html','dist/index.html');
