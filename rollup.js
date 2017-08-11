const path = require('path');
const rollup = require('rollup');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');

const entry = 'src/index.js';
const external = path.resolve(entry);
const moduleName = 'khufu-routing';

const plugins = [
  babel({
    "presets": [ "es2015-rollup", "stage-0" ],
    "plugins": [
      "babel-plugin-transform-object-rest-spread",
      ["transform-es2015-classes", { "loose": true }],
    ],
    "babelrc": false
  }),
  commonjs(),
];

rollup.rollup({
    entry: entry,
    external: external,
    plugins: plugins,
})
.then((bundle) => bundle.write({
    format: 'umd',
    moduleName: moduleName,
    dest: 'lib/khufu-routing.js',
  }),
  (error) => {
    console.error(error)
  }
);
