const fs = require('fs');
const { resolvePath, buildPath } = require('./const');

fs.copyFileSync(resolvePath('README.md'), `${buildPath}/README.md`)
