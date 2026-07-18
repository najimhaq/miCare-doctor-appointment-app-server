// backend - eslint.config.js
import importPlugin from 'eslint-plugin-import';

export default [
  {
    plugins: { import: importPlugin },
    rules: {
      'import/extensions': [
        'error',
        'ignorePackages', // npm প্যাকেজের জন্য extension চেক করবে না
        {
          js: 'always', // লোকাল ফাইলের জন্য সবসময় .js লিখতে হবে
          ts: 'always',
          tsx: 'always',
        },
      ],
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.ts', '.tsx'],
        },
      },
    },
  },
];
