import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import dts from 'rollup-plugin-dts';
import pkg from './package.json' with { type: 'json' };

// Define a base path for the tsconfig to resolve aliases correctly
// This assumes your sdk directory is at the root of where paths like '@/' resolve from
const tsconfigBasePath = '../';

export default [
  // Configuration for JavaScript bundles
  {
    input: 'sdk.ts',
    output: [
      {
        file: 'dist/index.cjs.js',
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        clean: true,
        tsconfigOverride: {
          compilerOptions: {
            baseUrl: tsconfigBasePath,
            declaration: true,
            declarationDir: './dist',
            declarationMap: false,
          },
        },
      }),
    ],
    external: Object.keys(pkg.dependencies || {}).concat(Object.keys(pkg.peerDependencies || {})),
  },
  // Configuration for bundling .d.ts files - RESTORING
  {
    input: 'sdk.ts',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [
      dts({
        compilerOptions: {
          baseUrl: tsconfigBasePath,
          paths: {
            '@/*': ['src/*'],
            '&/*': ['src/lib/*'],
            '~/*': ['./*'],
          },
        },
        // This option helps in resolving relative paths from aliased imports if needed
        // May not be strictly necessary if baseUrl and paths are doing their job.
        // respectExternal: false, // Consider this if types from aliased paths are not bundling.
      }),
    ],
    // Only externalize true npm package dependencies. Aliased local project files should be bundled.
    external: Object.keys(pkg.dependencies || {}).concat(Object.keys(pkg.peerDependencies || {})),
  },
];
