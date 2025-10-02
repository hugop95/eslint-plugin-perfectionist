import type { TSESTree } from '@typescript-eslint/types'

/** Helper type for a node with a specific AST node type. */
type NodeOfType<Type> = { type: Type } & TSESTree.Node

/**
 * Finds the first parent node matching one of the specified AST node types.
 *
 * Traverses up the AST tree from a given node to find a parent of a specific
 * type. Can either check only the immediate parent or search through all
 * ancestors. Used to determine the context in which an object is defined (e.g.,
 * variable declaration, function call argument, etc.).
 *
 * @param options - Options for the search.
 * @param options.allowedTypes - Array of AST node types to match.
 * @param options.node - Starting node to search from.
 * @returns First matching parent node or null if none found.
 */
export function getFirstNodeParentWithType<
  NodeType extends TSESTree.AST_NODE_TYPES,
>({
  allowedTypes,
  node,
}: {
  allowedTypes: NodeType[]
  node: TSESTree.Node
}): NodeOfType<NodeType> | null {
  let { parent } = node
  while (parent) {
    if ((allowedTypes as string[]).includes(parent.type)) {
      return parent as NodeOfType<NodeType>
    }

    ;({ parent } = parent)
  }
  return null
}
