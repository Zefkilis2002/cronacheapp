const fs = require('node:fs');
const path = require('node:path');

const source = path.dirname(require.resolve('@mediapipe/tasks-vision'));
const target = path.resolve(__dirname, '../public/vendor/mediapipe');
fs.mkdirSync(target, { recursive: true });
fs.copyFileSync(path.join(source, 'vision_bundle.mjs'), path.join(target, 'vision_bundle.mjs'));
fs.cpSync(path.join(source, 'wasm'), path.join(target, 'wasm'), { recursive: true });
