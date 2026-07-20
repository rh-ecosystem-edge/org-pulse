const DISABLED_PIPELINES = ['test-plan-review', 'documentation', 'build-release', 'rfe-creator']

export function useDisabledPipelines() {
  function isDisabled(pipelineId) {
    return DISABLED_PIPELINES.includes(pipelineId)
  }

  return { isDisabled }
}
