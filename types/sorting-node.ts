import type { TSESTree } from '@typescript-eslint/types'

export interface SortingNode<Node extends TSESTree.Node = TSESTree.Node> {
  hasMultipleImportDeclarations?: boolean
  addSafetySemicolonWhenInline?: boolean
  isEslintDisabled: boolean
  name: string
  size: number
  node: Node
}
