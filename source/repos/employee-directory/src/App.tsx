import { useMemo, useState } from 'react'
import { ErrorBanner } from './components/ErrorBanner'
import { EmployeeForm } from './components/EmployeeForm'
import { EmployeeList } from './components/EmployeeList'
import { OperationStatusBanner } from './components/OperationStatusBanner'
import { SearchBar } from './components/SearchBar'
import { SortControls } from './components/SortControls'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import { useEmployees } from './hooks/useEmployees'
import type { Employee, EmployeeInput } from './types/employee'
import { filterEmployees } from './utils/filterEmployees'
import { sortEmployees, type SortDirection } from './utils/sortEmployees'
import './App.css'

type FormMode = 'closed' | 'create' | 'edit'

const SEARCH_DEBOUNCE_MS = 200

function getEmptyMessage(employeeCount: number): string {
  if (employeeCount === 0) {
    return 'No employees yet. Add one to get started.'
  }

  return 'No employees match your search.'
}

export default function App() {
  const {
    employees,
    error,
    operation,
    isBusy,
    loadEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    clearError,
  } = useEmployees()

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [formMode, setFormMode] = useState<FormMode>('closed')
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  const isSearchPending = searchQuery.trim() !== debouncedSearchQuery.trim()

  const visibleEmployees = useMemo(() => {
    const filtered = filterEmployees(employees, debouncedSearchQuery)
    return sortEmployees(filtered, sortDirection)
  }, [employees, debouncedSearchQuery, sortDirection])

  const emptyMessage = getEmptyMessage(employees.length)
  const showRetry = error?.code === 'NETWORK'
  const resultSummary = isSearchPending
    ? 'Updating results…'
    : `${visibleEmployees.length} of ${employees.length} employees`

  function openCreateForm() {
    clearError()
    setEditingEmployee(null)
    setFormMode('create')
  }

  function openEditForm(employee: Employee) {
    clearError()
    setEditingEmployee(employee)
    setFormMode('edit')
  }

  function closeForm() {
    setFormMode('closed')
    setEditingEmployee(null)
  }

  async function handleFormSubmit(input: EmployeeInput) {
    if (formMode === 'edit' && editingEmployee) {
      const updated = await updateEmployee(editingEmployee.id, input)
      if (!updated) {
        return
      }
      closeForm()
      return
    }

    const created = await createEmployee(input)
    if (!created) {
      return
    }
    closeForm()
  }

  async function handleDelete(employee: Employee) {
    const confirmed = window.confirm(
      `Delete ${employee.firstName} ${employee.lastName}?`,
    )
    if (!confirmed) {
      return
    }

    await deleteEmployee(employee.id)

    if (editingEmployee?.id === employee.id) {
      closeForm()
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <h1>Employee Directory</h1>
          <p>Search, sort, and manage your team.</p>
        </div>
      </header>

      <OperationStatusBanner operation={operation} />

      {error ? (
        <div className="app-banner-wrap">
          <ErrorBanner
            error={error}
            onDismiss={clearError}
            onRetry={showRetry ? () => void loadEmployees() : undefined}
          />
        </div>
      ) : null}

      <main className="app-main">
        <div className="toolbar">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            disabled={isBusy && employees.length === 0}
          />
          <div className="toolbar__actions">
            <SortControls
              direction={sortDirection}
              onChange={setSortDirection}
              disabled={isBusy && employees.length === 0}
            />
            <button
              type="button"
              className="toolbar__add"
              disabled={isBusy}
              onClick={openCreateForm}
            >
              Add employee
            </button>
          </div>
        </div>

        <p className="result-summary" aria-live="polite">
          {resultSummary}
        </p>

        {formMode !== 'closed' ? (
          <EmployeeForm
            mode={formMode}
            initialEmployee={editingEmployee}
            disabled={isBusy}
            fieldError={error?.field ? error.message : undefined}
            onSubmit={handleFormSubmit}
            onCancel={closeForm}
          />
        ) : null}

        <EmployeeList
          employees={visibleEmployees}
          disabled={isBusy}
          emptyMessage={emptyMessage}
          onEdit={openEditForm}
          onDelete={(employee) => void handleDelete(employee)}
        />
      </main>
    </div>
  )
}
