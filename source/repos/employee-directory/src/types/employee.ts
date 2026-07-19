export type Employee = {
  id: string
  firstName: string
  lastName: string
  email: string
  title: string
  department: string
}

export type EmployeeInput = Omit<Employee, 'id'>
