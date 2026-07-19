import type { Employee } from '../types/employee'

function matchesQuery(employee: Employee, normalizedQuery: string): boolean {
  const haystack = [
    employee.firstName,
    employee.lastName,
    `${employee.firstName} ${employee.lastName}`,
    `${employee.lastName} ${employee.firstName}`,
    employee.email,
    employee.title,
    employee.department,
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(normalizedQuery)
}

export function filterEmployees(
  employees: Employee[],
  query: string,
): Employee[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return employees
  }

  return employees.filter((employee) => matchesQuery(employee, normalizedQuery))
}
