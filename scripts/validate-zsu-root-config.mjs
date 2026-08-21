import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')
const configPath = resolve(repositoryRoot, 'config/zsu-root-targets.json')
const config = JSON.parse(readFileSync(configPath, 'utf8'))
const failures = []

if (config.schemaVersion !== 1) {
  failures.push('schemaVersion must be 1')
}

if (config.rootIntegration?.repository !== 'Only7rb-coder/zsu') {
  failures.push('rootIntegration.repository must reference the ZSU source repository')
}

if (config.rootIntegration?.managerPackage !== 'com.zsu.zsu') {
  failures.push('rootIntegration.managerPackage must be com.zsu.zsu')
}

const ids = new Set()
for (const target of config.targets ?? []) {
  if (!/^android\d+-\d+\.\d+$/.test(target.id ?? '')) {
    failures.push(`invalid target id: ${target.id}`)
  }
  if (ids.has(target.id)) {
    failures.push(`duplicate target id: ${target.id}`)
  }
  ids.add(target.id)

  if (!Number.isInteger(target.android) || !/^\d+\.\d+$/.test(target.kmi ?? '')) {
    failures.push(`invalid Android/KMI pair for ${target.id}`)
  }

  const workflowPath = resolve(repositoryRoot, '.github/workflows', target.workflow ?? '')
  if (!existsSync(workflowPath)) {
    failures.push(`missing workflow for ${target.id}: ${target.workflow}`)
  }
}

if ((config.targets ?? []).length < 1) {
  failures.push('at least one build target is required')
}

if (failures.length > 0) {
  console.error('ZSU-root configuration validation failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`Validated ${config.targets.length} ZSU-root build targets.`)
