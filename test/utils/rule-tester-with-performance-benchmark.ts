import type {
  InvalidTestCase,
  ValidTestCase,
  RunTests,
} from '@typescript-eslint/rule-tester'
import type { RuleModule } from '@typescript-eslint/utils/ts-eslint'
import type { TSUtils } from '@typescript-eslint/utils'

import { RuleTester } from '@typescript-eslint/rule-tester'
import { expect } from 'vitest'

let DEFAULT_MAX_MS_DURATION = 250

export class RuleTesterWithPerformanceBenchmark extends RuleTester {
  public run<MessageIds extends string, Options extends readonly unknown[]>(
    ruleName: string,
    rule: RuleModule<MessageIds, Options>,
    test: RunTests<TSUtils.NoInfer<MessageIds>, TSUtils.NoInfer<Options>>,
  ): void {
    return super.run(
      ruleName,
      rule,
      populateTestsWithPerformanceBenchmark({ test }),
    )
  }
}

let populateTestsWithPerformanceBenchmark = <
  MessageIds extends string,
  Options extends readonly unknown[],
>({
  maxMsDuration,
  test,
}: {
  test: RunTests<TSUtils.NoInfer<MessageIds>, TSUtils.NoInfer<Options>>
  maxMsDuration?: number
}): RunTests<TSUtils.NoInfer<MessageIds>, TSUtils.NoInfer<Options>> => ({
  valid: test.valid.map(validTest =>
    typeof validTest === 'string'
      ? validTest
      : populateObjectTestCaseWithPerformanceBenchmark(
          validTest,
          maxMsDuration,
        ),
  ),
  invalid: test.invalid.map(invalidTest =>
    populateObjectTestCaseWithPerformanceBenchmark(invalidTest, maxMsDuration),
  ),
})

let populateObjectTestCaseWithPerformanceBenchmark = <
  MessageIds extends string,
  Options extends readonly unknown[],
  T extends InvalidTestCase<MessageIds, Options> | ValidTestCase<Options>,
>(
  test: T,
  maxMsDuration: undefined | number,
): T => {
  let start: number = 0
  return {
    after: () => {
      let end = Number(performance.now().toFixed(0))
      let duration = end - start
      if (test.after) {
        test.after()
      }
      expect(duration, 'Performance benchmark failed').toBeLessThan(
        maxMsDuration ?? DEFAULT_MAX_MS_DURATION,
      )
    },
    before: () => {
      if (test.before) {
        test.before()
      }
      start = Number(performance.now().toFixed(0))
    },
    ...test,
  }
}
