import { mockEmployees } from '../data/mockEmployees'
import type { Employee, EmployeeInput } from '../types/employee'
import { createAppError, type AppError } from '../types/errors'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DEFAULT_LATENCY_MS = 600

type MockApiOptions = {
  latencyMs: number
  failNextNetwork: boolean
}

const options: MockApiOptions = {
  latencyMs: DEFAULT_LATENCY_MS,
  failNextNetwork: false,
}

let employees: Employee[] = mockEmployees.map((employee) => ({ ...employee }))
let nextId = employees.length + 1

export function configureMockEmployeeApi(
  overrides: Partial<MockApiOptions>,
): void {
  Object.assign(options, overrides)
}

export function resetMockEmployeeApi(): void {
  employees = mockEmployees.map((employee) => ({ ...employee }))
  nextId = employees.length + 1
  options.latencyMs = DEFAULT_LATENCY_MS
  options.failNextNetwork = false
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function findByEmail(email: string, excludeId?: string): Employee | undefined {
  const normalized = normalizeEmail(email)
  return employees.find((employee) => {
    const emailMatches = normalizeEmail(employee.email) === normalized
    const isExcluded = excludeId !== undefined && employee.id === excludeId
    return emailMatches && !isExcluded
  })
}

function validateEmployeeInput(input: EmployeeInput): AppError | null {
  const firstName = input.firstName.trim()
  if (!firstName) {
    return createAppError('VALIDATION', 'First name is required.', 'firstName')
  }

  const lastName = input.lastName.trim()
  if (!lastName) {
    return createAppError('VALIDATION', 'Last name is required.', 'lastName')
  }

  const email = input.email.trim()
  if (!email) {
    return createAppError('VALIDATION', 'Email is required.', 'email')
  }

  if (!EMAIL_PATTERN.test(email)) {
    return createAppError(
      'VALIDATION',
      'Enter a valid email address (name@domain.com).',
      'email',
    )
  }

  const title = input.title.trim()
  if (!title) {
    return createAppError('VALIDATION', 'Title is required.', 'title')
  }

  const department = input.department.trim()
  if (!department) {
    return createAppError('VALIDATION', 'Department is required.', 'department')
  }

  return null
}

export function assertValidEmployeeInput(input: EmployeeInput): void {
  const validationError = validateEmployeeInput(input)
  if (!validationError) {
    return
  }

  throw validationError
}

function trimEmployeeInput(input: EmployeeInput): EmployeeInput {
  return {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: normalizeEmail(input.email),
    title: input.title.trim(),
    department: input.department.trim(),
  }
}

async function beforeRequest(): Promise<void> {
  await delay(options.latencyMs)

  if (!options.failNextNetwork) {
    return
  }

  options.failNextNetwork = false
  throw createAppError('NETWORK')
}

function createId(): string {
  const id = `emp-${String(nextId).padStart(3, '0')}`
  nextId += 1
  return id
}

export async function listEmployees(): Promise<Employee[]> {
  await beforeRequest()
  return employees.map((employee) => ({ ...employee }))
}

export async function getEmployee(id: string): Promise<Employee> {
  await beforeRequest()

  const employee = employees.find((item) => item.id === id)
  if (!employee) {
    throw createAppError('NOT_FOUND', `No employee exists with id "${id}".`)
  }

  return { ...employee }
}

export async function createEmployee(input: EmployeeInput): Promise<Employee> {
  assertValidEmployeeInput(input)

  const trimmed = trimEmployeeInput(input)

  await beforeRequest()

  if (findByEmail(trimmed.email)) {
    throw createAppError('DUPLICATE_EMAIL')
  }

  const employee: Employee = {
    id: createId(),
    ...trimmed,
  }

  employees = [...employees, employee]
  return { ...employee }
}

export async function updateEmployee(
  id: string,
  input: EmployeeInput,
): Promise<Employee> {
  assertValidEmployeeInput(input)

  const trimmed = trimEmployeeInput(input)

  await beforeRequest()

  const index = employees.findIndex((employee) => employee.id === id)
  if (index < 0) {
    throw createAppError('NOT_FOUND', `No employee exists with id "${id}".`)
  }

  if (findByEmail(trimmed.email, id)) {
    throw createAppError('DUPLICATE_EMAIL')
  }

  const updated: Employee = {
    id,
    ...trimmed,
  }

  employees = employees.map((employee) =>
    employee.id === id ? updated : employee,
  )

  return { ...updated }
}

export async function deleteEmployee(id: string): Promise<void> {
  await beforeRequest()

  const exists = employees.some((employee) => employee.id === id)
  if (!exists) {
    throw createAppError('NOT_FOUND', `No employee exists with id "${id}".`)
  }

  employees = employees.filter((employee) => employee.id !== id)
}
