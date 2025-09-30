/**
 * DataService - Handles API calls for all data models
 * Provides a unified interface for CRUD operations across all models
 */

class DataService {
  constructor() {
    this.baseUrl = '/api';
  }

  // Generic API call method
  async apiCall(endpoint, options = {}) {
    // For now, return mock data instead of making real API calls
    // This prevents the error when API endpoints don't exist
    console.log(`Mock API call: ${endpoint}`, options);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return mock data based on endpoint
    return this.getMockData(endpoint, options);
  }

  // Mock data generator
  getMockData(endpoint, options = {}) {
    const mockData = {
      // Organisations
      '/organisations': {
        organisations: [
          { id: '1', name: 'Cigno Consulting', industry: 'Professional Services', created_at: '2024-01-01' }
        ]
      },
      
      // Users
      '/users': {
        users: [
          { id: '1', name: 'Sarah Johnson', email: 'sarah@cigno.com', role: 'Senior Consultant', created_at: '2024-01-01' },
          { id: '2', name: 'Michael Chen', email: 'michael@cigno.com', role: 'Principal Consultant', created_at: '2024-01-15' }
        ]
      },
      
      // Clients
      '/clients': {
        clients: [
          { 
            id: '1', 
            name: 'Global Banking Corp', 
            industry: 'Financial Services',
            status: 'active',
            created_at: '2024-01-01',
            children: [
              {
                id: '1',
                type: 'project',
                title: 'CBDC Implementation Strategy',
                status: 'active',
                created_at: '2024-01-15',
                children: [
                  {
                    id: '1',
                    type: 'deliverable',
                    title: 'CBDC Strategy Presentation',
                    status: 'active',
                    created_at: '2024-01-20',
                    metadata: { status: 'Active' }
                  },
                  {
                    id: '2',
                    type: 'deliverable',
                    title: 'Technical Report',
                    status: 'not_started',
                    created_at: '2024-01-20',
                    metadata: { status: 'Not Started' }
                  },
                  {
                    id: '3',
                    type: 'deliverable',
                    title: 'Implementation Roadmap',
                    status: 'not_started',
                    created_at: '2024-01-20',
                    metadata: { status: 'Not Started' }
                  }
                ]
              }
            ]
          }
        ]
      },
      
      // Projects
      '/projects': {
        projects: [
          { 
            id: '1', 
            name: 'CBDC Implementation Strategy', 
            client_owner: '1',
            status: 'active',
            created_at: '2024-01-15'
          }
        ]
      },
      
      // Deliverables
      '/deliverables': {
        deliverables: [
          { 
            id: '1', 
            name: 'CBDC Strategy Presentation', 
            project: '1',
            status: 'active',
            created_at: '2024-01-20'
          },
          { 
            id: '2', 
            name: 'Technical Report', 
            project: '1',
            status: 'not_started',
            created_at: '2024-01-20'
          },
          { 
            id: '3', 
            name: 'Implementation Roadmap', 
            project: '1',
            status: 'not_started',
            created_at: '2024-01-20'
          }
        ]
      },
      
      // Contacts
      '/contacts': {
        contacts: [
          { 
            id: '1', 
            name: 'John Smith', 
            email: 'john.smith@globalbanking.com',
            client: '1',
            role: 'CTO',
            created_at: '2024-01-01'
          }
        ]
      },
      
      // Menu items (legacy)
      '/menu': {
        menuItems: []
      }
    };

    // Handle different HTTP methods
    if (options.method === 'POST') {
      return { success: true, message: 'Item created successfully' };
    } else if (options.method === 'PUT') {
      return { success: true, message: 'Item updated successfully' };
    } else if (options.method === 'DELETE') {
      return { success: true, message: 'Item deleted successfully' };
    }

    // Return GET data
    return mockData[endpoint] || { error: 'Endpoint not found' };
  }

  // Organisation methods
  async getOrganisations() {
    return this.apiCall('/organisations');
  }

  async createOrganisation(organisationData) {
    return this.apiCall('/organisations', {
      method: 'POST',
      body: JSON.stringify(organisationData)
    });
  }

