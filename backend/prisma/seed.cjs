/**
 * Seed test data. Loads .env.local then runs.
 * Run: npm run db:seed  (or npx prisma db seed after setting DATABASE_URL)
 */
const path = require('path');
const envName = process.env.ENV || 'local';
const envPath = path.resolve(__dirname, '..', `.env.${envName}`);
require('dotenv').config({ path: envPath });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const TEST_PASSWORD = 'password123';

async function main() {
  const hash = await bcrypt.hash(TEST_PASSWORD, 12);

  // ----- Users (upsert by email) -----
  const customer = await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      email: 'customer@test.com',
      passwordHash: hash,
      name: 'Test Customer',
      phone: '+15550001111',
      role: 'CUSTOMER',
    },
  });

  const provider = await prisma.user.upsert({
    where: { email: 'provider@test.com' },
    update: {},
    create: {
      email: 'provider@test.com',
      passwordHash: hash,
      name: 'Alex Cleaner',
      phone: '+15550002222',
      role: 'PROVIDER',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      passwordHash: hash,
      name: 'Platform Admin',
      role: 'PLATFORM_ADMIN',
    },
  });

  const companyOwner = await prisma.user.upsert({
    where: { email: 'company@test.com' },
    update: {},
    create: {
      email: 'company@test.com',
      passwordHash: hash,
      name: 'CleanPro Inc Owner',
      phone: '+15550003333',
      role: 'COMPANY',
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: 'employee@test.com' },
    update: {},
    create: {
      email: 'employee@test.com',
      passwordHash: hash,
      name: 'Jane Employee',
      role: 'EMPLOYEE',
    },
  });

  // ----- Service category -----
  const category = await prisma.serviceCategory.upsert({
    where: { slug: 'standard-cleaning' },
    update: {},
    create: {
      name: 'Standard Cleaning',
      slug: 'standard-cleaning',
      description: 'Regular and deep cleaning services',
      sortOrder: 0,
      active: true,
    },
  });

  // ----- Services -----
  const regularClean = await prisma.service.upsert({
    where: { id: 'seed-service-regular' },
    update: {},
    create: {
      id: 'seed-service-regular',
      name: 'Regular clean',
      description: 'Weekly or bi-weekly house cleaning',
      basePriceCents: 12000,
      durationMinutes: 120,
      active: true,
      categoryId: category.id,
    },
  });

  const deepClean = await prisma.service.upsert({
    where: { id: 'seed-service-deep' },
    update: {},
    create: {
      id: 'seed-service-deep',
      name: 'Deep clean',
      description: 'Thorough one-time deep cleaning',
      basePriceCents: 25000,
      durationMinutes: 240,
      active: true,
      categoryId: category.id,
    },
  });

  const moveOut = await prisma.service.upsert({
    where: { id: 'seed-service-moveout' },
    update: {},
    create: {
      id: 'seed-service-moveout',
      name: 'Move-out clean',
      description: 'Full clean after moving out',
      basePriceCents: 18000,
      durationMinutes: 180,
      active: true,
      categoryId: category.id,
    },
  });

  const serviceIds = [regularClean.id, deepClean.id, moveOut.id];

  // ----- Company + employee link -----
  const company = await prisma.company.upsert({
    where: { ownerId: companyOwner.id },
    update: {},
    create: {
      ownerId: companyOwner.id,
      name: 'CleanPro Inc',
    },
  });

  await prisma.user.update({
    where: { id: employee.id },
    data: { companyId: company.id },
  });

  await prisma.companyEmployee.upsert({
    where: { userId: employee.id },
    update: {},
    create: {
      companyId: company.id,
      userId: employee.id,
      role: 'cleaner',
    },
  });

  // ----- Provider profile (individual provider) -----
  await prisma.providerProfile.upsert({
    where: { userId: provider.id },
    update: { offeredServiceIds: serviceIds, verificationStatus: 'VERIFIED' },
    create: {
      userId: provider.id,
      verificationStatus: 'VERIFIED',
      documentUrls: [],
      offeredServiceIds: serviceIds,
    },
  });

  // ----- Provider availability (Mon–Fri 9–17) -----
  const existingAvailability = await prisma.providerAvailability.findFirst({
    where: { userId: provider.id },
  });
  if (!existingAvailability) {
    for (let day = 1; day <= 5; day++) {
      await prisma.providerAvailability.create({
        data: {
          userId: provider.id,
          dayOfWeek: day,
          startTime: 9 * 60,
          endTime: 17 * 60,
        },
      });
    }
  }

  // ----- Addresses for customer -----
  const addresses = await prisma.address.findMany({ where: { userId: customer.id } });
  if (addresses.length === 0) {
    await prisma.address.create({
      data: {
        userId: customer.id,
        label: 'Home',
        line1: '123 Main St',
        city: 'Springfield',
        postalCode: '12345',
        country: 'US',
      },
    });
    await prisma.address.create({
      data: {
        userId: customer.id,
        label: 'Work',
        line1: '456 Office Blvd',
        line2: 'Suite 100',
        city: 'Springfield',
        postalCode: '12346',
        country: 'US',
      },
    });
  }

  // ----- Promotion -----
  const promotion = await prisma.promotion.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      type: 'PERCENT',
      value: 10,
      currency: 'USD',
      maxDiscountCents: 2000,
      maxUses: 100,
      useCount: 0,
      active: true,
    },
  });

  // ----- Bookings for customer (if none exist) -----
  const existingBookings = await prisma.booking.count({ where: { customerId: customer.id } });
  if (existingBookings === 0) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const inTwoWeeks = new Date(nextWeek);
    inTwoWeeks.setDate(inTwoWeeks.getDate() + 7);

    const booking1 = await prisma.booking.create({
      data: {
        customerId: customer.id,
        status: 'PENDING',
        scheduledAt: nextWeek,
        address: '123 Main St, Springfield',
        totalPriceCents: 12000,
        discountCents: 0,
        items: {
          create: [
            { serviceId: regularClean.id, quantity: 1, priceCents: 12000 },
          ],
        },
      },
    });

    const booking2 = await prisma.booking.create({
      data: {
        customerId: customer.id,
        status: 'CONFIRMED',
        scheduledAt: inTwoWeeks,
        address: '123 Main St, Springfield',
        customerNotes: 'Please use the back door.',
        totalPriceCents: 25000,
        discountCents: 2500,
        promotionId: promotion.id,
        items: {
          create: [
            { serviceId: deepClean.id, quantity: 1, priceCents: 25000 },
          ],
        },
      },
    });

    const job2 = await prisma.job.create({
      data: {
        bookingId: booking2.id,
        providerId: provider.id,
        status: 'PENDING',
      },
    });

    const booking3 = await prisma.booking.create({
      data: {
        customerId: customer.id,
        status: 'COMPLETED',
        scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        address: '456 Office Blvd, Springfield',
        totalPriceCents: 12000,
        items: {
          create: [
            { serviceId: regularClean.id, quantity: 1, priceCents: 12000 },
          ],
        },
      },
    });

    const job3 = await prisma.job.create({
      data: {
        bookingId: booking3.id,
        providerId: provider.id,
        status: 'COMPLETED',
      },
    });

    await prisma.review.create({
      data: {
        bookingId: booking3.id,
        jobId: job3.id,
        customerId: customer.id,
        providerId: provider.id,
        rating: 5,
        comment: 'Very thorough and on time!',
        providerReply: 'Thank you!',
        repliedAt: new Date(),
      },
    });
  }

  // ----- Notification for customer -----
  const notifCount = await prisma.notification.count({ where: { userId: customer.id } });
  if (notifCount === 0) {
    await prisma.notification.create({
      data: {
        userId: customer.id,
        type: 'BOOKING_CONFIRMED',
        title: 'Booking confirmed',
        body: 'Your cleaning is scheduled.',
        resourceType: 'booking',
        resourceId: null,
      },
    });
  }

  console.log('Seed done. Test users (password: ' + TEST_PASSWORD + '):');
  console.log('  customer@test.com  (CUSTOMER)');
  console.log('  provider@test.com  (PROVIDER)');
  console.log('  admin@test.com     (PLATFORM_ADMIN)');
  console.log('  company@test.com   (COMPANY owner)');
  console.log('  employee@test.com  (EMPLOYEE, linked to company)');
  console.log('Promo code: WELCOME10 (10% off, max $20)');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
