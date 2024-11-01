require './app'
require 'rack/cors'

use Rack::Cors do
  allow do
    origins '*'
    resource '*', headers: :any, methods: %i[get post delete put options]
  end
end

run EmployeeDirectoryApp
