import type { Employee } from '../types/employee'
import './EmployeeCard.css'

type EmployeeCardProps = {
  employee: Employee
  disabled?: boolean
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
}

export function EmployeeCard({
  employee,
  disabled = false,
  onEdit,
  onDelete,
}: EmployeeCardProps) {
  return (
    <article className="employee-card">
      <header className="employee-card__header">
        <h2>
          {employee.firstName} {employee.lastName}
        </h2>
        <p>{employee.title}</p>
      </header>
      <dl className="employee-card__meta">
        <div>
          <dt>Department</dt>
          <dd>{employee.department}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>
            <a href={`mailto:${employee.email}`}>{employee.email}</a>
          </dd>
        </div>
      </dl>
      <div className="employee-card__actions">
        <button type="button" disabled={disabled} onClick={() => onEdit(employee)}>
          Edit
        </button>
        <button
          type="button"
          className="employee-card__delete"
          disabled={disabled}
          onClick={() => onDelete(employee)}
        >
          Delete
        </button>
      </div>
    </article>
  )
}
