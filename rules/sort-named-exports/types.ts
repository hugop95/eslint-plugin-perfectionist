import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESTree } from '@typescript-eslint/types'

import type {
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CustomGroupsOption,
  CommonOptions,
  GroupsOptions,
  RegexOption,
} from '../../types/common-options'
import type { JoinWithDash } from '../../types/join-with-dash'
import type { SortingNode } from '../../types/sorting-node'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
  REGEX_JSON_SCHEMA,
} from '../../utils/common-json-schemas'

export type Options = Partial<
  {
    /**
     * @deprecated for {@link `groups`}
     */
    groupKind: 'values-first' | 'types-first' | 'mixed'
    customGroups: CustomGroupsOption<SingleCustomGroup>
    partitionByComment: PartitionByCommentOption
    newlinesBetween: NewlinesBetweenOption
    groups: GroupsOptions<Group>
    partitionByNewLine: boolean
    ignoreAlias: boolean
  } & CommonOptions
>[]

export interface SortNamedExportsSortingNode
  extends SortingNode<TSESTree.ExportSpecifier> {
  groupKind: 'value' | 'type'
}

export type SingleCustomGroup = {
  modifiers?: Modifier[]
  selector?: Selector
} & {
  elementNamePattern?: RegexOption
}

export type Modifier = ValueModifier | TypeModifier

export type Selector = ExportSelector

type ExportGroup = JoinWithDash<[ValueModifier, TypeModifier, ExportSelector]>

type Group = ExportGroup | 'unknown' | string

type ExportSelector = 'export'

type ValueModifier = 'value'

type TypeModifier = 'type'

export const ALL_SELECTORS: Selector[] = ['export']
export const ALL_MODIFIERS: Modifier[] = ['value', 'type']

export const SINGLE_CUSTOM_GROUP_JSON_SCHEMA: Record<string, JSONSchema4> = {
  modifiers: buildCustomGroupModifiersJsonSchema(ALL_MODIFIERS),
  selector: buildCustomGroupSelectorJsonSchema(ALL_SELECTORS),
  elementNamePattern: REGEX_JSON_SCHEMA,
}
