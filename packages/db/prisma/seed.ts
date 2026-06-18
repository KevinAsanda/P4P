import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed...');

  // =========================================================================
  // 1. Seed Suppliers
  // =========================================================================
  console.log('Seeding suppliers...');
  const suppliersData = [
    { id: 'supp-001', name: 'Durban Stationery Wholesalers', contactName: 'John Miller', phone: '031-555-0192', email: 'john@durbanstationery.co.za', averageLeadTimeDays: 3 },
    { id: 'supp-002', name: 'Croxley Durban Depot', contactName: 'Sarah Connor', phone: '031-555-0382', email: 'orders@croxleydurban.co.za', averageLeadTimeDays: 5 },
    { id: 'supp-003', name: 'Waltons Back to School Depot', contactName: 'Peter Parker', phone: '031-555-0761', email: 'info@waltonsbts.co.za', averageLeadTimeDays: 4 },
  ];

  for (const s of suppliersData) {
    await prisma.supplier.upsert({
      where: { id: s.id },
      update: s,
      create: s,
    });
  }

  // =========================================================================
  // 2. Seed Products & Services Catalog
  // =========================================================================
  console.log('Seeding products & services catalog...');
  const productsData = [
    // Pencils & Writing
    { id: 'prod-fc-pencil', itemName: 'Faber-Castell Pencil HB', sku: 'STA-HB-FC', brand: 'Faber-Castell', unitPrice: 8.50, qtyOnHand: 800, reorderThreshold: 150, category: 'Stationery', supplierId: 'supp-001' },
    { id: 'prod-st-pencil', itemName: 'Staedtler Pencil HB', sku: 'STA-HB-ST', brand: 'Staedtler', unitPrice: 7.00, qtyOnHand: 900, reorderThreshold: 100, category: 'Stationery', supplierId: 'supp-001' },
    { id: 'prod-gen-pencil', itemName: 'Generic Brand Pencil HB', sku: 'STA-HB-GEN', brand: 'Generic', unitPrice: 3.50, qtyOnHand: 1500, reorderThreshold: 200, category: 'Stationery', supplierId: 'supp-001' },
    { id: 'prod-bic-blue', itemName: 'Bic Fine Blue Ballpoint Pen', sku: 'PEN-BLU-BIC', brand: 'Bic', unitPrice: 4.50, qtyOnHand: 1200, reorderThreshold: 200, category: 'Stationery', supplierId: 'supp-001' },
    { id: 'prod-bic-black', itemName: 'Bic Fine Black Ballpoint Pen', sku: 'PEN-BLK-BIC', brand: 'Bic', unitPrice: 4.50, qtyOnHand: 600, reorderThreshold: 100, category: 'Stationery', supplierId: 'supp-001' },
    { id: 'prod-bic-red', itemName: 'Bic Fine Red Ballpoint Pen', sku: 'PEN-RED-BIC', brand: 'Bic', unitPrice: 4.50, qtyOnHand: 300, reorderThreshold: 50, category: 'Stationery', supplierId: 'supp-001' },
    { id: 'prod-pil-gel', itemName: 'Pilot G2 Gel Blue Pen', sku: 'PEN-GEL-PIL', brand: 'Pilot', unitPrice: 28.00, qtyOnHand: 150, reorderThreshold: 30, category: 'Stationery', supplierId: 'supp-003' },
    
    // Exercise Books
    { id: 'prod-bok-72cr', itemName: 'Croxley A4 Exercise Book 72 Page (College Ruled)', sku: 'BOK-A4-72CR', brand: 'Croxley', unitPrice: 12.00, qtyOnHand: 2500, reorderThreshold: 500, category: 'Stationery', supplierId: 'supp-002' },
    { id: 'prod-bok-72un', itemName: 'Croxley A4 Exercise Book 72 Page (Blank/Unruled)', sku: 'BOK-A4-72UN', brand: 'Croxley', unitPrice: 12.00, qtyOnHand: 1000, reorderThreshold: 200, category: 'Stationery', supplierId: 'supp-002' },
    { id: 'prod-bok-72ir', itemName: 'Croxley A4 Exercise Book 72 Page (17mm Irish Ruled)', sku: 'BOK-A4-72IR', brand: 'Croxley', unitPrice: 15.00, qtyOnHand: 1200, reorderThreshold: 150, category: 'Stationery', supplierId: 'supp-002' },
    { id: 'prod-bok-72qd', itemName: 'Croxley A4 Quad & Margin Book 72 Page', sku: 'BOK-A4-72QD', brand: 'Croxley', unitPrice: 14.50, qtyOnHand: 800, reorderThreshold: 100, category: 'Stationery', supplierId: 'supp-002' },
    { id: 'prod-bok-192hc', itemName: 'Croxley A4 Hardcover Book 192 Page (2-Subject)', sku: 'BOK-A4-192HC', brand: 'Croxley', unitPrice: 32.00, qtyOnHand: 500, reorderThreshold: 50, category: 'Stationery', supplierId: 'supp-002' },

    // Erasers & Rulers
    { id: 'prod-bic-eraser', itemName: 'Bic Eraser Large Plastic', sku: 'ERA-BIC-LRG', brand: 'Bic', unitPrice: 6.00, qtyOnHand: 400, reorderThreshold: 50, category: 'Stationery', supplierId: 'supp-001' },
    { id: 'prod-st-eraser', itemName: 'Staedtler Eraser Large', sku: 'ERA-ST-LRG', brand: 'Staedtler', unitPrice: 7.50, qtyOnHand: 350, reorderThreshold: 50, category: 'Stationery', supplierId: 'supp-001' },
    { id: 'prod-hel-ruler', itemName: 'Helix Plastic Ruler 30cm', sku: 'RUL-30C-HEL', brand: 'Helix', unitPrice: 9.00, qtyOnHand: 600, reorderThreshold: 100, category: 'Stationery', supplierId: 'supp-001' },
    { id: 'prod-sht-ruler', itemName: 'Shatterproof Ruler 30cm', sku: 'RUL-30C-SHT', brand: 'Helix', unitPrice: 12.00, qtyOnHand: 500, reorderThreshold: 80, category: 'Stationery', supplierId: 'supp-001' },

    // Glues & Scissors
    { id: 'prod-prt-glue', itemName: 'Pritt Glue Stick 43g', sku: 'GLU-PRT-43G', brand: 'Pritt', unitPrice: 29.50, qtyOnHand: 700, reorderThreshold: 120, category: 'Stationery', supplierId: 'supp-003' },
    { id: 'prod-bst-glue', itemName: 'Bostik Glue Stick 40g', sku: 'GLU-BST-40G', brand: 'Bostik', unitPrice: 24.00, qtyOnHand: 600, reorderThreshold: 100, category: 'Stationery', supplierId: 'supp-003' },
    { id: 'prod-gen-glue', itemName: 'Generic Glue Stick 40g', sku: 'GLU-GEN-40G', brand: 'Generic', unitPrice: 12.00, qtyOnHand: 1000, reorderThreshold: 150, category: 'Stationery', supplierId: 'supp-001' },
    { id: 'prod-fis-scissors', itemName: 'Fiskars Kid Scissors 13cm', sku: 'SCI-FIS-KID', brand: 'Fiskars', unitPrice: 22.00, qtyOnHand: 400, reorderThreshold: 50, category: 'Stationery', supplierId: 'supp-003' },

    // Coloring & Drawing
    { id: 'prod-st-pencilpack', itemName: 'Staedtler 12 Pack Coloured Pencils', sku: 'COL-12P-ST', brand: 'Staedtler', unitPrice: 45.00, qtyOnHand: 350, reorderThreshold: 50, category: 'Stationery', supplierId: 'supp-002' },
    { id: 'prod-fc-pencilpack', itemName: 'Faber-Castell 24 Pack Coloured Pencils', sku: 'COL-24P-FC', brand: 'Faber-Castell', unitPrice: 85.00, qtyOnHand: 200, reorderThreshold: 40, category: 'Stationery', supplierId: 'supp-001' },
    { id: 'prod-bst-crayons', itemName: 'Bostik Wax Crayons 12 Pack', sku: 'CRY-BST-12P', brand: 'Bostik', unitPrice: 21.00, qtyOnHand: 400, reorderThreshold: 60, category: 'Stationery', supplierId: 'supp-003' },
    { id: 'prod-st-crayons', itemName: 'Staedtler Wax Crayons 24 Pack', sku: 'CRY-ST-24P', brand: 'Staedtler', unitPrice: 48.00, qtyOnHand: 250, reorderThreshold: 40, category: 'Stationery', supplierId: 'supp-002' },

    // Cases, Highlighters, Tools
    { id: 'prod-casio-calc', itemName: 'Casio fx-82ZA Plus Scientific Calculator', sku: 'CAL-CAS-82ZA', brand: 'Casio', unitPrice: 340.00, qtyOnHand: 120, reorderThreshold: 20, category: 'Stationery', supplierId: 'supp-003' },
    { id: 'prod-canvas-case', itemName: 'Canvas Pencil Case 33cm', sku: 'PCS-CAN-33C', brand: 'Generic', unitPrice: 35.00, qtyOnHand: 300, reorderThreshold: 45, category: 'Stationery', supplierId: 'supp-001' },
    { id: 'prod-stb-yellow', itemName: 'Stabilo Boss Yellow Highlighter', sku: 'HLI-STB-YEL', brand: 'Stabilo', unitPrice: 18.00, qtyOnHand: 500, reorderThreshold: 80, category: 'Stationery', supplierId: 'supp-003' },
    { id: 'prod-stb-green', itemName: 'Stabilo Boss Green Highlighter', sku: 'HLI-STB-GRN', brand: 'Stabilo', unitPrice: 18.00, qtyOnHand: 450, reorderThreshold: 80, category: 'Stationery', supplierId: 'supp-003' },
    { id: 'prod-covers-pack', itemName: 'A4 Plastic Book Covers 10 Pack', sku: 'COV-A4-10P', brand: 'Generic', unitPrice: 25.00, qtyOnHand: 1000, reorderThreshold: 100, category: 'Stationery', supplierId: 'supp-001' },

    // Services
    { id: 'prod-srv-covering', itemName: 'Premium Book Covering Service (per book)', sku: 'SRV-COV-01', brand: 'Prepped 4 Prep', unitPrice: 15.00, qtyOnHand: 9999, reorderThreshold: 0, category: 'Service' },
    { id: 'prod-srv-labeling', itemName: 'Custom Name Labeling Service (per student)', sku: 'SRV-LAB-01', brand: 'Prepped 4 Prep', unitPrice: 25.00, qtyOnHand: 9999, reorderThreshold: 0, category: 'Service' },
  ];

  for (const p of productsData) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        itemName: p.itemName,
        brand: p.brand,
        unitPrice: p.unitPrice,
        qtyOnHand: p.qtyOnHand,
        reorderThreshold: p.reorderThreshold,
        category: p.category,
        supplierId: p.supplierId || null,
      },
      create: p,
    });
  }

  // =========================================================================
  // 3. Seed Schools (5 Schools)
  // =========================================================================
  console.log('Seeding schools...');
  const schoolsData = [
    { id: 'sch-dps', name: 'Durban Primary School', region: 'Durban Central', contactPerson: 'Mrs. Evelyn Smith', isActive: true },
    { id: 'sch-wps', name: 'Westville Preparatory School', region: 'Westville', contactPerson: 'Mr. David Davis', isActive: true },
    { id: 'sch-cps', name: 'Chelsea Preparatory School', region: 'Durban North', contactPerson: 'Mrs. Clara Green', isActive: true },
    { id: 'sch-gps', name: 'Glenwood Preparatory School', region: 'Durban South', contactPerson: 'Mr. Ronald McDonald', isActive: true },
    { id: 'sch-clifton', name: 'Clifton School', region: 'Morningside', contactPerson: 'Mrs. Emily Watson', isActive: true },
  ];

  for (const sch of schoolsData) {
    await prisma.school.upsert({
      where: { id: sch.id },
      update: sch,
      create: sch,
    });
  }

  // =========================================================================
  // 4. Seed School Templates & Lines for EVERY Grade (Grade R to Grade 7)
  // =========================================================================
  console.log('Seeding templates for all schools and grades...');
  const grades = ['Grade R', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];

  for (const sch of schoolsData) {
    for (const grade of grades) {
      const templateId = `temp-${sch.id}-${grade.replace(' ', '-').toLowerCase()}`;
      const templateName = `${sch.name} ${grade} List 2026`;

      await prisma.schoolTemplate.upsert({
        where: { id: templateId },
        update: {
          name: templateName,
          isActive: true,
        },
        create: {
          id: templateId,
          schoolId: sch.id,
          name: templateName,
          gradeLevel: grade,
          academicYear: 2026,
          isActive: true,
        },
      });

      // Clear any existing template lines to start fresh and avoid unique index errors
      await prisma.templateLine.deleteMany({
        where: { templateId },
      });

      // Build realistic items depending on the grade range
      let lines = [];
      if (grade === 'Grade R' || grade === 'Grade 1' || grade === 'Grade 2' || grade === 'Grade 3') {
        // Foundation phase list
        lines = [
          { productId: 'prod-fc-pencil', quantityRequired: 4, isOptional: false, displayOrder: 1 },
          { productId: 'prod-st-pencilpack', quantityRequired: 1, isOptional: false, displayOrder: 2 },
          { productId: 'prod-prt-glue', quantityRequired: 3, isOptional: false, displayOrder: 3 },
          { productId: 'prod-bok-72ir', quantityRequired: 2, isOptional: false, displayOrder: 4 }, // Irish ruled
          { productId: 'prod-bok-72un', quantityRequired: 2, isOptional: false, displayOrder: 5 }, // Unruled
          { productId: 'prod-bic-eraser', quantityRequired: 2, isOptional: false, displayOrder: 6 },
          { productId: 'prod-hel-ruler', quantityRequired: 1, isOptional: false, displayOrder: 7 },
          { productId: 'prod-bst-crayons', quantityRequired: 1, isOptional: false, displayOrder: 8 },
          { productId: 'prod-fis-scissors', quantityRequired: 1, isOptional: false, displayOrder: 9 },
          { productId: 'prod-canvas-case', quantityRequired: 1, isOptional: true, displayOrder: 10 },
        ];
      } else {
        // Intermediate/Senior phase list
        lines = [
          { productId: 'prod-fc-pencil', quantityRequired: 2, isOptional: false, displayOrder: 1 },
          { productId: 'prod-bic-blue', quantityRequired: 4, isOptional: false, displayOrder: 2 },
          { productId: 'prod-bic-black', quantityRequired: 2, isOptional: false, displayOrder: 3 },
          { productId: 'prod-bic-red', quantityRequired: 1, isOptional: false, displayOrder: 4 },
          { productId: 'prod-st-pencilpack', quantityRequired: 1, isOptional: false, displayOrder: 5 },
          { productId: 'prod-sht-ruler', quantityRequired: 1, isOptional: false, displayOrder: 6 },
          { productId: 'prod-prt-glue', quantityRequired: 2, isOptional: false, displayOrder: 7 },
          { productId: 'prod-bok-72cr', quantityRequired: 8, isOptional: false, displayOrder: 8 },
          { productId: 'prod-bok-192hc', quantityRequired: 2, isOptional: false, displayOrder: 9 },
          { productId: 'prod-st-eraser', quantityRequired: 1, isOptional: false, displayOrder: 10 },
          { productId: 'prod-stb-yellow', quantityRequired: 1, isOptional: false, displayOrder: 11 },
          { productId: 'prod-fis-scissors', quantityRequired: 1, isOptional: false, displayOrder: 12 },
          { productId: 'prod-covers-pack', quantityRequired: 1, isOptional: true, displayOrder: 13 },
        ];

        // Add calculator specifically for Grade 7
        if (grade === 'Grade 7') {
          lines.push({ productId: 'prod-casio-calc', quantityRequired: 1, isOptional: false, displayOrder: 14 });
        }
      }

      // Create the template lines in DB using batch insert (createMany)
      await prisma.templateLine.createMany({
        data: lines.map((line) => ({
          templateId,
          productId: line.productId,
          quantityRequired: line.quantityRequired,
          isOptional: line.isOptional,
          displayOrder: line.displayOrder,
        })),
      });
    }
  }

  // =========================================================================
  // 5. Seed Historical SalesOrders (Data for the past 12 months)
  // =========================================================================
  console.log('Seeding historical sales data for the past 12 months...');
  
  // Clean past transactions to avoid seed data overflow / unique constraint crashes
  await prisma.delivery.deleteMany();
  await prisma.orderLine.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.student.deleteMany();
  await prisma.customer.deleteMany();

  const mockCustomers = [
    { id: 'cust-1', firstName: 'Caron', lastName: 'Giles', email: 'caron@prepped4prep.co.za', phone: '0821112222', deliveryAddress: '12 Ridge Road, Berea, Durban' },
    { id: 'cust-2', firstName: 'Jess', lastName: 'Williams', email: 'jess@gmail.com', phone: '0834445555', deliveryAddress: '44 Chelsea Drive, Durban North' },
    { id: 'cust-3', firstName: 'Sarah', lastName: 'Jenkins', email: 'sarah.j@outlook.com', phone: '0718889999', deliveryAddress: '88 Link Road, Westville' },
    { id: 'cust-4', firstName: 'Michael', lastName: 'Nair', email: 'nair.m@ymail.com', phone: '0842223333', deliveryAddress: '15 Bellevue Road, Glenwood' },
    { id: 'cust-5', firstName: 'Thabo', lastName: 'Mkhize', email: 'thabo@mkhizemail.co.za', phone: '0726667777', deliveryAddress: '31 Florida Road, Morningside' },
  ];

  for (const c of mockCustomers) {
    await prisma.customer.create({
      data: {
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        deliveryAddress: c.deliveryAddress,
        consentFlag: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // opt-in 1 month ago
      },
    });
  }

  // Create Students under customers
  const studentsData = [
    { id: 'stud-1', customerId: 'cust-1', schoolId: 'sch-dps', firstName: 'Luke', lastName: 'Giles', gradeLevel: 'Grade 1', academicYear: 2026 },
    { id: 'stud-2', customerId: 'cust-2', schoolId: 'sch-cps', firstName: 'Emma', lastName: 'Williams', gradeLevel: 'Grade 4', academicYear: 2026 },
    { id: 'stud-3', customerId: 'cust-3', schoolId: 'sch-wps', firstName: 'Daniel', lastName: 'Jenkins', gradeLevel: 'Grade 2', academicYear: 2026 },
    { id: 'stud-4', customerId: 'cust-4', schoolId: 'sch-gps', firstName: 'Aria', lastName: 'Nair', gradeLevel: 'Grade 7', academicYear: 2026 },
    { id: 'stud-5', customerId: 'cust-5', schoolId: 'sch-clifton', firstName: 'Sipho', lastName: 'Mkhize', gradeLevel: 'Grade 5', academicYear: 2026 },
  ];

  for (const stud of studentsData) {
    await prisma.student.create({
      data: stud,
    });
  }

  // Generate historical orders distributed across the past 12 months
  const ordersDetails = [
    { orderId: 'ord-hist-1', customerId: 'cust-1', studentId: 'stud-1', monthsAgo: 11, payment: 'paid', fulfillment: 'delivered', items: [{ prodId: 'prod-fc-pencil', qty: 4 }, { prodId: 'prod-prt-glue', qty: 3 }, { prodId: 'prod-bok-72ir', qty: 2 }] },
    { orderId: 'ord-hist-2', customerId: 'cust-2', studentId: 'stud-2', monthsAgo: 9, payment: 'paid', fulfillment: 'delivered', items: [{ prodId: 'prod-st-pencilpack', qty: 1 }, { prodId: 'prod-bok-72cr', qty: 8 }, { prodId: 'prod-st-eraser', qty: 1 }] },
    { orderId: 'ord-hist-3', customerId: 'cust-3', studentId: 'stud-3', monthsAgo: 7, payment: 'paid', fulfillment: 'delivered', items: [{ prodId: 'prod-fc-pencil', qty: 4 }, { prodId: 'prod-prt-glue', qty: 3 }, { prodId: 'prod-bst-crayons', qty: 1 }] },
    { orderId: 'ord-hist-4', customerId: 'cust-4', studentId: 'stud-4', monthsAgo: 5, payment: 'paid', fulfillment: 'delivered', items: [{ prodId: 'prod-casio-calc', qty: 1 }, { prodId: 'prod-bok-72cr', qty: 8 }, { prodId: 'prod-stb-yellow', qty: 1 }] },
    { orderId: 'ord-hist-5', customerId: 'cust-5', studentId: 'stud-5', monthsAgo: 3, payment: 'paid', fulfillment: 'delivered', items: [{ prodId: 'prod-bic-blue', qty: 4 }, { prodId: 'prod-sht-ruler', qty: 1 }, { prodId: 'prod-prt-glue', qty: 2 }] },
    { orderId: 'ord-hist-6', customerId: 'cust-1', studentId: 'stud-1', monthsAgo: 1, payment: 'paid', fulfillment: 'packed', items: [{ prodId: 'prod-fc-pencil', qty: 4 }, { prodId: 'prod-st-pencilpack', qty: 1 }, { prodId: 'prod-prt-glue', qty: 3 }] },
    { orderId: 'ord-hist-7', customerId: 'cust-3', studentId: 'stud-3', monthsAgo: 0.5, payment: 'paid', fulfillment: 'packing', items: [{ prodId: 'prod-fc-pencil', qty: 4 }, { prodId: 'prod-bok-72ir', qty: 2 }, { prodId: 'prod-prt-glue', qty: 3 }] },
    { orderId: 'ord-hist-8', customerId: 'cust-4', studentId: 'stud-4', monthsAgo: 0.1, payment: 'pending', fulfillment: 'pending', items: [{ prodId: 'prod-casio-calc', qty: 1 }, { prodId: 'prod-canvas-case', qty: 1 }, { prodId: 'prod-stb-yellow', qty: 2 }] },
  ];

  const now = Date.now();

  const productsMap = new Map(productsData.map(p => [p.id, p]));
  const customersMap = new Map(mockCustomers.map(c => [c.id, c]));

  for (const ord of ordersDetails) {
    const orderDate = new Date(now - ord.monthsAgo * 30 * 24 * 60 * 60 * 1000);

    // Sum total pricing of ordered lines
    let total = 0;
    const linesToInsert = [];

    for (const item of ord.items) {
      const prod = productsMap.get(item.prodId)!;
      const subtotal = prod.unitPrice * item.qty;
      total += subtotal;

      linesToInsert.push({
        productId: item.prodId,
        quantityOrdered: item.qty,
        unitPriceAtSale: prod.unitPrice,
        lineSubTotal: subtotal,
        isPacked: ord.fulfillment === 'delivered' || ord.fulfillment === 'packed',
      });
    }

    // Insert Order
    await prisma.salesOrder.create({
      data: {
        id: ord.orderId,
        customerId: ord.customerId,
        studentId: ord.studentId,
        orderDate,
        totalAmount: total,
        paymentStatus: ord.payment,
        fulfillmentStatus: ord.fulfillment,
        quickbooksSyncStatus: ord.payment === 'paid' ? 'synced' : 'pending',
        quickbooksInvoiceId: ord.payment === 'paid' ? `qb-inv-${ord.orderId.slice(-4)}` : null,
      },
    });

    // Insert OrderLines
    for (const line of linesToInsert) {
      await prisma.orderLine.create({
        data: {
          orderId: ord.orderId,
          productId: line.productId,
          quantityOrdered: line.quantityOrdered,
          unitPriceAtSale: line.unitPriceAtSale,
          lineSubTotal: line.lineSubTotal,
          isPacked: line.isPacked,
        },
      });
    }

    // Insert Delivery record
    const customerObj = customersMap.get(ord.customerId)!;
    await prisma.delivery.create({
      data: {
        orderId: ord.orderId,
        deliveryMethod: 'delivery',
        scheduledDate: ord.fulfillment === 'delivered' ? orderDate : null,
        actualDate: ord.fulfillment === 'delivered' ? orderDate : null,
        proofOfDeliveryUrl: ord.fulfillment === 'delivered' ? 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c' : null,
      },
    });
  }

  console.log('Template lines and historical transactions seeded successfully.');
  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
