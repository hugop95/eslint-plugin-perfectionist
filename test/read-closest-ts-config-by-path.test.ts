import type { Diagnostic } from 'typescript'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import path from 'node:path'
import ts from 'typescript'

import type { readClosestTsConfigByPath as testedFunction } from '../utils/read-closest-ts-config-by-path'

// Heavily inspired from https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/typescript-estree/tests/lib/getProjectConfigFiles.test.ts

const mockExistsSync = vi.fn()
vi.mock('node:fs', () => ({
  existsSync: (filePath: string): boolean => mockExistsSync(filePath),
}))

const mockConvertCompilerOptionsFromJson = vi.fn()
const mockReadConfigFile = vi.fn()
const mockParseJsonConfigFileContent = vi.fn()
vi.mock('node:module', _ => ({
  createRequire: () => () => ({
    readConfigFile: (filePath: string): ts.ParsedCommandLine =>
      mockReadConfigFile(filePath),
    parseJsonConfigFileContent: (content: object): ts.ParsedCommandLine =>
      mockParseJsonConfigFileContent(content),
    convertCompilerOptionsFromJson: (content: object) =>
      mockConvertCompilerOptionsFromJson(content),
    createModuleResolutionCache: () => vi.fn(),
    sys: ts.sys,
  }),
}))

const mockGetTypescriptImport = vi.fn()
vi.mock('../utils/get-typescript-import', () => ({
  getTypescriptImport: () => mockGetTypescriptImport(),
}))

const testInput = {
  filePath: './repos/repo/packages/package/file.ts',
  tsconfigRootDir: './repos/repo',
  contextCwd: './',
}

const tsConfigContent = {
  raw: {
    config: {
      compilerOptions: {
        baseUrl: './packages/package',
      },
    },
  },
} as const

