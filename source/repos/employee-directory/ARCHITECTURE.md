# Employee Directory — Architecture

Local-only Vite + React + TypeScript app. No real backend; CRUD goes through an in-memory mock API with simulated latency and typed errors.

## System diagram

```mermaid
flowchart TB
  subgraph entry [Entry]
    MainTsx[main.tsx]
  end

  subgraph ui [UI Layer]
    App[App.tsx]
    StatusStrip[OperationStatusBanner]
    ErrorBanner[ErrorBanner]
    SearchBar[SearchBar]
    SortControls[SortControls]
    EmployeeForm[EmployeeForm]
    EmployeeList[EmployeeList]
    EmployeeCard[EmployeeCard]
  end

  subgraph appState [App-local state]
    SearchQuery[searchQuery]
    DebouncedQuery[useDebouncedValue 200ms]
    SortDir[sortDirection]
    FormMode["formMode closed|create|edit"]
    EditingEmp[editingEmployee]
    VisibleList["useMemo: filterEmployees then sortEmployees"]
  end

  subgraph hooks [Hooks]
    UseEmployees[useEmployees]
    OpState["operation: kind + phase idle|started|inProgress|finished"]
    EmpState[employees]
    ErrState[error AppError]
  end

  subgraph utils [Utils]
    FilterUtil[filterEmployees]
    SortUtil[sortEmployees]
  end

  subgraph types [Types]
    EmpType[employee.ts]
    ErrType[errors.ts]
    OpType[operation.ts]
  end

  subgraph data [Data Layer]
    MockApi[mockEmployeeApi]
    SeedData[mockEmployees seed]
    InMemory[in-memory employees array]
    FailInject["configureMockEmployeeApi failNextNetwork"]
  end

  MainTsx --> App
  App --> StatusStrip
  App --> ErrorBanner
  App --> SearchBar
  App --> SortControls
  App --> EmployeeForm
  App --> EmployeeList
  EmployeeList --> EmployeeCard

  App --> UseEmployees
  App --> SearchQuery
  SearchQuery --> DebouncedQuery
  App --> SortDir
  App --> FormMode
  App --> EditingEmp

  DebouncedQuery --> VisibleList
  SortDir --> VisibleList
  EmpState --> VisibleList
  VisibleList --> FilterUtil
  VisibleList --> SortUtil
  VisibleList --> EmployeeList

  UseEmployees --> OpState
  UseEmployees --> EmpState
  UseEmployees --> ErrState
  OpState --> StatusStrip
  ErrState --> ErrorBanner

  UseEmployees -->|"list create update delete"| MockApi
  UseEmployees -->|"assertValidEmployeeInput early"| MockApi
  MockApi --> InMemory
  SeedData --> InMemory
  MockApi --> FailInject
  MockApi --> ErrType
  OpState --> OpType
  EmpState --> EmpType
```

## Layer summary

| Layer | Responsibility |
|---|---|
| **UI** | Presentational components; App owns layout and wires hooks → props |
| **App-local state** | Search input, debounce, sort direction, form open/edit mode; memoized visible list |
| **Hooks** | `useEmployees` owns employees, operation lifecycle, errors, and CRUD calls |
| **Utils** | Pure `filterEmployees` / `sortEmployees` (no nested loops) |
| **Types** | `Employee`, `AppError`, `OperationState` / kind / phase |
| **Data** | Seed data + `mockEmployeeApi` in-memory store, latency, validation, injectable network failure |

## Data flow notes

1. **Load / CRUD** — `useEmployees` sets operation `started` → `inProgress`, calls `mockEmployeeApi`, then `finished` (~1.5s) or clears to `idle` with an `AppError`.
2. **Status strip** — reads `operation` only; hidden when `idle`.
3. **Errors** — typed codes (`VALIDATION`, `NOT_FOUND`, `DUPLICATE_EMAIL`, `NETWORK`, `UNKNOWN`); validation runs before the lifecycle starts for create/update.
4. **Search** — input updates immediately; filtering uses the 200ms-debounced value.
5. **List** — `EmployeeList` receives already filtered + sorted employees and renders `EmployeeCard`s.
