import { spawn } from 'node:child_process'

const node = process.execPath
const cwd = process.cwd()

const run = (name, args, env = {}) => {
  const child = spawn(node, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: 'inherit',
  })
  child.on('exit', (code, signal) => {
    const msg = signal ? `signal ${signal}` : `code ${code}`
    console.log(`[${name}] exited with ${msg}`)
  })
  return child
}

const server = run('server', ['./node_modules/tsx/dist/cli.mjs', 'server/server.ts'], {
  NODE_ENV: 'development',
})

const client = run(
  'client',
  [
    '--max-old-space-size=4096',
    './node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    '5174',
    '--strictPort',
  ],
  { NODE_ENV: 'development' },
)

const shutdown = (code = 0) => {
  try {
    server.kill('SIGTERM')
  } catch {}
  try {
    client.kill('SIGTERM')
  } catch {}
  setTimeout(() => process.exit(code), 250)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

setInterval(() => {}, 1000)
