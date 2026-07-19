import type { Employee } from '../types/employee'
import { EmployeeCard } from './EmployeeCard'
import './EmployeeList.css'

type EmployeeListProps = {
  employees: Employee[]
  disabled?: boolean
  emptyMessage: string
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
}

export function EmployeeList({
  employees,
  disabled = false,
  emptyMessage,
  onEdit,
  onDelete,
}: EmployeeListProps) {
  if (employees.length === 0) {
    return <p className="employee-list__empty">{emptyMessage}</p>
  }

  return (
    <div className="employee-list">
      {employees.map((employee) => (
        <EmployeeCard
          key={employee.id}
          employee={employee}
          disabled={disabled}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
