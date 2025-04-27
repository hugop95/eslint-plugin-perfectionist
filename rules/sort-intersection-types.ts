import type { Options as SortUnionTypesOptions } from './sort-union-types/types'

import {
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { sortUnionOrIntersectionTypes, JSON_SCHEMA } from './sort-union-types'
import { createEslintRule } from '../utils/create-eslint-rule'

type MESSAGE_ID =
  | 'missedSpacingBetweenIntersectionTypes'
  | 'unexpectedIntersectionTypesGroupOrder'
  | 'extraSpacingBetweenIntersectionTypes'
  | 'unexpectedIntersectionTypesOrder'

type Options = SortUnionTypesOptions

const DEFAULT_OPTIONS: Required<Options[0]> = {
  fallbackSort: { type: 'unsorted' },
  specialCharacters: 'keep',
  newlinesBetween: 'ignore',
  partitionByComment: false,
  partitionByNewLine: false,
  type: 'alphabetical',
  ignoreCase: true,
  locales: 'en-US',
  customGroups: [],
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options, MESSAGE_ID>({
  meta: {
    messages: {
      missedSpacingBetweenIntersectionTypes: MISSED_SPACING_ERROR,
      extraSpacingBetweenIntersectionTypes: EXTRA_SPACING_ERROR,
      unexpectedIntersectionTypesGroupOrder: GROUP_ORDER_ERROR,
      unexpectedIntersectionTypesOrder: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-intersection-types',
      description: 'Enforce sorted intersection types.',
      recommended: true,
    },
    schema: [JSON_SCHEMA],
    type: 'suggestion',
    fixable: 'code',
  },
  create: context => ({
    TSIntersectionType: node => {
      sortUnionOrIntersectionTypes({
        availableMessageIds: {
          missedSpacingBetweenMembers: 'missedSpacingBetweenIntersectionTypes',
          extraSpacingBetweenMembers: 'extraSpacingBetweenIntersectionTypes',
          unexpectedGroupOrder: 'unexpectedIntersectionTypesGroupOrder',
          unexpectedOrder: 'unexpectedIntersectionTypesOrder',
        },
        tokenValueToIgnoreBefore: '&',
        context,
        node,
      })
    },
  }),
  defaultOptions: [DEFAULT_OPTIONS],
  name: 'sort-intersection-types',
})
