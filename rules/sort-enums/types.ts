import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CustomGroupsOption,
  CommonOptions,
  GroupsOptions,
  RegexOption,
} from '../../types/common-options'

import { REGEX_JSON_SCHEMA } from '../../utils/common-json-schemas'

export type Options = Partial<
  {
    customGroups: CustomGroupsOption<SingleCustomGroup>
    partitionByComment: PartitionByCommentOption
    newlinesBetween: NewlinesBetweenOption
    groups: GroupsOptions<Group>
    partitionByNewLine: boolean
    forceNumericSort: boolean
    sortByValue: boolean
  } & CommonOptions
>[]

export interface SingleCustomGroup {
  elementValuePattern?: RegexOption
  elementNamePattern?: RegexOption
}

type Group = 'unknown' | string

export const SINGLE_CUSTOM_GROUP_JSON_SCHEMA: Record<string, JSONSchema4> = {
  elementValuePattern: REGEX_JSON_SCHEMA,
  elementNamePattern: REGEX_JSON_SCHEMA,
}
