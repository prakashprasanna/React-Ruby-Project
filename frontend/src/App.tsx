import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getPaginationRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table'

// Types
type Employee = {
  firstName: string
  lastName: string
  age: number
  position: string
  departmentName: string
}

// Components
const SearchBar = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <div className="mb-4">
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="Search by name..."
      className="px-4 py-2 border rounded w-full max-w-md"
    />
  </div>
)

// Pagination controls
const PaginationControls = ({ table }: { table: any }) => (
  <div className="flex items-center justify-between p-4 border-t">
    <div className="flex items-center gap-2">
      <button
        className="px-3 py-1 border-r rounded hover:bg-gray-50 disabled:opacity-50"
        onClick={() => table.setPageIndex(0)}
        disabled={!table.getCanPreviousPage()}
      >
        {'<<'}
      </button>
      <button
        className="px-3 py-1 border-r rounded hover:bg-gray-50 disabled:opacity-50"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        {'<'}
      </button>
      <button
        className="px-3 py-1 border-r rounded hover:bg-gray-50 disabled:opacity-50"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        {'>'}
      </button>
      <button
        className="px-3 py-1 border-r rounded hover:bg-gray-50 disabled:opacity-50"
        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
        disabled={!table.getCanNextPage()}
      >
        {'>>'}
      </button>
    </div>
    <span className="flex items-center gap-1">
      <div>Page</div>
      <strong>
        {table.getState().pagination.pageIndex + 1} of{' '}
        {table.getPageCount()}
      </strong>
    </span>
  </div>
)

