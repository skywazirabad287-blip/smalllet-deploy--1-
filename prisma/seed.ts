import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create landlord user
  const hashedPassword = await bcrypt.hash("password123", 12);
  const landlord = await prisma.user.create({
    data: {
      name: "Demo Landlord",
      email: "demo@smalllet.app",
      password: hashedPassword,
      role: "LANDLORD",
      onboardingCompleted: true,
      subscriptionTier: "PRO",
      subscriptionStatus: "ACTIVE",
    },
  });

  console.log("✅ Created landlord:", landlord.email);

  // Create landlord settings
  await prisma.landlordSettings.create({
    data: {
      landlordId: landlord.id,
      defaultLateFee: 50,
      defaultGracePeriod: 3,
      autoChargeEnabled: false,
      reminderDays: [3, 1],
      currency: "USD",
      timezone: "America/New_York",
    },
  });

  // Create properties
  const property1 = await prisma.property.create({
    data: {
      landlordId: landlord.id,
      name: "Sunset Apartments",
      address: "123 Main Street",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      country: "US",
      type: "MULTIFAMILY",
      status: "ACTIVE",
      description: "A charming 4-unit multifamily property in downtown Austin",
      amenities: ["Parking", "Laundry", "Patio", "Storage"],
      bedrooms: 8,
      bathrooms: 4,
      squareFeet: 3200,
      yearBuilt: 1985,
    },
  });

  const property2 = await prisma.property.create({
    data: {
      landlordId: landlord.id,
      name: "Oakwood House",
      address: "456 Oak Avenue",
      city: "Dallas",
      state: "TX",
      zipCode: "75201",
      country: "US",
      type: "SINGLE_FAMILY",
      status: "ACTIVE",
      description: "Beautiful single-family home with a large backyard",
      amenities: ["Garage", "Garden", "Fireplace", "Central AC"],
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1800,
      yearBuilt: 2005,
    },
  });

  console.log("✅ Created properties");

  // Create units for property 1
  const units1 = await Promise.all([
    prisma.unit.create({
      data: {
        propertyId: property1.id,
        unitNumber: "A",
        rentAmount: 1200,
        depositAmount: 1200,
        status: "OCCUPIED",
        bedrooms: 2,
        bathrooms: 1,
        squareFeet: 800,
        amenities: ["Balcony", "Dishwasher"],
      },
    }),
    prisma.unit.create({
      data: {
        propertyId: property1.id,
        unitNumber: "B",
        rentAmount: 1400,
        depositAmount: 1400,
        status: "OCCUPIED",
        bedrooms: 2,
        bathrooms: 1,
        squareFeet: 850,
        amenities: ["Balcony", "Dishwasher", "Walk-in Closet"],
      },
    }),
    prisma.unit.create({
      data: {
        propertyId: property1.id,
        unitNumber: "C",
        rentAmount: 1100,
        depositAmount: 1100,
        status: "VACANT",
        bedrooms: 1,
        bathrooms: 1,
        squareFeet: 600,
        amenities: ["Dishwasher"],
      },
    }),
    prisma.unit.create({
      data: {
        propertyId: property1.id,
        unitNumber: "D",
        rentAmount: 1500,
        depositAmount: 1500,
        status: "OCCUPIED",
        bedrooms: 2,
        bathrooms: 2,
        squareFeet: 950,
        amenities: ["Balcony", "Dishwasher", "Fireplace"],
      },
    }),
  ]);

  // Create unit for property 2
  const unit2 = await prisma.unit.create({
    data: {
      propertyId: property2.id,
      unitNumber: "Main",
      rentAmount: 2200,
      depositAmount: 2200,
      status: "OCCUPIED",
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1800,
      amenities: ["Garage", "Garden", "Fireplace", "Central AC"],
    },
  });

  console.log("✅ Created units");

  // Create tenants
  const tenants = await Promise.all([
    prisma.tenant.create({
      data: {
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.j@email.com",
        phone: "(512) 555-0101",
        emergencyName: "Mike Johnson",
        emergencyPhone: "(512) 555-0102",
        emergencyRelation: "Brother",
        notes: "Great tenant, always pays on time",
      },
    }),
    prisma.tenant.create({
      data: {
        firstName: "David",
        lastName: "Chen",
        email: "david.chen@email.com",
        phone: "(512) 555-0201",
        emergencyName: "Lisa Chen",
        emergencyPhone: "(512) 555-0202",
        emergencyRelation: "Spouse",
        creditScore: 740,
        notes: "Software engineer, reliable",
      },
    }),
    prisma.tenant.create({
      data: {
        firstName: "Maria",
        lastName: "Garcia",
        email: "maria.g@email.com",
        phone: "(214) 555-0301",
        emergencyName: "Carlos Garcia",
        emergencyPhone: "(214) 555-0302",
        emergencyRelation: "Father",
        creditScore: 680,
      },
    }),
    prisma.tenant.create({
      data: {
        firstName: "James",
        lastName: "Wilson",
        email: "james.w@email.com",
        phone: "(512) 555-0401",
        emergencyName: "Emily Wilson",
        emergencyPhone: "(512) 555-0402",
        emergencyRelation: "Mother",
        notes: "Has a small dog (approved)",
      },
    }),
  ]);

  console.log("✅ Created tenants");

  // Create leases
  const now = new Date();
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  const sixMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());

  const leases = await Promise.all([
    prisma.lease.create({
      data: {
        tenantId: tenants[0].id,
        unitId: units1[0].id,
        propertyId: property1.id,
        startDate: new Date(2024, 0, 1),
        endDate: oneYearFromNow,
        rentAmount: 1200,
        depositAmount: 1200,
        status: "ACTIVE",
        autoRenew: true,
      },
    }),
    prisma.lease.create({
      data: {
        tenantId: tenants[1].id,
        unitId: units1[1].id,
        propertyId: property1.id,
        startDate: new Date(2024, 2, 1),
        endDate: new Date(2025, 2, 1),
        rentAmount: 1400,
        depositAmount: 1400,
        status: "ACTIVE",
        autoRenew: false,
      },
    }),
    prisma.lease.create({
      data: {
        tenantId: tenants[2].id,
        unitId: unit2.id,
        propertyId: property2.id,
        startDate: new Date(2024, 1, 15),
        endDate: sixMonthsFromNow,
        rentAmount: 2200,
        depositAmount: 2200,
        status: "ACTIVE",
        autoRenew: true,
      },
    }),
    prisma.lease.create({
      data: {
        tenantId: tenants[3].id,
        unitId: units1[3].id,
        propertyId: property1.id,
        startDate: new Date(2024, 3, 1),
        endDate: new Date(2025, 3, 1),
        rentAmount: 1500,
        depositAmount: 1500,
        status: "ACTIVE",
        autoRenew: false,
      },
    }),
  ]);

  console.log("✅ Created leases");

  // Create rent charges
  for (const lease of leases) {
    const charges = [];
    let currentDate = new Date(lease.startDate);
    const endDate = new Date(lease.endDate);

    while (currentDate <= endDate) {
      const isPaid = currentDate < now && Math.random() > 0.2;
      const isOverdue = currentDate < now && !isPaid && currentDate.getMonth() !== now.getMonth();

      charges.push({
        leaseId: lease.id,
        amount: parseFloat(lease.rentAmount.toString()),
        dueDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 5),
        description: `Rent for ${currentDate.toLocaleString("default", { month: "long", year: "numeric" })}`,
       status: (isPaid ? "PAID" : isOverdue ? "OVERDUE" : "PENDING") as any,
        paidAmount: isPaid ? parseFloat(lease.rentAmount.toString()) : 0,
        lateFeeApplied: isOverdue,
        lateFeeAmount: isOverdue ? 50 : 0,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    await prisma.rentCharge.createMany({ data: charges });
  }

  console.log("✅ Created rent charges");

  // Create payments
  const completedCharges = await prisma.rentCharge.findMany({
    where: { status: "PAID" },
  });

  for (const charge of completedCharges) {
    await prisma.payment.create({
           data: {
        landlordId: "user_123", // Add this line
        tenantId: charge.leaseId === leases[0].id ? tenants[0].id :
                  charge.leaseId === leases[1].id ? tenants[1].id :
                  charge.leaseId === leases[2].id ? tenants[2].id : tenants[3].id,
        leaseId: charge.leaseId,
        rentChargeId: charge.id,
        amount: charge.amount,
        status: "COMPLETED",
        type: "RENT",
        method: Math.random() > 0.5 ? "CARD" : "BANK_TRANSFER",
        processedAt: new Date(charge.dueDate.getTime() + 86400000),
        receiptNumber: `RCP-${Math.floor(Math.random() * 10000)}`,
      },
    });
  }

  console.log("✅ Created payments");

  // Create maintenance requests
  await Promise.all([
    prisma.maintenanceRequest.create({
      data: {
        tenantId: tenants[0].id,
        unitId: units1[0].id,
        propertyId: property1.id,
        title: "Leaky faucet in kitchen",
        description: "The kitchen sink faucet has been dripping constantly for the past week.",
        category: "PLUMBING",
        priority: "MEDIUM",
        status: "IN_PROGRESS",
        photos: [],
      },
    }),
    prisma.maintenanceRequest.create({
      data: {
        tenantId: tenants[1].id,
        unitId: units1[1].id,
        propertyId: property1.id,
        title: "AC not cooling properly",
        description: "The air conditioner is running but not cooling the apartment effectively.",
        category: "HVAC",
        priority: "HIGH",
        status: "APPROVED",
        photos: [],
      },
    }),
    prisma.maintenanceRequest.create({
      data: {
        tenantId: tenants[3].id,
        unitId: units1[3].id,
        propertyId: property1.id,
        title: "Broken light fixture in hallway",
        description: "The hallway light fixture is flickering and needs replacement.",
        category: "ELECTRICAL",
        priority: "LOW",
        status: "SUBMITTED",
        photos: [],
      },
    }),
  ]);

  console.log("✅ Created maintenance requests");

  // Create expenses
  await Promise.all([
    prisma.expense.create({
      data: {
        landlordId: landlord.id,
        propertyId: property1.id,
        unitId: units1[0].id,
        category: "MAINTENANCE",
        amount: 150,
        description: "Plumber visit - kitchen faucet repair",
        date: new Date(2024, 4, 10),
        vendor: "Quick Fix Plumbing",
        taxDeductible: true,
      },
    }),
    prisma.expense.create({
      data: {
        landlordId: landlord.id,
        propertyId: property1.id,
        category: "UTILITIES",
        amount: 280,
        description: "Water bill - May 2024",
        date: new Date(2024, 4, 15),
        taxDeductible: true,
      },
    }),
    prisma.expense.create({
      data: {
        landlordId: landlord.id,
        propertyId: property2.id,
        category: "INSURANCE",
        amount: 1200,
        description: "Annual property insurance premium",
        date: new Date(2024, 0, 1),
        taxDeductible: true,
      },
    }),
    prisma.expense.create({
      data: {
        landlordId: landlord.id,
        propertyId: property1.id,
        category: "REPAIRS",
        amount: 450,
        description: "HVAC maintenance and filter replacement",
        date: new Date(2024, 3, 20),
        vendor: "Cool Air Services",
        taxDeductible: true,
      },
    }),
  ]);

  console.log("✅ Created expenses");

  // Create vendors
  await Promise.all([
    prisma.vendor.create({
      data: {
        landlordId: landlord.id,
        name: "Mike Rodriguez",
        company: "Quick Fix Plumbing",
        email: "mike@quickfixplumbing.com",
        phone: "(512) 555-1001",
        specialties: ["Plumbing", "Emergency Repairs"],
        rating: 4.8,
      },
    }),
    prisma.vendor.create({
      data: {
        landlordId: landlord.id,
        name: "Cool Air Services LLC",
        company: "Cool Air Services",
        email: "service@coolair.com",
        phone: "(512) 555-2001",
        specialties: ["HVAC", "AC Repair", "Heating"],
        rating: 4.5,
      },
    }),
    prisma.vendor.create({
      data: {
        landlordId: landlord.id,
        name: "Bright Spark Electric",
        company: "Bright Spark Electric",
        email: "jobs@brightspark.com",
        phone: "(214) 555-3001",
        specialties: ["Electrical", "Lighting", "Wiring"],
        rating: 4.9,
      },
    }),
  ]);

  console.log("✅ Created vendors");

  // Create email templates
  await Promise.all([
    prisma.emailTemplate.create({
      data: {
        landlordId: landlord.id,
        name: "Rent Reminder",
        subject: "Rent Due Soon - {{propertyName}}",
        body: `Hi {{tenantName}},<br><br>This is a friendly reminder that your rent of {{amount}} for {{propertyName}} is due on {{dueDate}}.<br><br>Please make your payment through the tenant portal or contact us if you have any questions.<br><br>Best regards,<br>SmallLet Team`,
        variables: ["tenantName", "propertyName", "amount", "dueDate"],
        isDefault: true,
      },
    }),
    prisma.emailTemplate.create({
      data: {
        landlordId: landlord.id,
        name: "Late Rent Notice",
        subject: "URGENT: Overdue Rent - {{propertyName}}",
        body: `Hi {{tenantName}},<br><br>Your rent payment of {{amount}} was due on {{dueDate}} and is now {{daysOverdue}} days overdue.<br><br>Please submit your payment immediately to avoid additional late fees.<br><br>Best regards,<br>SmallLet Team`,
        variables: ["tenantName", "propertyName", "amount", "dueDate", "daysOverdue"],
        isDefault: true,
      },
    }),
  ]);

  console.log("✅ Created email templates");

  // Create activity logs
  await prisma.activityLog.createMany({
    data: [
      {
        userId: landlord.id,
        action: "PROPERTY_CREATED",
        entityType: "Property",
        entityId: property1.id,
        details: { name: property1.name },
      },
      {
        userId: landlord.id,
        action: "PROPERTY_CREATED",
        entityType: "Property",
        entityId: property2.id,
        details: { name: property2.name },
      },
      {
        userId: landlord.id,
        action: "TENANT_CREATED",
        entityType: "Tenant",
        entityId: tenants[0].id,
        details: { name: `${tenants[0].firstName} ${tenants[0].lastName}` },
      },
      {
        userId: landlord.id,
        action: "LEASE_CREATED",
        entityType: "Lease",
        entityId: leases[0].id,
        details: { tenantId: tenants[0].id, unitId: units1[0].id },
      },
    ],
  });

  console.log("✅ Created activity logs");

  console.log("\n🎉 Seed completed successfully!");
  console.log("\nDemo credentials:");
  console.log("Email: demo@smalllet.app");
  console.log("Password: password123");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
