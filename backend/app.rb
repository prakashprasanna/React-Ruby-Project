puts "Loading app.rb"
puts "Loaded features: #{$LOADED_FEATURES.select { |f| f.include?('employee') || f.include?('department') }}"

# Clear any cached requires for these files
$LOADED_FEATURES.delete_if { |path| path.include?('department') || path.include?('employee') }

require 'faker'
require 'active_record'
require './seeds'
require 'kaminari'
require 'sinatra/base'
require 'graphiti'
require 'graphiti/adapters/active_record'

class ApplicationResource < Graphiti::Resource
  self.abstract_class = true
  self.adapter = Graphiti::Adapters::ActiveRecord
  self.base_url = 'http://localhost:4567'
  self.endpoint_namespace = '/api/v1'
  self.validate_endpoints = false
end

class DepartmentResource < ApplicationResource
  self.model = Department
  self.type = :departments
  attribute :id, :integer
  attribute :name, :string

  # Add the relationship
  has_many :employees
end

# Schema
# {
#   "employee_columns": [
#     "id",
#     "first_name",
#     "last_name",
#     "age",
#     "position",
#     "department_id"
#   ],
#   "department_columns": [
#     "id",
#     "name"
#   ]
# }

class EmployeeResource < ApplicationResource
  self.model = Employee
  self.type = :employees
  self.default_page_size = 1000

  attribute :id, :integer
  attribute :first_name, :string
  attribute :last_name, :string
  attribute :age, :integer
  attribute :position, :string
  attribute :department_id, :integer
  
  # Computed attribute for department name
  attribute :department_name, :string do
    @object.department&.name
  end
  
  belongs_to :department

end

Graphiti.setup!

class EmployeeDirectoryApp < Sinatra::Application
  # Configure the mime type for JSON API
  configure do
    mime_type :jsonapi, 'application/vnd.api+json'
  end

  before do
    content_type :jsonapi
  end

  after do
    ActiveRecord::Base.connection_handler.clear_active_connections!
  end

  # Department endpoint
  get '/api/v1/departments' do
    departments = DepartmentResource.all(params)
    departments.to_jsonapi
  end

  # for future use not used currently in the given task
  get '/api/v1/departments/:id' do
    departments = DepartmentResource.find(params)
    departments.to_jsonapi
  end

  # Employee endpoint
  get '/api/v1/employees' do
    employees = EmployeeResource.all(params)
    employees.to_jsonapi
  end

    # for future use not used currently in the given task
  get '/api/v1/employees/:id' do
    employee = EmployeeResource.find(params)
    employee.to_jsonapi
  end

  # Debug endpoint - to get all the data available
  get '/debug/data' do
    content_type :json
    {
      employees: Employee.all.as_json,
      departments: Department.all.as_json
    }.to_json
  end

  # Schema endpoint - to fetch column names to build EmployeeResource & DepartmentResouce structure correctly 
  get '/debug/schema' do
    content_type :json
    {
      employee_columns: Employee.column_names,
      department_columns: Department.column_names
    }.to_json
  end

  # Employee endpoint to create a new employee
  post '/api/v1/addEmployees' do
    raw_body = request.body.read
    puts "Raw body: #{raw_body}"  # Log the raw body

    # Check if the body is empty
    if raw_body.empty?
      status 400
      return { error: "Request body is empty." }.to_json
    end

    data = JSON.parse(raw_body) # Parse the JSON body
    puts "Received params: #{data.inspect}"

    # Validate presence of required fields
    required_fields = %w[first_name last_name age position department_id]
    missing_fields = required_fields.select do |field|
      value = data[field]
      value.nil? || (value.is_a?(String) && value.empty?)
    end
    
    unless missing_fields.empty?
      status 400
      return { error: "Missing fields: #{missing_fields.join(', ')}" }.to_json
    end

    # Resolve department_id from department name
    department = Department.find_by(name: data['department_id'])
    if department.nil?
      status 400
      return { error: "Invalid department name." }.to_json
    end
    data['department_id'] = department.id

    # Check for duplicate employee in the same department
    existing_employee = Employee.find_by(
      first_name: data['first_name'],
      last_name: data['last_name'],
      department_id: data['department_id']
    )

    if existing_employee
      status 409
      return { error: "Employee with the same name already exists in this department." }.to_json
    end

    # Create the new employee
    employee = Employee.new(data)
    if employee.save
      status 201
      employee.to_json
    else
      puts "Error saving employee: #{employee.errors.full_messages}" # Log the errors
      status 422
      { error: employee.errors.full_messages }.to_json
    end
  end

end
