export type OperationLifecycle = 'idle' | 'started' | 'inProgress' | 'finished'

export type OperationKind = 'load' | 'create' | 'update' | 'delete'

export type OperationState = {
  kind: OperationKind | null
  phase: OperationLifecycle
}

export const IDLE_OPERATION: OperationState = {
  kind: null,
  phase: 'idle',
}

const STARTED_MESSAGES: Record<OperationKind, string> = {
  load: 'Loading employees…',
  create: 'Saving employee…',
  update: 'Updating employee…',
  delete: 'Deleting employee…',
}

const FINISHED_MESSAGES: Record<OperationKind, string> = {
  load: 'Employees loaded',
  create: 'Employee saved',
  update: 'Employee updated',
  delete: 'Employee deleted',
}

export function getOperationMessage(operation: OperationState): string {
  if (operation.phase === 'idle' || !operation.kind) {
    return ''
  }

  if (operation.phase === 'finished') {
    return FINISHED_MESSAGES[operation.kind]
  }

  return STARTED_MESSAGES[operation.kind]
}

export function isOperationBusy(phase: OperationLifecycle): boolean {
  return phase === 'started' || phase === 'inProgress'
}
