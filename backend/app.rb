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

# require_relative './models/department'
# require_relative './models/employee'

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

  # Add the inverse relationship
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
  
  # Add a computed attribute for department name
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

  get '/api/v1/departments/:id' do
    departments = DepartmentResource.find(params)
    departments.to_jsonapi
  end

  # Employee endpoint
  get '/api/v1/employees' do
    employees = EmployeeResource.all(params)
    employees.to_jsonapi
  end

  get '/api/v1/employees/:id' do
    employee = EmployeeResource.find(params)
    employee.to_jsonapi
  end

  # Debug endpoint
  get '/debug/data' do
    content_type :json
    {
      employees: Employee.all.as_json,
      departments: Department.all.as_json
    }.to_json
  end

  # Schema endpoint
  get '/debug/schema' do
    content_type :json
    {
      employee_columns: Employee.column_names,
      department_columns: Department.column_names
    }.to_json
  end
end