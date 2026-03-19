import resolve from '@rollup/plugin-node-resolve';

// Generate timestamp in dd-mmm-yyyy HH:mm format
const now = new Date();
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const timestamp = [
  String(now.getDate()).padStart(2, '0'),
  months[now.getMonth()],
  now.getFullYear()
].join('-') + ' ' + [
  String(now.getHours()).padStart(2, '0'),
  String(now.getMinutes()).padStart(2, '0')
].join(':');

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/ha-weather-heatmap-card.js',
    format: 'es',
    sourcemap: false,
    banner: `/* Last modified: ${timestamp} */`,
  },
  plugins: [
    resolve(),
  ],
};
