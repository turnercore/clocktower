import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// This runner always creates an in-memory PostgreSQL instance. It accepts no
// database URL and cannot connect to a hosted Supabase project.
const runtimeDirectory = process.argv[2]
if (!runtimeDirectory) {
  throw new Error('Pass the scratch directory containing @electric-sql/pglite. See supabase/README.md.')
}
const require = createRequire(resolve(runtimeDirectory, 'package.json'))
const { PGlite } = require('@electric-sql/pglite')

async function expandIncludes(file) {
  const lines = (await readFile(file, 'utf8')).split('\n')
  const expanded = []
  for (const line of lines) {
    if (line.startsWith('\\set ')) continue
    if (line.startsWith('\\ir ')) {
      expanded.push(await expandIncludes(resolve(dirname(file), line.slice(4))))
    } else {
      expanded.push(line)
    }
  }
  return expanded.join('\n')
}

const database = new PGlite()
try {
  const file = fileURLToPath(new URL('./run_tower_invitations.sql', import.meta.url))
  const results = await database.exec(await expandIncludes(file))
  const passed = results.flatMap((result) => result.rows).filter((row) => typeof row.test === 'string')
  for (const row of passed) process.stdout.write(`${row.test}\n`)
  process.stdout.write(`\n${passed.length} SQL assertions passed; test transaction rolled back.\n`)
} finally {
  await database.close()
}