// Table component
const EmployeeTable = ({ table }: { table: any }) => (
  <table className="w-full">
    <thead className="bg-gray-50">
      {table.getHeaderGroups().map((headerGroup: any) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header: any) => (
            <th 
              key={header.id} 
              className="p-3 text-left border-b font-semibold text-gray-600"
              onClick={header.column.getToggleSortingHandler()}
              style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
            >
              <div className="flex items-center gap-2">
                {flexRender(header.column.columnDef.header, header.getContext())}
                {header.column.getCanSort() && (
                  <span>
                    {{ asc: '↑', desc: '↓' }[header.column.getIsSorted() as string] ?? '↕'}
                  </span>
                )}
              </div>
            </th>
          ))}
        </tr>
      ))}
    </thead>
    <tbody>
      {table.getRowModel().rows.map((row: any) => (
        <tr key={row.id} className="hover:bg-gray-50">
          {row.getVisibleCells().map((cell: any) => (
            <td key={cell.id} className="p-3 border-b">
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
)

// Hook for fetching employees
const useEmployees = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await fetch('http://localhost:4567/api/v1/employees?page[size]=1000')
      if (!response.ok) throw new Error('Network response was not ok')
      const data = await response.json()
      
      return data.data.map((item: any) => ({
        firstName: item.attributes.first_name,
        lastName: item.attributes.last_name,
        age: item.attributes.age,
        position: item.attributes.position,
        departmentName: item.attributes.department_name
      }))
    }
  })
}

// Column definitions using useMemo
const useTableColumns = () => {
  const columnHelper = createColumnHelper<Employee>()
  
  return useMemo(() => [
    columnHelper.accessor('firstName', {
      header: 'First Name',
      enableSorting: true,
    }),
    columnHelper.accessor('lastName', {
      header: 'Last Name',
      enableSorting: true,
    }),
    columnHelper.accessor('age', {
      header: 'Age',
      enableSorting: true,
    }),
    columnHelper.accessor('position', {
      header: 'Position',
      enableSorting: true,
    }),
    columnHelper.accessor('departmentName', {
      header: 'Department Name',
      enableSorting: false,
      enableHiding: true,
    }),
  ], [])
}

// Department filter
const DepartmentFilter = ({ 
  value, 
  onChange, 
  departments 
}: { 
  value: string, 
  onChange: (value: string) => void,
  departments: string[]
}) => (
  <div className="mb-4">
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-4 py-2 border rounded"
    >
      <option value="">All Departments</option>
      {departments.map(dept => (
        <option key={dept} value={dept}>
          {dept}
        </option>
      ))}
    </select>
  </div>
)

// Modal component for adding a new employee
const AddEmployeeModal = ({ isOpen, onClose, departments }: { isOpen: boolean; onClose: () => void; departments: string[] }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [position, setPosition] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('http://localhost:4567/api/v1/addEmployees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          age: Number(age), // Ensure age is a number
          position: position,
          department_id: departmentId,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to add employee');
      }
      return response.json();
    },
    onSuccess: (newEmployee) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] }); // Refetch employees after adding
      queryClient.setQueryData(['employees'], (oldData: any) => {
        return [...(oldData || []), newEmployee]; // Add the new employee to the existing data
      });
      alert("New employee added");
      onClose(); // Close the modal
      // Reset form fields
      setFirstName('');
      setLastName('');
      setAge('');
      setPosition('');
      setDepartmentId('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({
      first_name: firstName,
      last_name: lastName,
      age: age,
      position: position,
      department_id: departmentId,
    });
    mutation.mutate(); // Trigger the mutation to add the employee
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold mb-4">Add New Employee</h2>
        <form onSubmit={handleSubmit} className="w-full">
          <div className="mb-4">
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="px-4 py-2 border rounded w-full"
            />
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="px-4 py-2 border rounded w-full"
            />
          </div>
          <div className="mb-4">
            <input
              type="number"
              placeholder="Age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
              className="px-4 py-2 border rounded w-full"
            />
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              required
              className="px-4 py-2 border rounded w-full"
            />
          </div>
          <div className="mb-4">
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              required
              className="px-4 py-2 border rounded w-full"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-center mt-4">
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
              Add Employee
            </button>
          </div>
        </form>
        <button onClick={onClose} className="mt-2 px-4 py-2 border rounded">
          Close
        </button>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const columns = useTableColumns()
  const { data: employees = [], isLoading, error } = useEmployees()

  // Get unique department names
  const departments = useMemo(() => {
    const depts = employees.map((emp: Employee) => emp.departmentName)
    return [...new Set(depts)].sort()
  }, [employees])

  // Filter employees by department
  const filteredEmployees = useMemo(() => {
    if (!departmentFilter) return employees
    return employees.filter((emp: Employee) => emp.departmentName === departmentFilter)
  }, [employees, departmentFilter])

  // table configuration object
  const tableConfig = useMemo(() => ({
    data: filteredEmployees, // Used filtered employees instead of all employees
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row: any, columnId: string, filterValue: string) => {
      const firstName = row.getValue('firstName') as string
      const lastName = row.getValue('lastName') as string
      const searchValue = filterValue.toLowerCase()
      
      return firstName.toLowerCase().includes(searchValue) || 
             lastName.toLowerCase().includes(searchValue)
    },
  }), [filteredEmployees, columns, sorting, globalFilter])

  // Initialize table with memoized config
  const table = useReactTable(tableConfig)

  // Render function
  const renderContent = () => {
    if (isLoading) return <div className="p-4">Loading...</div>
    if (error) return <div className="p-4 text-red-500">Error: {(error as Error).message}</div>

    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold underline mb-4">Keyhook Interview Task</h1>
        <h2 className="text-2xl font-bold underline mb-4">Employee List</h2>
        <div className="flex gap-4 mb-4">
            <SearchBar value={globalFilter} onChange={setGlobalFilter} />
            <DepartmentFilter 
              value={departmentFilter} 
              onChange={setDepartmentFilter}
              departments={departments as string[]}
            />
        <div className="flex gap-4 mb-4">
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="px-4 py-2 border rounded text-gray hover:bg-gray-100 transition duration-200"
            >
              Add Employee
            </button>
        </div>  
        </div>  
        <div className="border rounded shadow-sm">
          <EmployeeTable table={table} />
          <PaginationControls table={table} />
        </div>
        <AddEmployeeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} departments={departments as string[]}/>
      </div>
    )
  }

  // Return the rendered content
  return renderContent()
}

export default App