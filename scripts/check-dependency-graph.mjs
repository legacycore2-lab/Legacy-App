import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, extname, relative, resolve } from 'node:path'

const root = resolve('src')
const entrypoint = 'main.tsx'
const sourceExtensions = ['.ts', '.tsx']
const ignoredSuffixes = ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx', '.d.ts']
const files = new Map()

function normalize(path) {
  return path.replaceAll('\\', '/')
}

function isIgnored(path) {
  return ignoredSuffixes.some((suffix) => path.endsWith(suffix))
}

function walk(directory) {
  for (const name of readdirSync(directory)) {
    const absolutePath = resolve(directory, name)
    if (statSync(absolutePath).isDirectory()) {
      walk(absolutePath)
      continue
    }

    const path = normalize(relative(root, absolutePath))
    if (!sourceExtensions.includes(extname(name)) || isIgnored(path)) continue
    files.set(path, readFileSync(absolutePath, 'utf8'))
  }
}

const importPatterns = [
  /(?:import|export)\s+(?:type\s+)?(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g,
  /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
]

function extractImports(source) {
  const imports = new Set()
  for (const pattern of importPatterns) {
    for (const match of source.matchAll(pattern)) imports.add(match[1])
  }
  return [...imports]
}

function resolveLocalImport(fromPath, value) {
  if (!value.startsWith('.')) return null

  const base = normalize(relative(root, resolve(root, dirname(fromPath), value)))
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]

  return candidates.find((candidate) => files.has(candidate)) ?? null
}

walk(root)

if (!files.has(entrypoint)) {
  console.error(`Dependency graph entrypoint not found: src/${entrypoint}`)
  process.exit(1)
}

const graph = new Map()
for (const [path, source] of files) {
  const dependencies = extractImports(source)
    .map((value) => resolveLocalImport(path, value))
    .filter(Boolean)
  graph.set(path, [...new Set(dependencies)])
}

const reachable = new Set()
function visitReachable(path) {
  if (reachable.has(path)) return
  reachable.add(path)
  for (const dependency of graph.get(path) ?? []) visitReachable(dependency)
}
visitReachable(entrypoint)

const orphanFiles = [...files.keys()].filter((path) => !reachable.has(path)).sort()

const state = new Map()
const stack = []
const cycles = new Set()

function canonicalCycle(nodes) {
  const cycle = nodes.slice(0, -1)
  const rotations = cycle.map((_, index) => [...cycle.slice(index), ...cycle.slice(0, index)])
  const canonical = rotations.map((rotation) => rotation.join(' -> ')).sort()[0]
  return `${canonical} -> ${canonical.split(' -> ')[0]}`
}

function visitCycles(path) {
  const currentState = state.get(path) ?? 0
  if (currentState === 2) return
  if (currentState === 1) {
    const cycleStart = stack.indexOf(path)
    if (cycleStart >= 0) cycles.add(canonicalCycle([...stack.slice(cycleStart), path]))
    return
  }

  state.set(path, 1)
  stack.push(path)
  for (const dependency of graph.get(path) ?? []) visitCycles(dependency)
  stack.pop()
  state.set(path, 2)
}

for (const path of files.keys()) visitCycles(path)

console.log(`Dependency graph scanned ${files.size} source files.`)
console.log(`Reachable from src/${entrypoint}: ${reachable.size}.`)

if (orphanFiles.length) {
  console.log(`Orphan candidates (${orphanFiles.length}):`)
  for (const path of orphanFiles) console.log(`- src/${path}`)
} else {
  console.log('No orphan source files found.')
}

if (cycles.size) {
  console.error(`Circular dependencies found (${cycles.size}):`)
  for (const cycle of [...cycles].sort()) console.error(`- ${cycle}`)
  process.exit(1)
}

console.log('No circular dependencies found.')
