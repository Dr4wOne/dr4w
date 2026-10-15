// Bundles a project's Lambda entrypoints (run from apps/<p>/api):
//   src/lambda.ts and src/handlers/*.ts  →  dist/<name>.mjs
import { existsSync, readdirSync, rmSync } from 'node:fs'
import { build } from 'esbuild'

const entryPoints = ['src/lambda.ts']
if (existsSync('src/handlers')) {
  for (const f of readdirSync('src/handlers')) {
    if (f.endsWith('.ts') && !f.endsWith('.test.ts')) entryPoints.push(`src/handlers/${f}`)
  }
}

rmSync('dist', { recursive: true, force: true })
await build({
  entryPoints,
  outdir: 'dist',
  outExtension: { '.js': '.mjs' },
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  minify: true,
  sourcemap: true,
  legalComments: 'none',
  // Some bundled CJS deps (AWS SDK) still call require(); give ESM output a real one.
  banner: {
    js: "import{createRequire}from'node:module';const require=createRequire(import.meta.url);",
  },
})
console.info(`Built ${entryPoints.length} Lambda entrypoint(s) → dist/`)
