import type {
  DeprecatedCustomGroupsOption,
  PartitionByCommentOption,
  SpecialCharactersOption,
  NewlinesBetweenOption,
  FallbackSortOption,
  GroupsOptions,
  OrderOption,
  RegexOption,
  TypeOption,
} from '../../types/common-options'
import type { JoinWithDash } from '../../types/join-with-dash'
import type { SortingNode } from '../../types/sorting-node'

export type Options = Partial<{
  customGroups: {
    value?: DeprecatedCustomGroupsOption
    type?: DeprecatedCustomGroupsOption
  }
  partitionByComment: PartitionByCommentOption
  specialCharacters: SpecialCharactersOption
  locales: NonNullable<Intl.LocalesArgument>
  newlinesBetween: NewlinesBetweenOption
  fallbackSort: FallbackSortOption
  internalPattern: RegexOption[]
  groups: GroupsOptions<Group>
  environment: 'node' | 'bun'
  partitionByNewLine: boolean
  sortSideEffects: boolean
  tsconfigRootDir?: string
  maxLineLength?: number
  ignoreCase: boolean
  order: OrderOption
  type: TypeOption
  alphabet: string
}>[]

export type Selector =
  | SideEffectStyleSelector
  | ExternalTypeSelector
  | InternalTypeSelector
  | BuiltinTypeSelector
  | SiblingTypeSelector
  | SideEffectSelector
  | ParentTypeSelector
  | IndexTypeSelector
  | InternalSelector
  | ExternalSelector
  | SiblingSelector
  | BuiltinSelector
  | ParentSelector
  | ObjectSelector
  | IndexSelector
  | StyleSelector
  | TypeSelector

export interface SortImportsSortingNode extends SortingNode {
  isIgnored: boolean
}

export type Modifier = ValueModifier | TypeModifier

type ValueGroup = JoinWithDash<[ValueModifier, Selector]>

type Group = ValueGroup | TypeGroup | 'unknown' | string

type TypeGroup = JoinWithDash<[TypeModifier, Selector]>

type SideEffectStyleSelector = 'side-effect-style'
/**
 * @deprecated For {@link `TypeModifier`}
 */
type ExternalTypeSelector = 'external-type'

/**
 * @deprecated For {@link `TypeModifier`}
 */
type InternalTypeSelector = 'internal-type'

/**
 * @deprecated For {@link `TypeModifier`}
 */
type BuiltinTypeSelector = 'builtin-type'

/**
 * @deprecated For {@link `TypeModifier`}
 */
type SiblingTypeSelector = 'sibling-type'

/**
 * @deprecated For {@link `TypeModifier`}
 */
type ParentTypeSelector = 'parent-type'

type SideEffectSelector = 'side-effect'

/**
 * @deprecated For {@link `TypeModifier`}
 */
type IndexTypeSelector = 'index-type'

type InternalSelector = 'internal'

type ExternalSelector = 'external'

type SiblingSelector = 'sibling'

type BuiltinSelector = 'builtin'

type ParentSelector = 'parent'

type ObjectSelector = 'object'

type IndexSelector = 'index'

type StyleSelector = 'style'

type ValueModifier = 'value'

type TypeModifier = 'type'

type TypeSelector = 'type'
