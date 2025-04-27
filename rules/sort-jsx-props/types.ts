import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
  DeprecatedCustomGroupsOption,
  NewlinesBetweenOption,
  CustomGroupsOption,
  CommonOptions,
  GroupsOptions,
  RegexOption,
} from '../../types/common-options'
import type { JoinWithDash } from '../../types/join-with-dash'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
  REGEX_JSON_SCHEMA,
} from '../../utils/common-json-schemas'

export type Options = Partial<
  {
    useConfigurationIf: {
      allNamesMatchPattern?: RegexOption
      tagMatchesPattern?: RegexOption
    }
    customGroups:
      | CustomGroupsOption<SingleCustomGroup>
      | DeprecatedCustomGroupsOption
    newlinesBetween: NewlinesBetweenOption
    groups: GroupsOptions<Group>
    partitionByNewLine: boolean
    /**
     * @deprecated for {@link `useConfigurationIf.tagMatchesPattern`}
     */
    ignorePattern: RegexOption
  } & CommonOptions
>[]

export interface SingleCustomGroup {
  elementValuePattern?: RegexOption
  elementNamePattern?: RegexOption
  modifiers?: Modifier[]
  selector?: Selector
}

export type Selector = MultilineSelector | ShorthandSelector | PropertySelector

export type Modifier = MultilineModifier | ShorthandModifier

type PropertyGroup = JoinWithDash<
  [ShorthandModifier, MultilineModifier, PropertySelector]
>

/**
 * Only used in code, so I don't know if it's worth maintaining this.
 */
type Group =
  | ShorthandGroup
  | MultilineGroup
  | PropertyGroup
  | 'unknown'
  | string

/**
 * @deprecated For {@link `MultilineModifier`}
 */
type MultilineGroup = JoinWithDash<[MultilineSelector]>

/**
 * @deprecated For {@link `ShorthandModifier`}
 */
type ShorthandGroup = JoinWithDash<[ShorthandSelector]>

/**
 * @deprecated For {@link `ShorthandModifier`}
 */
type ShorthandSelector = 'shorthand'

/**
 * @deprecated For {@link `MultilineModifier`}
 */
type MultilineSelector = 'multiline'

type MultilineModifier = 'multiline'

type ShorthandModifier = 'shorthand'

type PropertySelector = 'prop'

export const ALL_SELECTORS: Selector[] = ['multiline', 'prop', 'shorthand']

export const ALL_MODIFIERS: Modifier[] = ['shorthand', 'multiline']

export const SINGLE_CUSTOM_GROUP_JSON_SCHEMA: Record<string, JSONSchema4> = {
  modifiers: buildCustomGroupModifiersJsonSchema(ALL_MODIFIERS),
  selector: buildCustomGroupSelectorJsonSchema(ALL_SELECTORS),
  elementValuePattern: REGEX_JSON_SCHEMA,
  elementNamePattern: REGEX_JSON_SCHEMA,
}
