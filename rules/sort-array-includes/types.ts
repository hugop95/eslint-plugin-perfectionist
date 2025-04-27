import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CustomGroupsOption,
  CommonOptions,
  GroupsOptions,
  RegexOption,
} from '../../types/common-options'

import {
  buildCustomGroupSelectorJsonSchema,
  REGEX_JSON_SCHEMA,
} from '../../utils/common-json-schemas'

export type Options = Partial<
  {
    useConfigurationIf: {
      allNamesMatchPattern?: RegexOption
    }
    /**
     * @deprecated for {@link `groups`}
     */
    groupKind: 'literals-first' | 'spreads-first' | 'mixed'
    customGroups: CustomGroupsOption<SingleCustomGroup>
    partitionByComment: PartitionByCommentOption
    newlinesBetween: NewlinesBetweenOption
    groups: GroupsOptions<Group>
    partitionByNewLine: boolean
  } & CommonOptions
>[]

export interface SingleCustomGroup {
  elementNamePattern?: RegexOption
  selector?: Selector
}

export type Selector = LiteralSelector | SpreadSelector

type LiteralSelector = 'literal'

type Group = 'unknown' | string

type SpreadSelector = 'spread'

export const ALL_SELECTORS: Selector[] = ['literal', 'spread']

export const SINGLE_CUSTOM_GROUP_JSON_SCHEMA: Record<string, JSONSchema4> = {
  selector: buildCustomGroupSelectorJsonSchema(ALL_SELECTORS),
  elementNamePattern: REGEX_JSON_SCHEMA,
}
