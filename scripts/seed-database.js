import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/lib/models/User.js';
import Organisation from '../src/lib/models/Organisation.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create test organization first
    console.log('Creating test organization...');
    const testOrg = new Organisation({
      name: 'Test Organization',
      website: 'https://testorg.com',
      locations: ['New York', 'San Francisco'],
      industry: 'Technology',
      admin: new mongoose.Types.ObjectId(), // Temporary, will update after creating admin user
      tags: ['startup', 'tech', 'innovation'],
      billing_info: {
        company_name: 'Test Organization LLC',
        billing_address: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'CA',
          postal_code: '12345',
          country: 'USA'
        },
        tax_id: 'TEST123456789',
        payment_terms: 'net_30',
        currency: 'USD',
        billing_contact: {
          name: 'John Doe',
          email: 'billing@testorg.com',
          phone: '+1-555-123-4567'
        },
        invoice_email: 'invoices@testorg.com'
      },
      created_by: new mongoose.Types.ObjectId(),
      updated_by: new mongoose.Types.ObjectId()
    });

    const savedOrg = await testOrg.save();
    console.log('Test organization created:', savedOrg._id);

    // Create test users
    console.log('Creating test users...');
    
    const testUsers = [
      {
        first_name: 'John',
        last_name: 'Doe',
        job_title: 'CEO',
        location: 'New York, NY',
        phone_number: '+1-555-123-4567',
        email_address: 'john.doe@testorg.com',
        linkedin_url: 'https://linkedin.com/in/johndoe',
        bio: 'Experienced CEO with 15+ years in technology leadership.',
        languages_spoken: ['English', 'Spanish'],
        industry_expertise: ['Technology', 'Startups'],
        area_of_expertise: ['Leadership', 'Strategy', 'Product Development'],
        tags: ['ceo', 'leader', 'tech'],
        password: 'password123',
        organisation: savedOrg._id,
        created_by: savedOrg._id,
        updated_by: savedOrg._id
      },
      {
        first_name: 'Jane',
        last_name: 'Smith',
        job_title: 'CTO',
        location: 'San Francisco, CA',
        phone_number: '+1-555-987-6543',
        email_address: 'jane.smith@testorg.com',
        linkedin_url: 'https://linkedin.com/in/janesmith',
        bio: 'Technology leader with expertise in scalable systems and team building.',
        languages_spoken: ['English', 'French'],
        industry_expertise: ['Technology', 'Software Development'],
        area_of_expertise: ['Architecture', 'Team Management', 'DevOps'],
        tags: ['cto', 'developer', 'tech'],
        password: 'password123',
        organisation: savedOrg._id,
        created_by: savedOrg._id,
        updated_by: savedOrg._id
      },
      {
        first_name: 'Mike',
        last_name: 'Johnson',
        job_title: 'Senior Developer',
        location: 'Austin, TX',
        phone_number: '+1-555-456-7890',
        email_address: 'mike.johnson@testorg.com',
        linkedin_url: 'https://linkedin.com/in/mikejohnson',
        bio: 'Full-stack developer passionate about clean code and user experience.',
        languages_spoken: ['English'],
        industry_expertise: ['Technology', 'Web Development'],
        area_of_expertise: ['React', 'Node.js', 'MongoDB'],
        tags: ['developer', 'fullstack', 'react'],
        password: 'password123',
        organisation: savedOrg._id,
        created_by: savedOrg._id,
        updated_by: savedOrg._id
      },
      {
        first_name: 'Sarah',
        last_name: 'Wilson',
        job_title: 'Product Manager',
        location: 'Seattle, WA',
        phone_number: '+1-555-321-0987',
        email_address: 'sarah.wilson@testorg.com',
        linkedin_url: 'https://linkedin.com/in/sarahwilson',
        bio: 'Product manager focused on user-centric design and data-driven decisions.',
        languages_spoken: ['English', 'German'],
        industry_expertise: ['Technology', 'Product Management'],
        area_of_expertise: ['Product Strategy', 'UX Design', 'Analytics'],
        tags: ['product', 'manager', 'ux'],
        password: 'password123',
        organisation: savedOrg._id,
        created_by: savedOrg._id,
        updated_by: savedOrg._id
      }
    ];

    const createdUsers = [];
    for (const userData of testUsers) {
      const user = new User(userData);
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`Created user: ${savedUser.full_name} (${savedUser.email_address})`);
    }

    // Update organization with admin and users
    console.log('Updating organization with admin and users...');
    savedOrg.admin = createdUsers[0]._id; // Make John Doe the admin
    savedOrg.users = createdUsers.map(user => user._id);
    savedOrg.created_by = createdUsers[0]._id;
    savedOrg.updated_by = createdUsers[0]._id;
    await savedOrg.save();

    console.log('\n✅ Database seeded successfully!');
    console.log('\nCreated:');
    console.log(`- Organization: ${savedOrg.name} (ID: ${savedOrg._id})`);
    console.log(`- Users: ${createdUsers.length}`);
    createdUsers.forEach(user => {
      console.log(`  - ${user.full_name} (${user.job_title}) - ${user.email_address}`);
    });

    console.log('\n📧 Test credentials:');
    console.log('Email: john.doe@testorg.com');
    console.log('Password: password123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedDatabase();