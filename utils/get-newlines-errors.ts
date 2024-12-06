import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../typings'

import { getNewlinesBetweenOption } from './get-newlines-between-option'
import { getLinesBetween } from './get-lines-between'

interface GetNewlinesErrorsParameters<T extends string> {
  sourceCode: TSESLint.SourceCode
  missedSpacingError: T
  extraSpacingError: T
  right: SortingNode
  left: SortingNode
  options: Options
  rightNum: number
  leftNum: number
}

interface CustomGroup {
  newlinesInside?: 'ignore' | 'always' | 'never'
  newlinesAbove?: 'ignore' | 'always' | 'never'
  newlinesBelow?: 'ignore' | 'always' | 'never'
  groupName: string
}

interface Options {
  customGroups?: Record<string, string[] | string> | CustomGroup[]
  newlinesBetween: 'ignore' | 'always' | 'never'
  groups: (string[] | string)[]
}

export let getNewlinesErrors = <T extends string>({
  missedSpacingError,
  extraSpacingError,
  sourceCode,
  rightNum,
  leftNum,
  options,
  right,
  left,
}: GetNewlinesErrorsParameters<T>): T[] => {
  let newlinesBetween = getNewlinesBetweenOption({
    nextSortingNode: right,
    sortingNode: left,
    options,
  })
  let numberOfEmptyLinesBetween = getLinesBetween(sourceCode, left, right)
  switch (newlinesBetween) {
    case 'ignore':
      return []
    case 'never':
      return numberOfEmptyLinesBetween > 0 ? [extraSpacingError] : []
    case 'global_always':
    case 'always':
      if (
        (leftNum < rightNum || newlinesBetween === 'always') &&
        numberOfEmptyLinesBetween === 0
      ) {
        return [missedSpacingError]
      } else if (numberOfEmptyLinesBetween > 1) {
        return [extraSpacingError]
      }
  }
  return []
}