describe('readClosestTsConfigByPath', () => {
  let readClosestTsConfigByPath: typeof testedFunction

  beforeEach(async () => {
    ;({ readClosestTsConfigByPath } = await import(
      '../utils/read-closest-ts-config-by-path'
    ))
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns null when typescript is not present', () => {
    mockGetTypescriptImport.mockReturnValue(null)

    let expectedConfig = readClosestTsConfigByPath(testInput)

    expect(expectedConfig).toBeNull()
    expect(mockExistsSync).toHaveBeenCalledTimes(0)
  })

  describe('with typescript present', () => {
    beforeEach(async () => {
      let actualGetTypescriptImport = await vi.importActual(
        '../utils/get-typescript-import',
      )
      mockGetTypescriptImport.mockImplementation(
        actualGetTypescriptImport.getTypescriptImport as never,
      )
    })

    it("throws an error if the config can't be read", async () => {
      mockExistsSync.mockReturnValue(true)
      mockReadConfigFileReturnValue({
        error: {
          code: 1,
        } as Diagnostic,
      })

      expect(() =>
        readClosestTsConfigByPath(testInput),
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: Error reading tsconfig file: {"code":1}]`,
      )
    })

    it("throws an error if the compiler options can't be converted", async () => {
      mockExistsSync.mockReturnValue(true)
      mockReadConfigFileReturnValue()
      mockParseJsonConfigFileContentReturnValue()
      mockConvertCompilerOptionsFromJson.mockReturnValue({
        errors: [{ code: 1 }] as Diagnostic[],
      })

      expect(() =>
        readClosestTsConfigByPath(testInput),
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: Error getting compiler options: [{"code":1}]]`,
      )
    })

    describe('when caching hits', () => {
      it('returns a local tsconfig.json without calling existsSync a second time', () => {
        mockExistsSync.mockReturnValue(true)
        mockReadConfigFileReturnValue()
        mockParseJsonConfigFileContentReturnValue()
        mockConvertCompilerOptionsFromJsonReturnValue()

        readClosestTsConfigByPath(testInput)
        let actual = readClosestTsConfigByPath(testInput)

        expect(actual?.compilerOptions).toEqual(
          tsConfigContent.raw.config.compilerOptions,
        )
        expect(mockExistsSync).toHaveBeenCalledTimes(1)
      })

      it('returns a nearby parent tsconfig.json when it was previously cached by a different directory search', () => {
        mockExistsSync.mockImplementation(
          input => input === path.normalize('a/tsconfig.json'),
        )
        mockReadConfigFileReturnValue()
        mockParseJsonConfigFileContentReturnValue()
        mockConvertCompilerOptionsFromJsonReturnValue()

        // This should call to fs.existsSync three times: c, b, a
        readClosestTsConfigByPath({
          filePath: './a/b/c/d.ts',
          tsconfigRootDir: './a',
          contextCwd: './',
        })

        // This should call to fs.existsSync once: e
        // Then it should retrieve c from cache, pointing to a
        let actual = readClosestTsConfigByPath({
          filePath: './a/b/c/e/f.ts',
          tsconfigRootDir: './a',
          contextCwd: './',
        })

        expect(actual?.compilerOptions).toEqual(
          tsConfigContent.raw.config.compilerOptions,
        )
        expect(mockExistsSync).toHaveBeenCalledTimes(4)
      })

      it('returns a distant parent tsconfig.json when it was previously cached by a different directory search', () => {
        mockExistsSync.mockImplementation(
          input => input === path.normalize('a/tsconfig.json'),
        )
        mockReadConfigFileReturnValue()
        mockParseJsonConfigFileContentReturnValue()
        mockConvertCompilerOptionsFromJsonReturnValue()

        // This should call to fs.existsSync 4 times: d, c, b, a
        readClosestTsConfigByPath({
          filePath: './a/b/c/d/e.ts',
          tsconfigRootDir: './a',
          contextCwd: './',
        })

        // This should call to fs.existsSync 2: g, f
        // Then it should retrieve b from cache, pointing to a
        let actual = readClosestTsConfigByPath({
          filePath: './a/b/f/g/h.ts',
          tsconfigRootDir: './a',
          contextCwd: './',
        })

        expect(actual?.compilerOptions).toEqual(
          tsConfigContent.raw.config.compilerOptions,
        )
        expect(mockExistsSync).toHaveBeenCalledTimes(6)
      })
    })

    describe('when caching misses', () => {
      it('returns a local tsconfig.json when matched', () => {
        mockExistsSync.mockReturnValue(true)
        mockReadConfigFileReturnValue()
        mockParseJsonConfigFileContentReturnValue()
        mockConvertCompilerOptionsFromJsonReturnValue()

        let actual = readClosestTsConfigByPath(testInput)

        expect(actual?.compilerOptions).toEqual(
          tsConfigContent.raw.config.compilerOptions,
        )
      })

      it('returns a parent tsconfig.json when matched', () => {
        mockExistsSync.mockImplementation(
          filePath => filePath === path.normalize('repos/repo/tsconfig.json'),
        )
        mockReadConfigFileReturnValue()
        mockParseJsonConfigFileContentReturnValue()
        mockConvertCompilerOptionsFromJsonReturnValue()

        let actual = readClosestTsConfigByPath(testInput)

        expect(actual?.compilerOptions).toEqual(
          tsConfigContent.raw.config.compilerOptions,
        )
      })

      it('throws when searching hits.', () => {
        mockExistsSync.mockReturnValue(false)
        mockReadConfigFileReturnValue()
        mockParseJsonConfigFileContentReturnValue()

        expect(() =>
          readClosestTsConfigByPath(testInput),
        ).toThrowErrorMatchingInlineSnapshot(
          `[Error: Couldn't find any tsconfig.json relative to './repos/repo/packages/package/file.ts' within './repos/repo'.]`,
        )
      })

      it('throws when searching passes the tsconfigRootDir', () => {
        mockExistsSync.mockReturnValue(false)
        mockReadConfigFileReturnValue()
        mockParseJsonConfigFileContentReturnValue()

        expect(() =>
          readClosestTsConfigByPath({ ...testInput, tsconfigRootDir: '/' }),
        ).toThrowErrorMatchingInlineSnapshot(
          `[Error: Couldn't find any tsconfig.json relative to './repos/repo/packages/package/file.ts' within '/'.]`,
        )
      })
    })

    let mockReadConfigFileReturnValue = (
      value: ReturnType<typeof ts.readConfigFile> = {},
    ) => {
      mockReadConfigFile.mockReturnValue(value)
    }

    let mockParseJsonConfigFileContentReturnValue = () => {
      mockParseJsonConfigFileContent.mockReturnValue(tsConfigContent)
    }

    let mockConvertCompilerOptionsFromJsonReturnValue = () => {
      mockConvertCompilerOptionsFromJson.mockReturnValue({
        options: tsConfigContent.raw.config.compilerOptions,
        errors: [],
      })
    }
  })
})
