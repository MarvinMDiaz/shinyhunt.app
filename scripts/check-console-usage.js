#!/usr/bin/env node

/**
 * Console Usage Checker
 * 
 * Verifies that no raw console.* calls exist in src/ except in logger.ts
 * This script should be run as part of CI/CD or pre-commit hooks
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')
const srcDir = join(projectRoot, 'src')

const ALLOWED_FILES = [
  'src/lib/logger.ts', // Logger implementation is allowed
]

const CONSOLE_PATTERN = /console\.(log|debug|info|warn|error)\s*\(/g

function getAllFiles(dir, fileList = []) {
  const files = readdirSync(dir)
  
  files.forEach(file => {
    const filePath = join(dir, file)
    const stat = statSync(filePath)
    
    if (stat.isDirectory()) {
      // Skip node_modules and dist
      if (file !== 'node_modules' && file !== 'dist') {
        getAllFiles(filePath, fileList)
      }
    } else if (stat.isFile()) {
      const ext = extname(file)
      if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx') {
        fileList.push(filePath)
      }
    }
  })
  
  return fileList
}

function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const relativePath = filePath.replace(projectRoot + '/', '')
  
  // Skip allowed files
  if (ALLOWED_FILES.some(allowed => relativePath.includes(allowed))) {
    return []
  }
  
  const matches = []
  let match
  
  // Reset regex
  CONSOLE_PATTERN.lastIndex = 0
  
  while ((match = CONSOLE_PATTERN.exec(content)) !== null) {
    // Get line number
    const linesBeforeMatch = content.substring(0, match.index).split('\n')
    const lineNumber = linesBeforeMatch.length
    
    matches.push({
      file: relativePath,
      line: lineNumber,
      match: match[0],
      context: linesBeforeMatch[linesBeforeMatch.length - 1].trim(),
    })
  }
  
  return matches
}

function main() {
  console.log('🔍 Checking for raw console usage...\n')
  
  const files = getAllFiles(srcDir)
  const violations = []
  
  files.forEach(file => {
    const matches = checkFile(file)
    violations.push(...matches)
  })
  
  if (violations.length > 0) {
    console.error('❌ Found raw console usage violations:\n')
    violations.forEach(v => {
      console.error(`  ${v.file}:${v.line}`)
      console.error(`    ${v.match}`)
      console.error(`    Context: ${v.context}\n`)
    })
    console.error(`\nTotal violations: ${violations.length}`)
    console.error('\n⚠️  All console usage must go through logger.ts')
    console.error('   Use: import { logger } from "@/lib/logger"')
    console.error('   Then: logger.error(), logger.warn(), etc.\n')
    process.exit(1)
  } else {
    console.log('✅ No raw console usage found (except in logger.ts)')
    console.log('✅ All logging goes through safe logger\n')
    process.exit(0)
  }
}

main()
