// Mock Departments
export const mockDepartments = [
  {
    id: '1',
    name: 'Engineering',
    description: 'Software development and engineering team',
    manager: 'John Doe',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    employee_count: 15,
    active_tasks: 8
  },
  {
    id: '2',
    name: 'Marketing',
    description: 'Marketing and communications team',
    manager: 'Jane Smith',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    employee_count: 10,
    active_tasks: 5
  },
  {
    id: '3',
    name: 'Human Resources',
    description: 'HR and recruitment team',
    manager: 'Mike Johnson',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    employee_count: 8,
    active_tasks: 3
  }
];

// Mock Department Performance Data
export const mockDepartmentPerformance = {
  '1': {
    totalTasks: 50,
    completedTasks: 35,
    performance: 70,
    topPerformers: [
      {
        id: '101',
        first_name: 'Alice',
        last_name: 'Cooper',
        completed_tasks: 15,
        completion_rate: 95
      },
      {
        id: '102',
        first_name: 'Bob',
        last_name: 'Wilson',
        completed_tasks: 12,
        completion_rate: 90
      }
    ]
  },
  '2': {
    totalTasks: 30,
    completedTasks: 20,
    performance: 66.67,
    topPerformers: [
      {
        id: '201',
        first_name: 'Carol',
        last_name: 'Davis',
        completed_tasks: 10,
        completion_rate: 88
      },
      {
        id: '202',
        first_name: 'David',
        last_name: 'Brown',
        completed_tasks: 8,
        completion_rate: 85
      }
    ]
  },
  '3': {
    totalTasks: 25,
    completedTasks: 18,
    performance: 72,
    topPerformers: [
      {
        id: '301',
        first_name: 'Eve',
        last_name: 'Martin',
        completed_tasks: 9,
        completion_rate: 92
      },
      {
        id: '302',
        first_name: 'Frank',
        last_name: 'Taylor',
        completed_tasks: 7,
        completion_rate: 87
      }
    ]
  }
};

// Mock Department Tasks
export const mockDepartmentTasks = {
  '1': [
    {
      id: '1',
      title: 'Implement new feature',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      due_date: '2024-03-30'
    },
    {
      id: '2',
      title: 'Fix bugs in production',
      status: 'DONE',
      priority: 'HIGH',
      due_date: '2024-03-15'
    }
  ],
  '2': [
    {
      id: '3',
      title: 'Launch social media campaign',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      due_date: '2024-03-25'
    }
  ],
  '3': [
    {
      id: '4',
      title: 'Conduct interviews',
      status: 'PENDING',
      priority: 'MEDIUM',
      due_date: '2024-03-28'
    }
  ]
}; 