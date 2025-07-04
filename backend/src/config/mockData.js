const mockUsers = [
    {
      id: '1',
      username: 'user1',
      password: 'password123', // In real app, this should be hashed
      role: 'user',
      email: 'user1@company.com'
    },
    {
      id: '2',
      username: 'purchase1',
      password: 'password123',
      role: 'purchase',
      email: 'purchase1@company.com'
    }
  ];
  
  const mockItems = [
    {
      id: '1',
      name: 'Network Cable',
      category: 'setup',
      description: 'Cat6 Ethernet cable for network setup',
      price: 15.99,
      inStock: true,
      image: '/assets/images/network-cable.jpg'
    },
    {
      id: '2',
      name: 'Router Configuration',
      category: 'setup',
      description: 'Professional router setup and configuration',
      price: 120.00,
      inStock: true,
      image: '/assets/images/router.jpg'
    },
    {
      id: '3',
      name: 'Office Supplies',
      category: 'oth',
      description: 'General office supplies package',
      price: 45.50,
      inStock: true,
      image: '/assets/images/office-supplies.jpg'
    },
    {
      id: '4',
      name: 'Printer Maintenance',
      category: 'maintenance',
      description: 'Regular printer maintenance service',
      price: 80.00,
      inStock: true,
      image: '/assets/images/printer-maintenance.jpg'
    },
    {
      id: '5',
      name: 'Server Monitoring',
      category: 'maintenance',
      description: 'Monthly server monitoring service',
      price: 200.00,
      inStock: true,
      image: '/assets/images/server-monitoring.jpg'
    }
  ];
  
  const mockCarts = new Map();
  const mockRequests = new Map();
  const mockNotifications = new Map();
  
  module.exports = {
    mockUsers,
    mockItems,
    mockCarts,
    mockRequests,
    mockNotifications
  };