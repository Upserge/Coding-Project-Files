import { useCallback, useEffect, useRef, useState } from 'react'
import {
  assertValidEmployeeInput,
  createEmployee as apiCreateEmployee,
  deleteEmployee as apiDeleteEmployee,
  listEmployees,
  updateEmployee as apiUpdateEmployee,
} from '../api/mockEmployeeApi'
import type { Employee, EmployeeInput } from '../types/employee'
import { toAppError, type AppError } from '../types/errors'
import {
  IDLE_OPERATION,
  isOperationBusy,
  type OperationKind,
  type OperationState,
} from '../types/operation'

const FINISHED_VISIBLE_MS = 1500

type UseEmployeesResult = {
  employees: Employee[]
  error: AppError | null
  operation: OperationState
  isBusy: boolean
  loadEmployees: () => Promise<void>
  createEmployee: (input: EmployeeInput) => Promise<Employee | null>
  updateEmployee: (
    id: string,
    input: EmployeeInput,
  ) => Promise<Employee | null>
  deleteEmployee: (id: string) => Promise<boolean>
  clearError: () => void
}

export function useEmployees(): UseEmployeesResult {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [error, setError] = useState<AppError | null>(null)
  const [operation, setOperation] = useState<OperationState>(IDLE_OPERATION)
  const finishedTimerRef = useRef<number | null>(null)

  const clearFinishedTimer = useCallback(() => {
    if (finishedTimerRef.current === null) {
      return
    }

    window.clearTimeout(finishedTimerRef.current)
    finishedTimerRef.current = null
  }, [])

  const beginOperation = useCallback(
    async (kind: OperationKind) => {
      clearFinishedTimer()
      setError(null)
      setOperation({ kind, phase: 'started' })

      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve())
      })

      setOperation({ kind, phase: 'inProgress' })
    },
    [clearFinishedTimer],
  )

  const finishOperation = useCallback(
    (kind: OperationKind) => {
      setOperation({ kind, phase: 'finished' })
      clearFinishedTimer()
      finishedTimerRef.current = window.setTimeout(() => {
        setOperation(IDLE_OPERATION)
        finishedTimerRef.current = null
      }, FINISHED_VISIBLE_MS)
    },
    [clearFinishedTimer],
  )

  const failOperation = useCallback(
    (unknownError: unknown) => {
      clearFinishedTimer()
      setOperation(IDLE_OPERATION)
      setError(toAppError(unknownError))
    },
    [clearFinishedTimer],
  )

  const loadEmployees = useCallback(async () => {
    await beginOperation('load')

    try {
      const result = await listEmployees()
      setEmployees(result)
      finishOperation('load')
    } catch (unknownError) {
      failOperation(unknownError)
    }
  }, [beginOperation, failOperation, finishOperation])

  const createEmployee = useCallback(
    async (input: EmployeeInput) => {
      try {
        assertValidEmployeeInput(input)
      } catch (unknownError) {
        failOperation(unknownError)
        return null
      }

      await beginOperation('create')

      try {
        const created = await apiCreateEmployee(input)
        setEmployees((current) => [...current, created])
        finishOperation('create')
        return created
      } catch (unknownError) {
        failOperation(unknownError)
        return null
      }
    },
    [beginOperation, failOperation, finishOperation],
  )

  const updateEmployee = useCallback(
    async (id: string, input: EmployeeInput) => {
      try {
        assertValidEmployeeInput(input)
      } catch (unknownError) {
        failOperation(unknownError)
        return null
      }

      await beginOperation('update')

      try {
        const updated = await apiUpdateEmployee(id, input)
        setEmployees((current) =>
          current.map((employee) =>
            employee.id === id ? updated : employee,
          ),
        )
        finishOperation('update')
        return updated
      } catch (unknownError) {
        failOperation(unknownError)
        return null
      }
    },
    [beginOperation, failOperation, finishOperation],
  )

  const deleteEmployee = useCallback(
    async (id: string) => {
      await beginOperation('delete')

      try {
        await apiDeleteEmployee(id)
        setEmployees((current) =>
          current.filter((employee) => employee.id !== id),
        )
        finishOperation('delete')
        return true
      } catch (unknownError) {
        failOperation(unknownError)
        return false
      }
    },
    [beginOperation, failOperation, finishOperation],
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  useEffect(() => {
    void loadEmployees()
  }, [loadEmployees])

  useEffect(() => {
    return () => {
      clearFinishedTimer()
    }
  }, [clearFinishedTimer])

  return {
    employees,
    error,
    operation,
    isBusy: isOperationBusy(operation.phase),
    loadEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    clearError,
  }
}