  async updateOrganisation(id, organisationData) {
    return this.apiCall(`/organisations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(organisationData)
    });
  }

  async deleteOrganisation(id) {
    return this.apiCall(`/organisations/${id}`, {
      method: 'DELETE'
    });
  }

  // User methods
  async getUsers() {
    return this.apiCall('/users');
  }

  async createUser(userData) {
    return this.apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async updateUser(id, userData) {
    return this.apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async deleteUser(id) {
    return this.apiCall(`/users/${id}`, {
      method: 'DELETE'
    });
  }

  // Client methods
  async getClients() {
    return this.apiCall('/clients');
  }

  async createClient(clientData) {
    return this.apiCall('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData)
    });
  }

  async updateClient(id, clientData) {
    return this.apiCall(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clientData)
    });
  }

  async deleteClient(id) {
    return this.apiCall(`/clients/${id}`, {
      method: 'DELETE'
    });
  }

  // Project methods
  async getProjects() {
    return this.apiCall('/projects');
  }

  async createProject(projectData) {
    return this.apiCall('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
  }

  async updateProject(id, projectData) {
    return this.apiCall(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData)
    });
  }

  async deleteProject(id) {
    return this.apiCall(`/projects/${id}`, {
      method: 'DELETE'
    });
  }

  // Deliverable methods
  async getDeliverables() {
    return this.apiCall('/deliverables');
  }

  async createDeliverable(deliverableData) {
    return this.apiCall('/deliverables', {
      method: 'POST',
      body: JSON.stringify(deliverableData)
    });
  }

  async updateDeliverable(id, deliverableData) {
    return this.apiCall(`/deliverables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(deliverableData)
    });
  }

  async deleteDeliverable(id) {
    return this.apiCall(`/deliverables/${id}`, {
      method: 'DELETE'
    });
  }

  // Contact methods
  async getContacts() {
    return this.apiCall('/contacts');
  }

  async createContact(contactData) {
    return this.apiCall('/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData)
    });
  }

  async updateContact(id, contactData) {
    return this.apiCall(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contactData)
    });
  }

  async deleteContact(id) {
    return this.apiCall(`/contacts/${id}`, {
      method: 'DELETE'
    });
  }

  // Legacy MenuItem methods (for backward compatibility)
  async getMenuItems() {
    return this.apiCall('/menu');
  }

  async createMenuItem(itemData) {
    return this.apiCall('/menu', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
  }

  async updateMenuItem(id, itemData) {
    return this.apiCall('/menu', {
      method: 'PUT',
      body: JSON.stringify({ id, ...itemData })
    });
  }

  async deleteMenuItem(id) {
    return this.apiCall('/menu', {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
  }

  // Utility methods
  async getAllData() {
    try {
      const [organisations, users, clients, projects, deliverables, contacts] = await Promise.all([
        this.getOrganisations(),
        this.getUsers(),
        this.getClients(),
        this.getProjects(),
        this.getDeliverables(),
        this.getContacts()
      ]);

      return {
        organisations: organisations.organisations || [],
        users: users.users || [],
        clients: clients.clients || [],
        projects: projects.projects || [],
        deliverables: deliverables.deliverables || [],
        contacts: contacts.contacts || []
      };
    } catch (error) {
      console.error('Error fetching all data:', error);
      throw error;
    }
  }

  // Search and filter methods
  async searchClients(query) {
    const clients = await this.getClients();
    return clients.clients.filter(client => 
      client.name.toLowerCase().includes(query.toLowerCase()) ||
      client.industry.toLowerCase().includes(query.toLowerCase())
    );
  }

  async searchProjects(query) {
    const projects = await this.getProjects();
    return projects.projects.filter(project => 
      project.name.toLowerCase().includes(query.toLowerCase()) ||
      project.description.toLowerCase().includes(query.toLowerCase())
    );
  }

  async searchDeliverables(query) {
    const deliverables = await this.getDeliverables();
    return deliverables.deliverables.filter(deliverable => 
      deliverable.name.toLowerCase().includes(query.toLowerCase()) ||
      deliverable.brief.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Get related data methods
  async getProjectsByClient(clientId) {
    const projects = await this.getProjects();
    return projects.projects.filter(project => project.client_owner === clientId);
  }

  async getDeliverablesByProject(projectId) {
    const deliverables = await this.getDeliverables();
    return deliverables.deliverables.filter(deliverable => deliverable.project === projectId);
  }

  async getContactsByClient(clientId) {
    const contacts = await this.getContacts();
    return contacts.contacts.filter(contact => contact.client === clientId);
  }

  // Statistics methods
  async getStatistics() {
    try {
      const data = await this.getAllData();
      
      return {
        totalOrganisations: data.organisations.length,
        totalUsers: data.users.length,
        totalClients: data.clients.length,
        totalProjects: data.projects.length,
        totalDeliverables: data.deliverables.length,
        totalContacts: data.contacts.length,
        
        activeProjects: data.projects.filter(p => p.status === 'active').length,
        completedProjects: data.projects.filter(p => p.status === 'completed').length,
        
        overdueDeliverables: data.deliverables.filter(d => {
          const dueDate = new Date(d.due_date);
          const now = new Date();
          return dueDate < now && !['completed', 'delivered'].includes(d.status);
        }).length,
        
        completedDeliverables: data.deliverables.filter(d => 
          ['completed', 'delivered'].includes(d.status)
        ).length
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const dataService = new DataService();
export default dataService;
