## Keyhook Interview Task

### Overview

Our stack comprises of a rails backend using Graphiti to power our API. And a separate ReactJS app that powers our web and mobile apps ( we use CapacitorJS for our mobile app ).

We have prepared this small test as a way of checking how you can tackle some of the more day to day tasks we face when building out platform. This is a heavily slimmed down and simplified version of a part of our app.

### Task

We have provided you with a simple Sinatra.rb backend API that uses Graphiti. It holds 2 data models, Employees and Departments.
The backend will seed itself with data the first time you run it.

Please note that if you are using a Windows machine, you may run into issues with the sqlite3 gem.
We recommend either using a Mac or Linux machine to complete the test. Or spinning up an Linux VM ( such as ubuntu ) on your PC.
You may also consider using a docker container to run the backend if you have experience with docker.

To run the backend:

```bash
bundle install
bundle exec rackup -p 4567
```

The frontend folder has a Typescript+React app ready to go, it is using vite for bundling / running the app.
To run just:

```
yarn install
yarn dev
```

The React app should be a single page ( no routing needed ), that satisfies the following criteria.

- Uses the Tanstack table library to show a list of employees from the API.
  - The table should show these columns:
    - First Name
    - Last Name
    - Age
    - Position
    - Department Name
- You can use the Spraypaint.js library or another JSONAPI library if you'd like.
- The table should have some basic styling applied with tailwind css.
- Table data should be paginated.
- Sorting should be enabled on the first_name,last_name, age, position columns.
- Add a search bar that allows typing in a name and filters the records by a custom graphiti name filter.
  - This filter should search across both the first_name and last_name columns.
- You will need to add the graphiti resource for Employees.

All sorting,paginating and filtering should happen through the server side query and should not be done on the frontend.

Our app is entirely built on React hooks, so please be sure to use hooks and functional components instead of class components.

You are free to use any other packages you would like to use to build the frontend.
You are free to use any documentation or google anything you might not know.

### Bonus

What if we wanted to filter our table to only show employees in a certain Department? We could flip the query around and query for the certain Department and then load in the employees for that department.

Or we could split the query into 2 queries, first querying for the department and then use the department id to filter the employees.

However both of these options have drawbacks. Instead we'd like to just be able to filter the Employee Resource by the department name.

Can you add a select box with the list of department names. When a department name is selected, it should filter the employees by that department name ( not department id ).

Note that you will need to add in code into the Graphiti resource to make this work as well.

### Bonus 2

Add a button into the frontend that shows a form ( you can choose how to present this, a modal might be a good idea ).
The form should allow you to add a new employee to the database, and then show the new employee in the table.
Add any validations to the backend that you think would be appropriate.
Add a validation to the backend to check that an employee does with the same name does not already exist in that department. ( I know multiple people can have the same name, but this is just for testing purposes).

### Things we will evaluate

- Has the criteria been met.
- What packages were used and how were they used.
- Are queries optimised? ( No n+1 queries or useEffects firing sporadically)
- Code style and commenting.
- Use of Typescript types.
- Can you discuss, rationalise and explain choices you have made.

### Links

- [Graphiti](https://www.graphiti.dev/)
- [Spraypaint.js](https://www.graphiti.dev/js)
- [Tanstack Table](https://tanstack.com/table/v7)
- [Tailwind.css](https://tailwindcss.com/)

### Contact

If you have any questions or if anything needs clarifying, please contact me at aaron.rama@keyhook.com
