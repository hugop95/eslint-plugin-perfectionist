import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { ASTUtils } from '@typescript-eslint/utils'

import { getEslintDisabledRules } from './get-eslint-disabled-rules'
import { isPartitionComment } from './is-partition-comment'
import { getCommentsBefore } from './get-comments-before'

export let getNodeRange = (
  node: TSESTree.Node,
  sourceCode: TSESLint.SourceCode,
  additionalOptions?: {
    partitionByComment?: string[] | boolean | string
  },
): TSESTree.Range => {
  let start = node.range.at(0)!
  let end = node.range.at(1)!

  if (ASTUtils.isParenthesized(node, sourceCode)) {
    let bodyOpeningParen = sourceCode.getTokenBefore(
      node,
      ASTUtils.isOpeningParenToken,
    )!

    let bodyClosingParen = sourceCode.getTokenAfter(
      node,
      ASTUtils.isClosingParenToken,
    )!

    start = bodyOpeningParen.range.at(0)!
    end = bodyClosingParen.range.at(1)!
  }

  let comments = getCommentsBefore(node, sourceCode)
  let partitionComment = additionalOptions?.partitionByComment ?? false

  // Iterate on all comments starting from the bottom until we reach the last
  // of the comments, a newline between comments, a partition comment,
  // or a eslint-disable comment
  let relevantTopComment: TSESTree.Comment | undefined
  for (let i = comments.length - 1; i >= 0; i--) {
    let comment = comments[i]
    let eslintDisabledRules = getEslintDisabledRules(comment.value)
    if (
      isPartitionComment(partitionComment, comment.value) ||
      eslintDisabledRules?.eslintDisableDirective === 'eslint-disable' ||
      eslintDisabledRules?.eslintDisableDirective === 'eslint-enable'
    ) {
      break
    }
    // Check for newlines between comments or between the first comment and
    // the node.
    let previousCommentOrNodeStartLine =
      i === comments.length - 1
        ? node.loc.start.line
        : comments[i + 1].loc.start.line
    if (comment.loc.end.line !== previousCommentOrNodeStartLine - 1) {
      break
    }
    relevantTopComment = comment
  }

  if (relevantTopComment) {
    start = relevantTopComment.range.at(0)!
  }

  return [start, end]
}
