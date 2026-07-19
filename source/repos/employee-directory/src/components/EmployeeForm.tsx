import { useEffect, useState, type FormEvent } from 'react'
import type { Employee, EmployeeInput } from '../types/employee'
import './EmployeeForm.css'

type EmployeeFormProps = {
  mode: 'create' | 'edit'
  initialEmployee?: Employee | null
  disabled?: boolean
  fieldError?: string
  onSubmit: (input: EmployeeInput) => Promise<void>
  onCancel: () => void
}

const EMPTY_FORM: EmployeeInput = {
  firstName: '',
  lastName: '',
  email: '',
  title: '',
  department: '',
}

function toFormValues(employee?: Employee | null): EmployeeInput {
  if (!employee) {
    return EMPTY_FORM
  }

  return {
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    title: employee.title,
    department: employee.department,
  }
}

const TITLE_BY_MODE: Record<'create' | 'edit', string> = {
  create: 'Add employee',
  edit: 'Edit employee',
}

const SUBMIT_LABEL_BY_MODE: Record<'create' | 'edit', string> = {
  create: 'Save employee',
  edit: 'Save changes',
}

export function EmployeeForm({
  mode,
  initialEmployee = null,
  disabled = false,
  fieldError,
  onSubmit,
  onCancel,
}: EmployeeFormProps) {
  const [values, setValues] = useState<EmployeeInput>(() =>
    toFormValues(initialEmployee),
  )

  useEffect(() => {
    setValues(toFormValues(initialEmployee))
  }, [initialEmployee, mode])

  function updateField<K extends keyof EmployeeInput>(
    field: K,
    value: EmployeeInput[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit(values)
  }

  return (
    <section className="employee-form" aria-labelledby="employee-form-title">
      <h2 id="employee-form-title">{TITLE_BY_MODE[mode]}</h2>

      <form onSubmit={(event) => void handleSubmit(event)}>
        <div className="employee-form__grid">
          <label>
            First name
            <input
              value={values.firstName}
              disabled={disabled}
              autoComplete="given-name"
              onChange={(event) => updateField('firstName', event.target.value)}
            />
          </label>
          <label>
            Last name
            <input
              value={values.lastName}
              disabled={disabled}
              autoComplete="family-name"
              onChange={(event) => updateField('lastName', event.target.value)}
            />
          </label>
          <label className="employee-form__full">
            Email
            <input
              type="email"
              value={values.email}
              disabled={disabled}
              autoComplete="email"
              onChange={(event) => updateField('email', event.target.value)}
            />
          </label>
          <label>
            Title
            <input
              value={values.title}
              disabled={disabled}
              onChange={(event) => updateField('title', event.target.value)}
            />
          </label>
          <label>
            Department
            <input
              value={values.department}
              disabled={disabled}
              onChange={(event) =>
                updateField('department', event.target.value)
              }
            />
          </label>
        </div>

        {fieldError ? <p className="employee-form__field-error">{fieldError}</p> : null}

        <div className="employee-form__actions">
          <button type="submit" disabled={disabled}>
            {SUBMIT_LABEL_BY_MODE[mode]}
          </button>
          <button type="button" disabled={disabled} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}
