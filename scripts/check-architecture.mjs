import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'

const root = resolve('src')
const files = []
const violations = new Set()

const sourceFilePattern = /\.(ts|tsx)$/
const testFilePattern = /\.(test|spec)\.(ts|tsx)$/
const importPatterns = [
  /(?:import|export)\s+(?:type\s+)?(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g,
  /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
]

function normalizePath(path) {
  return path.replaceAll('\\', '/')
}

function walk(directory) {
  for (const name of readdirSync(directory)) {
    const path = resolve(directory, name)
    if (statSync(path).isDirectory()) {
      walk(path)
      continue
    }

    if (sourceFilePattern.test(name) && !testFilePattern.test(name)) files.push(path)
  }
}

function extractImports(source) {
  const imports = new Set()

  for (const pattern of importPatterns) {
    for (const match of source.matchAll(pattern)) imports.add(match[1])
  }

  return [...imports]
}

function resolveImportPath(file, value) {
  return value.startsWith('.')
    ? normalizePath(relative(root, resolve(dirname(file), value)))
    : value
}

function isLayer(path, layer) {
  return new RegExp(`/(?:${layer})/`).test(`/${path}`)
}

function report(message) {
  violations.add(message)
}

walk(root)

for (const file of files) {
  const path = normalizePath(relative(root, file))
  const source = readFileSync(file, 'utf8')
  const imports = extractImports(source)
  const resolvedImports = imports.map((value) => ({ value, targetPath: resolveImportPath(file, value) }))

  for (const { value, targetPath } of resolvedImports) {
    if (isLayer(path, 'components|pages|providers')) {
      if (
        isLayer(targetPath, 'services|repositories') ||
        targetPath.startsWith('lib/supabase') ||
        value.startsWith('@supabase/')
      ) {
        report(`${path}: UI must use Hooks, not Service/Repository/Supabase (${value})`)
      }
    }

    if (isLayer(path, 'hooks')) {
      if (
        isLayer(targetPath, 'repositories') ||
        targetPath.startsWith('lib/supabase') ||
        value.startsWith('@supabase/')
      ) {
        report(`${path}: Hook must use Service, not Repository/Supabase (${value})`)
      }
    }

    if (isLayer(path, 'services')) {
      if (
        value.startsWith('@supabase/') ||
        targetPath.startsWith('lib/supabase') ||
        isLayer(targetPath, 'components|pages|hooks|providers')
      ) {
        report(`${path}: Service must stay independent from UI and Supabase SDK (${value})`)
      }
    }

    if (isLayer(path, 'repositories')) {
      if (isLayer(targetPath, 'components|pages|hooks|providers|services')) {
        report(`${path}: Repository must not depend on upper layers (${value})`)
      }
    }

    if (
      value.startsWith('@supabase/') &&
      !isLayer(path, 'repositories') &&
      !path.startsWith('lib/supabase/')
    ) {
      report(`${path}: Supabase SDK is restricted to Repository/Infrastructure (${value})`)
    }
  }

  if (isLayer(path, 'components|pages|providers') && source.includes('.reduce(')) {
    report(`${path}: UI must receive calculated aggregates from Hook/Service`)
  }

  if (
    /\bsupabase\s*\./.test(source) &&
    !isLayer(path, 'repositories') &&
    !path.startsWith('lib/supabase/')
  ) {
    report(`${path}: direct Supabase client usage is restricted to Repository/Infrastructure`)
  }

  const feature = path.match(/^features\/([^/]+)\//)?.[1]
  if (feature) {
    for (const { value, targetPath } of resolvedImports) {
      const target = targetPath.match(/^features\/([^/]+)/)?.[1]
      if (target && target !== feature) {
        report(`${path}: cross-feature internal import (${value})`)
      }
    }
  }
}

if (violations.size) {
  console.error([...violations].sort().join('\n'))
  process.exit(1)
}

console.log(`Architecture boundaries passed for ${files.length} source files.`)
