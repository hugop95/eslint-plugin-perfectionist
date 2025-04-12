import { builtinModules } from 'node:module'

import type { ReadClosestTsConfigByPathValue } from './read-closest-ts-config-by-path'
import type { RegexOption } from '../../types/common-options'
import type { Selector } from './types'

import { getTypescriptImport } from './get-typescript-import'
import { matches } from '../../utils/matches'

type CommonSelector = Extract<
  Selector,
  | 'internal'
  | 'external'
  | 'sibling'
  | 'builtin'
  | 'subpath'
  | 'parent'
  | 'index'
>

export let computeCommonSelectors = ({
  tsConfigOutput,
  filename,
  options,
  name,
}: {
  options: {
    internalPattern: RegexOption[]
    environment: 'node' | 'bun'
  }
  tsConfigOutput: ReadClosestTsConfigByPathValue | null
  filename: string
  name: string
}): CommonSelector[] => {
  let matchesInternalPattern = (value: string): boolean | number =>
    options.internalPattern.some(pattern => matches(value, pattern))

  let internalExternalGroup = matchesInternalPattern(name)
    ? 'internal'
    : getInternalOrExternalGroup({
        tsConfigOutput,
        filename,
        name,
      })

  let commonSelectors: CommonSelector[] = []

  if (isIndex(name)) {
    commonSelectors.push('index')
  }

  if (isSibling(name)) {
    commonSelectors.push('sibling')
  }

  if (isParent(name)) {
    commonSelectors.push('parent')
  }

  if (isSubpath(name)) {
    commonSelectors.push('subpath')
  }

  if (internalExternalGroup === 'internal') {
    commonSelectors.push('internal')
  }

  if (isCoreModule(name, options.environment)) {
    commonSelectors.push('builtin')
  }

  if (internalExternalGroup === 'external') {
    commonSelectors.push('external')
  }

  return commonSelectors
}

let bunModules = new Set([
  'detect-libc',
  'bun:sqlite',
  'bun:test',
  'bun:wrap',
  'bun:ffi',
  'bun:jsc',
  'undici',
  'bun',
  'ws',
])
let nodeBuiltinModules = new Set(builtinModules)
let builtinPrefixOnlyModules = new Set(['node:sqlite', 'node:test', 'node:sea'])
let isCoreModule = (value: string, environment: 'node' | 'bun'): boolean => {
  let valueToCheck = value.startsWith('node:') ? value.split('node:')[1] : value
  return (
    (!!valueToCheck && nodeBuiltinModules.has(valueToCheck)) ||
    builtinPrefixOnlyModules.has(value) ||
    (environment === 'bun' ? bunModules.has(value) : false)
  )
}

let isParent = (value: string): boolean => value.startsWith('..')

let isSibling = (value: string): boolean => value.startsWith('./')

let isSubpath = (value: string): boolean => value.startsWith('#')

let isIndex = (value: string): boolean =>
  [
    './index.d.js',
    './index.d.ts',
    './index.js',
    './index.ts',
    './index',
    './',
    '.',
  ].includes(value)

let getInternalOrExternalGroup = ({
  tsConfigOutput,
  filename,
  name,
}: {
  tsConfigOutput: ReadClosestTsConfigByPathValue | null
  filename: string
  name: string
}): 'internal' | 'external' | null => {
  let typescriptImport = getTypescriptImport()
  if (!typescriptImport) {
    return !name.startsWith('.') && !name.startsWith('/') ? 'external' : null
  }

  let isRelativeImport = typescriptImport.isExternalModuleNameRelative(name)
  if (isRelativeImport) {
    return null
  }
  if (!tsConfigOutput) {
    return 'external'
  }

  let resolution = typescriptImport.resolveModuleName(
    name,
    filename,
    tsConfigOutput.compilerOptions,
    typescriptImport.sys,
    tsConfigOutput.cache,
  )
  // If the module can't be resolved, assume it is external.
  if (typeof resolution.resolvedModule?.isExternalLibraryImport !== 'boolean') {
    return 'external'
  }

  return resolution.resolvedModule.isExternalLibraryImport
    ? 'external'
    : 'internal'
}
