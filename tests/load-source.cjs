const fs = require('node:fs');
const path = require('node:path');
const { transformSync } = require('@babel/core');

// Executa o código real com adaptadores explícitos, sem iniciar React Native.
exports.loadSource = (relativePath, mocks = {}) => {
  const filename = path.resolve(__dirname, '..', relativePath);
  const { code } = transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, configFile: false, babelrc: false,
    plugins: ['@babel/plugin-transform-modules-commonjs', '@babel/plugin-transform-react-jsx'],
  });
  const module = { exports: {} };
  const load = (name) => {
    if (Object.prototype.hasOwnProperty.call(mocks, name)) return mocks[name];
    throw new Error(`Dependência não simulada: ${name} em ${relativePath}`);
  };
  new Function('require', 'module', 'exports', code)(load, module, module.exports);
  return module.exports;
};
