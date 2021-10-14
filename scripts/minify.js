const fs = require('fs');
const esbuild = require('esbuild');

const file = process.argv[2];
const format = process.argv[3];

if (fs.existsSync(file)) {
  const { peerDependencies } = require('./../package.json');

  const { errors, warnings } = esbuild.buildSync({
    entryPoints: [file],
    bundle: true,
    minify: true,
    format: format,
    outfile: file.replace(/\.js$/, '.min.js'),
    external: Object.keys(peerDependencies).reduce((acc, dep) => [...acc, dep, `${dep}/*`], [])
  });

  errors.forEach(console.error);
  warnings.forEach(console.warn);
}

