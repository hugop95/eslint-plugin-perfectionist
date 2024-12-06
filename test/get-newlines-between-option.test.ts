import { describe, expect, it } from 'vitest'

import type { SortingNode } from '../types/sorting-node'

import { getNewlinesBetweenOption } from '../utils/get-newlines-between-option'

describe('get-newlines-between-option', () => {
  describe('global "newlinesBetween" option', () => {
    it('should return the global "newlinesBetween" option if "customGroups" is not an array', () => {
      expect(
        getNewlinesBetweenOption({
          options: {
            newlinesBetween: 'ignore',
            customGroups: {},
            groups: [],
          },
          nextSortingNode: generateSortingNodeWithGroup('unknown'),
          sortingNode: generateSortingNodeWithGroup('unknown'),
        }),
      ).toBe('ignore')
    })

    it('should return "ignore" if "newlinesBetween" is "ignore"', () => {
      expect(
        getNewlinesBetweenOption({
          options: {
            newlinesBetween: 'ignore',
            groups: [],
          },
          nextSortingNode: generateSortingNodeWithGroup('unknown'),
          sortingNode: generateSortingNodeWithGroup('unknown'),
        }),
      ).toBe('ignore')
    })

    it('should return "never" if "newlinesBetween" is "never"', () => {
      expect(
        getNewlinesBetweenOption({
          options: {
            newlinesBetween: 'never',
            groups: [],
          },
          nextSortingNode: generateSortingNodeWithGroup('unknown'),
          sortingNode: generateSortingNodeWithGroup('unknown'),
        }),
      ).toBe('never')
    })

    it('should return "always" if "newlinesBetween" is "always" and nodeGroupNumber !== nextNodeGroupNumber', () => {
      expect(
        getNewlinesBetweenOption({
          options: {
            newlinesBetween: 'always',
            groups: ['a', 'b'],
          },
          nextSortingNode: generateSortingNodeWithGroup('a'),
          sortingNode: generateSortingNodeWithGroup('b'),
        }),
      ).toBe('always')
    })

    it('should return "never" if "newlinesBetween" is "always" and nodeGroupNumber === nextNodeGroupNumber', () => {
      expect(
        getNewlinesBetweenOption({
          options: {
            newlinesBetween: 'always',
            groups: [],
          },
          nextSortingNode: generateSortingNodeWithGroup('unknown'),
          sortingNode: generateSortingNodeWithGroup('unknown'),
        }),
      ).toBe('never')
    })
  })

  let generateSortingNodeWithGroup = (group: string): SortingNode =>
    ({
      group,
    }) as SortingNode
})
