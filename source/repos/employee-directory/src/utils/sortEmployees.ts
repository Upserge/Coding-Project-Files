import type { Employee } from '../types/employee'

export type SortDirection = 'asc' | 'desc'

function compareEmployees(
  left: Employee,
  right: Employee,
  direction: SortDirection,
): number {
  const lastNameCompare = left.lastName.localeCompare(right.lastName, undefined, {
    sensitivity: 'base',
  })

  if (lastNameCompare !== 0) {
    return direction === 'asc' ? lastNameCompare : -lastNameCompare
  }

  const firstNameCompare = left.firstName.localeCompare(
    right.firstName,
    undefined,
    { sensitivity: 'base' },
  )

  return direction === 'asc' ? firstNameCompare : -firstNameCompare
}

export function sortEmployees(
  employees: Employee[],
  direction: SortDirection,
): Employee[] {
  return [...employees].sort((left, right) =>
    compareEmployees(left, right, direction),
  )
}
