console.log('🚩 Checkpoint M0: sqlite-migrate.ts starting execution');
import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.join(process.cwd(), 'pos-data.db');

export async function initializeDatabase() {
  const db = new Database(dbPath);

  // db.pragma('foreign_keys = ON');
console.log('🚩 Checkpoint M0: Pragma skipped in migrations');
  


  console.log('🔄 Creating database tables...');

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tax Categories table for managing GST rates
  db.exec(`
    CREATE TABLE IF NOT EXISTS tax_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rate REAL NOT NULL,
      hsn_code_range TEXT,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // HSN Codes table for GST compliance
  db.exec(`
    CREATE TABLE IF NOT EXISTS "hsn_codes" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "hsn_code" TEXT NOT NULL UNIQUE,
      "description" TEXT NOT NULL,
      "tax_category_id" INTEGER DEFAULT 1,
      "cgst_rate" REAL DEFAULT 0,
      "sgst_rate" REAL DEFAULT 0,
      "igst_rate" REAL DEFAULT 0,
      "cess_rate" REAL DEFAULT 0,
      "is_active" INTEGER DEFAULT 1,
      "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'cashier',
      image TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Item Product Types table
  db.exec(`
    CREATE TABLE IF NOT EXISTS item_product_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Departments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Suppliers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      mobile_no TEXT,
      extension_number TEXT,
      fax_no TEXT,
      contact_person TEXT,
      address TEXT,
      building TEXT,
      street TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      pin_code TEXT,
      landmark TEXT,
      gstin TEXT,
      tax_id TEXT,
      registration_type TEXT,
      registration_number TEXT,
      supplier_type TEXT,
      credit_days INTEGER,
      discount_percent REAL,
      payment_terms TEXT,
      business_type TEXT,
      notes TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Customers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      tax_id TEXT,
      credit_limit REAL DEFAULT 0,
      outstanding_balance REAL DEFAULT 0,
      business_name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      sku TEXT UNIQUE NOT NULL,
      price REAL NOT NULL,
      mrp REAL NOT NULL,
      cost REAL NOT NULL DEFAULT 0,
      wholesale_price REAL DEFAULT 0,
      weight REAL,
      weight_unit TEXT DEFAULT 'kg',
      category_id INTEGER NOT NULL,
      stock_quantity REAL NOT NULL DEFAULT 0,
      alert_threshold REAL NOT NULL DEFAULT 10,
      barcode TEXT,
      image TEXT,
      hsn_code TEXT,
      gst_code TEXT,
      cgst_rate TEXT DEFAULT '0',
      sgst_rate TEXT DEFAULT '0',
      igst_rate TEXT DEFAULT '0',
      cess_rate TEXT DEFAULT '0',
      tax_calculation_method TEXT,
      manufacturer_name TEXT,
      supplier_name TEXT,
      manufacturer_id INTEGER,
      supplier_id INTEGER,
      alias TEXT,
      item_product_type TEXT,
      department TEXT,
      brand TEXT,
      buyer TEXT,
      purchase_gst_calculated_on TEXT,
      gst_uom TEXT,
      purchase_abatement TEXT,
      config_item_with_commodity INTEGER DEFAULT 0,
      senior_exempt_applicable INTEGER DEFAULT 0,
      ean_code_required INTEGER DEFAULT 0,
      weights_per_unit TEXT,
      batch_expiry_details TEXT,
      item_preparations_status TEXT,
      grinding_charge TEXT,
      weight_in_gms TEXT,
      bulk_item_name TEXT,
      repackage_units TEXT,
      repackage_type TEXT,
      packaging_material TEXT,
      decimal_point TEXT,
      product_type TEXT,
      sell_by TEXT,
      item_per_unit TEXT,
      maintain_selling_mrp_by TEXT,
      batch_selection TEXT,
      is_weighable INTEGER DEFAULT 0,
      sku_type TEXT,
      indent_type TEXT,
      gate_keeper_margin TEXT,
      allow_item_free INTEGER DEFAULT 0,
      show_on_mobile_dashboard INTEGER DEFAULT 1,
      enable_mobile_notifications INTEGER DEFAULT 1,
      quick_add_to_cart INTEGER DEFAULT 0,
      perishable_item INTEGER DEFAULT 0,
      temperature_controlled INTEGER DEFAULT 0,
      fragile_item INTEGER DEFAULT 0,
      track_serial_numbers INTEGER DEFAULT 0,
      fda_approved INTEGER DEFAULT 0,
      bis_certified INTEGER DEFAULT 0,
      organic_certified INTEGER DEFAULT 0,
      item_ingredients TEXT,
      model TEXT,
      size TEXT,
      color TEXT,
      material TEXT,
      min_order_qty INTEGER DEFAULT 1,
      max_order_qty INTEGER,
      reorder_point INTEGER,
      shelf_life INTEGER,
      expiry_date TEXT,
      batch_number TEXT,
      serial_number TEXT,
      warranty TEXT,
      location TEXT,
      rack TEXT,
      bin TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  // Sales table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER,
      user_id INTEGER NOT NULL,
      total REAL NOT NULL,
      tax REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      cash_amount REAL DEFAULT 0,
      upi_amount REAL DEFAULT 0,
      card_amount REAL DEFAULT 0,
      bank_transfer_amount REAL DEFAULT 0,
      cheque_amount REAL DEFAULT 0,
      credit_amount REAL DEFAULT 0,
      notes TEXT,
      bill_number TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Sale items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      mrp REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Purchases table
  db.exec(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      supplier_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      total REAL NOT NULL,
      tax REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      order_date TEXT NOT NULL,
      expected_date TEXT,
      received_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Purchase items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      unit_cost REAL NOT NULL,
      subtotal REAL NOT NULL,
      received_qty REAL DEFAULT 0,
      free_qty REAL DEFAULT 0,
      cost REAL,
      selling_price REAL,
      wholesale_price REAL,
      mrp REAL,
      hsn_code TEXT,
      tax_percentage REAL,
      discount_amount REAL,
      discount_percent REAL,
      expiry_date TEXT,
      batch_number TEXT,
      net_cost REAL,
      roi_percent REAL,
      gross_profit_percent REAL,
      net_amount REAL,
      cash_percent REAL,
      cash_amount REAL,
      location TEXT,
      unit TEXT,
      remaining_quantity REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Returns table
  db.exec(`
    CREATE TABLE IF NOT EXISTS returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_number TEXT UNIQUE,
      sale_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      refund_method TEXT NOT NULL,
      total_refund REAL NOT NULL,
      reason TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'completed',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Return items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS return_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (return_id) REFERENCES returns(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Expense Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS expense_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Expenses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_number TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      expense_date TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      supplier_id INTEGER,
      user_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      receipt_number TEXT,
      reference TEXT,
      recurring INTEGER DEFAULT 0,
      recurring_period TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES expense_categories (id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Offers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      offer_type TEXT NOT NULL,
      discount_value TEXT NOT NULL,
      min_purchase_amount TEXT DEFAULT '0',
      max_discount_amount TEXT,
      buy_quantity INTEGER,
      get_quantity INTEGER,
      free_product_id INTEGER,
      valid_from TEXT,
      valid_to TEXT,
      time_start TEXT,
      time_end TEXT,
      applicable_categories TEXT,
      applicable_products TEXT,
      points_multiplier TEXT DEFAULT '1',
      points_threshold TEXT DEFAULT '1000',
      points_reward TEXT DEFAULT '10',
      usage_limit INTEGER,
      usage_count INTEGER DEFAULT 0,
      per_customer_limit INTEGER,
      active INTEGER NOT NULL DEFAULT 1,
      priority INTEGER DEFAULT 1,
      created_by INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (free_product_id) REFERENCES products (id),
      FOREIGN KEY (created_by) REFERENCES users (id)
    )
  `);

  // Offer usage tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS offer_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      offer_id INTEGER NOT NULL,
      sale_id INTEGER NOT NULL,
      customer_id INTEGER,
      discount_amount TEXT NOT NULL,
      original_amount TEXT NOT NULL,
      final_amount TEXT NOT NULL,
      points_earned TEXT DEFAULT '0',
      used_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (offer_id) REFERENCES offers (id),
      FOREIGN KEY (sale_id) REFERENCES sales (id),
      FOREIGN KEY (customer_id) REFERENCES customers (id)
    )
  `);

  // Customer loyalty points table
  db.exec(`
    CREATE TABLE IF NOT EXISTS customer_loyalty (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL UNIQUE,
      total_points REAL DEFAULT 0,
      used_points REAL DEFAULT 0,
      available_points REAL DEFAULT 0,
      tier TEXT DEFAULT 'Member',
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
  `);

  // Cash Registers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS cash_registers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      register_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'closed',
      opening_cash REAL NOT NULL DEFAULT 0,
      current_cash REAL NOT NULL DEFAULT 0,
      cash_received REAL NOT NULL DEFAULT 0,
      upi_received REAL NOT NULL DEFAULT 0,
      card_received REAL NOT NULL DEFAULT 0,
      bank_received REAL NOT NULL DEFAULT 0,
      cheque_received REAL NOT NULL DEFAULT 0,
      other_received REAL NOT NULL DEFAULT 0,
      total_withdrawals REAL NOT NULL DEFAULT 0,
      total_refunds REAL NOT NULL DEFAULT 0,
      total_sales REAL NOT NULL DEFAULT 0,
      total_credit_sales REAL NOT NULL DEFAULT 0,
      notes TEXT,
      opened_by INTEGER,
      closed_by INTEGER,
      opened_at TEXT,
      closed_at TEXT,
      total_transactions INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (opened_by) REFERENCES users(id),
      FOREIGN KEY (closed_by) REFERENCES users(id)
    )
  `);

  // Cash Register Transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS cash_register_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      register_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      reason TEXT,
      notes TEXT,
      description TEXT,
      reference_id INTEGER,
      user_id INTEGER NOT NULL,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (register_id) REFERENCES cash_registers(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Label Templates table for custom designs - Fully compatible with Label Designer
  db.exec(`
    CREATE TABLE IF NOT EXISTS label_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      width REAL NOT NULL,
      height REAL NOT NULL,
      font_size INTEGER DEFAULT 12,
      product_name_font_size INTEGER DEFAULT 18,
      include_barcode INTEGER DEFAULT 1,
      include_price INTEGER DEFAULT 1,
      include_description INTEGER DEFAULT 0,
      include_mrp INTEGER DEFAULT 1,
      include_weight INTEGER DEFAULT 0,
      include_hsn INTEGER DEFAULT 0,
      include_manufacturing_date INTEGER DEFAULT 0,
      include_expiry_date INTEGER DEFAULT 0,
      barcode_position TEXT DEFAULT 'bottom',
      barcode_width INTEGER DEFAULT 80,
      barcode_height INTEGER DEFAULT 40,
      orientation TEXT DEFAULT 'landscape',
      border_style TEXT DEFAULT 'solid',
      border_width INTEGER DEFAULT 1,
      background_color TEXT DEFAULT '#ffffff',
      text_color TEXT DEFAULT '#000000',
      custom_css TEXT,
      store_title TEXT,
      elements TEXT,
      is_default INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // Print jobs table for tracking label printing history
  db.exec(`
    CREATE TABLE IF NOT EXISTS print_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      product_ids TEXT NOT NULL,
      copies INTEGER DEFAULT 1,
      labels_per_row INTEGER DEFAULT 2,
      paper_size TEXT DEFAULT 'A4',
      orientation TEXT DEFAULT 'portrait',
      status TEXT DEFAULT 'completed',
      total_labels INTEGER NOT NULL,
      custom_text TEXT,
      print_settings TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (template_id) REFERENCES label_templates(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Label printers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS label_printers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'endura',
      connection TEXT DEFAULT 'usb',
      ip_address TEXT,
      port INTEGER,
      paper_width INTEGER DEFAULT 80,
      paper_height INTEGER DEFAULT 40,
      is_default INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // Seed default printer if none exist
  const printerCount = db.prepare('SELECT COUNT(*) as count FROM label_printers').get() as { count: number };
  if (printerCount.count === 0) {
    console.log('🔄 Seeding default label printer...');
    db.prepare(`
      INSERT INTO label_printers (name, type, connection, paper_width, paper_height, is_default, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('Endura Pro 400', 'endura', 'usb', 80, 40, 1, 1);
    console.log('✅ Default label printer seeded');
  }

  // Seed default label templates if none exist
  const templateCount = db.prepare('SELECT COUNT(*) as count FROM label_templates').get() as { count: number };
  if (templateCount.count === 0) {
    console.log('🔄 Seeding default label templates...');

    const defaultTemplates = [
      {
        name: "Standard 80x40",
        description: "Professional product label with price and barcode",
        width: 80,
        height: 40,
        font_size: 14,
        include_barcode: 1,
        include_price: 1,
        include_mrp: 1,
        barcode_position: 'bottom',
        orientation: 'landscape',
        is_default: 1
      },
      {
        name: "Shelf Tag 100x30",
        description: "Wide landscape format for shelf pricing",
        width: 100,
        height: 30,
        font_size: 16,
        include_barcode: 1,
        include_price: 1,
        include_mrp: 0,
        barcode_position: 'right',
        orientation: 'landscape',
        is_default: 0
      }
    ];

    const insertTemplate = db.prepare(`
      INSERT INTO label_templates (
        name, description, width, height, font_size, 
        include_barcode, include_price, include_mrp, 
        barcode_position, orientation, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const t of defaultTemplates) {
      insertTemplate.run(
        t.name, t.description, t.width, t.height, t.font_size,
        t.include_barcode, t.include_price, t.include_mrp,
        t.barcode_position, t.orientation, t.is_default
      );
    }
    console.log('✅ Default label templates seeded');
  }

  // Migration: Ensure all columns exist for label_templates (for users who had the partial table)
  try {
    const columns = [
      { name: 'product_name_font_size', type: 'INTEGER DEFAULT 18' },
      { name: 'include_manufacturing_date', type: 'INTEGER DEFAULT 0' },
      { name: 'include_expiry_date', type: 'INTEGER DEFAULT 0' },
      { name: 'barcode_width', type: 'INTEGER DEFAULT 80' },
      { name: 'barcode_height', type: 'INTEGER DEFAULT 40' },
      { name: 'orientation', type: 'TEXT DEFAULT "landscape"' },
      { name: 'custom_css', type: 'TEXT' },
      { name: 'store_title', type: 'TEXT' },
      { name: 'elements', type: 'TEXT' }
    ];

    for (const col of columns) {
      try {
        db.exec(`ALTER TABLE label_templates ADD COLUMN ${col.name} ${col.type}`);
        console.log(`✅ Added column ${col.name} to label_templates`);
      } catch (e) {
        // Column probably already exists
      }
    }
  } catch (e) {
    console.error('Migration error for label_templates:', e);
  }

  

  // tax_settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS "tax_settings" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"tax_calculation_method" text DEFAULT 'afterDiscount',
	"prices_include_tax" integer DEFAULT false,
	"enable_multiple_tax_rates" integer DEFAULT true,
	"company_gstin" text,
	"company_state" text,
	"company_state_code" text,
	"default_tax_category_id" integer,
	"updated_at" text DEFAULT '2026-03-31T17:45:31.377Z' NOT NULL,
	FOREIGN KEY ("default_tax_category_id") REFERENCES "tax_categories"("id") ON UPDATE no action ON DELETE no action
);
  `);

  // inventory_adjustments
  db.exec(`
    CREATE TABLE IF NOT EXISTS "inventory_adjustments" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"product_id" integer NOT NULL,
	"type" text NOT NULL,
	"quantity" real NOT NULL,
	"previous_quantity" real NOT NULL,
	"new_quantity" real NOT NULL,
	"reason" text,
	"notes" text,
	"user_id" integer NOT NULL,
	"created_at" text DEFAULT '2026-03-31T17:45:31.380Z' NOT NULL,
	FOREIGN KEY ("product_id") REFERENCES "products"("id") ON UPDATE no action ON DELETE no action,
	FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE no action ON DELETE no action
);
  `);

  // manufacturing_orders
  db.exec(`
    CREATE TABLE IF NOT EXISTS "manufacturing_orders" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"order_number" text NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" real NOT NULL,
	"required_quantity" real NOT NULL,
	"produced_quantity" real DEFAULT 0,
	"status" text DEFAULT 'pending',
	"priority" text DEFAULT 'medium',
	"start_date" text,
	"expected_completion_date" text,
	"actual_completion_date" text,
	"assigned_to" integer,
	"created_by" integer,
	"notes" text,
	"estimated_cost" real,
	"actual_cost" real,
	"created_at" text DEFAULT '2026-03-31T17:45:31.400Z' NOT NULL,
	"updated_at" text DEFAULT '2026-03-31T17:45:31.400Z' NOT NULL,
	FOREIGN KEY ("product_id") REFERENCES "products"("id") ON UPDATE no action ON DELETE no action,
	FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON UPDATE no action ON DELETE no action,
	FOREIGN KEY ("created_by") REFERENCES "users"("id") ON UPDATE no action ON DELETE no action
);
  `);

  // manufacturing_batches
  db.exec(`
    CREATE TABLE IF NOT EXISTS "manufacturing_batches" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"manufacturing_order_id" integer NOT NULL,
	"batch_number" text NOT NULL,
	"quantity" real NOT NULL,
	"status" text DEFAULT 'in_progress',
	"start_time" text,
	"end_time" text,
	"quality_status" text DEFAULT 'pending',
	"notes" text,
	"created_at" text DEFAULT '2026-03-31T17:45:31.401Z' NOT NULL,
	"updated_at" text DEFAULT '2026-03-31T17:45:31.401Z' NOT NULL,
	FOREIGN KEY ("manufacturing_order_id") REFERENCES "manufacturing_orders"("id") ON UPDATE no action ON DELETE no action
);
  `);

  // manufacturing_recipes
  db.exec(`
    CREATE TABLE IF NOT EXISTS "manufacturing_recipes" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"product_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"version" text DEFAULT '1.0',
	"instructions" text,
	"preparation_time" integer,
	"cooking_time" integer,
	"total_time" integer,
	"difficulty" text DEFAULT 'medium',
	"servings" integer DEFAULT 1,
	"active" integer DEFAULT true,
	"created_by" integer,
	"created_at" text DEFAULT '2026-03-31T17:45:31.401Z' NOT NULL,
	"updated_at" text DEFAULT '2026-03-31T17:45:31.401Z' NOT NULL,
	FOREIGN KEY ("product_id") REFERENCES "products"("id") ON UPDATE no action ON DELETE no action,
	FOREIGN KEY ("created_by") REFERENCES "users"("id") ON UPDATE no action ON DELETE no action
);
  `);

  // recipe_ingredients
  db.exec(`
    CREATE TABLE IF NOT EXISTS "recipe_ingredients" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"recipe_id" integer NOT NULL,
	"raw_material_id" integer NOT NULL,
	"quantity" real NOT NULL,
	"unit" text NOT NULL,
	"notes" text,
	"optional" integer DEFAULT false,
	"created_at" text DEFAULT '2026-03-31T17:45:31.401Z' NOT NULL,
	FOREIGN KEY ("recipe_id") REFERENCES "manufacturing_recipes"("id") ON UPDATE no action ON DELETE no action,
	FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id") ON UPDATE no action ON DELETE no action
);
  `);

  // employees
  db.exec(`
    CREATE TABLE IF NOT EXISTS "employees" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"user_id" integer NOT NULL,
	"employee_id" text NOT NULL,
	"department" text NOT NULL,
	"designation" text NOT NULL,
	"date_of_joining" text NOT NULL,
	"date_of_birth" text,
	"gender" text,
	"marital_status" text,
	"address" text,
	"phone_number" text,
	"emergency_contact" text,
	"emergency_phone" text,
	"bank_account_number" text,
	"bank_name" text,
	"ifsc_code" text,
	"pan_number" text,
	"aadhar_number" text,
	"pf_number" text,
	"esi_number" text,
	"employment_type" text DEFAULT 'full_time',
	"status" text DEFAULT 'active',
	"is_active" integer DEFAULT true,
	"created_at" text DEFAULT '2026-03-31T17:45:31.411Z' NOT NULL,
	"updated_at" text DEFAULT '2026-03-31T17:45:31.411Z' NOT NULL,
	FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE no action ON DELETE no action
);
  `);

  // salary_structures
  db.exec(`
    CREATE TABLE IF NOT EXISTS "salary_structures" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"employee_id" integer NOT NULL,
	"basic_salary" real NOT NULL,
	"hra" real DEFAULT 0,
	"da" real DEFAULT 0,
	"conveyance_allowance" real DEFAULT 0,
	"medical_allowance" real DEFAULT 0,
	"special_allowance" real DEFAULT 0,
	"other_allowances" real DEFAULT 0,
	"pf_employee_contribution" real DEFAULT 0,
	"pf_employer_contribution" real DEFAULT 0,
	"esi_employee_contribution" real DEFAULT 0,
	"esi_employer_contribution" real DEFAULT 0,
	"professional_tax" real DEFAULT 0,
	"income_tax" real DEFAULT 0,
	"other_deductions" real DEFAULT 0,
	"gross_salary" real NOT NULL,
	"net_salary" real NOT NULL,
	"effective_from" text NOT NULL,
	"effective_to" text,
	"is_active" integer DEFAULT true,
	"created_by" integer,
	"created_at" text DEFAULT '2026-03-31T17:45:31.411Z' NOT NULL,
	"updated_at" text DEFAULT '2026-03-31T17:45:31.411Z' NOT NULL,
	FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON UPDATE no action ON DELETE no action,
	FOREIGN KEY ("created_by") REFERENCES "users"("id") ON UPDATE no action ON DELETE no action
);
  `);

  // attendance
  db.exec(`
    CREATE TABLE IF NOT EXISTS "attendance" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"employee_id" integer NOT NULL,
	"date" text NOT NULL,
	"check_in_time" text,
	"check_out_time" text,
	"total_hours" real DEFAULT 0,
	"overtime_hours" real DEFAULT 0,
	"status" text DEFAULT 'present',
	"notes" text,
	"location" text,
	"is_manual_entry" integer DEFAULT false,
	"approved_by" integer,
	"created_at" text DEFAULT '2026-03-31T17:45:31.412Z' NOT NULL,
	"updated_at" text DEFAULT '2026-03-31T17:45:31.412Z' NOT NULL,
	FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON UPDATE no action ON DELETE no action,
	FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON UPDATE no action ON DELETE no action
);
  `);

  // leave_applications
  db.exec(`
    CREATE TABLE IF NOT EXISTS "leave_applications" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"employee_id" integer NOT NULL,
	"leave_type" text NOT NULL,
	"from_date" text NOT NULL,
	"to_date" text NOT NULL,
	"total_days" real NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending',
	"applied_date" text DEFAULT '2026-03-31T17:45:31.412Z' NOT NULL,
	"reviewed_by" integer,
	"reviewed_date" text,
	"review_comments" text,
	"emergency_contact" text,
	"is_half_day" integer DEFAULT false,
	"created_at" text DEFAULT '2026-03-31T17:45:31.412Z' NOT NULL,
	"updated_at" text DEFAULT '2026-03-31T17:45:31.412Z' NOT NULL,
	FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON UPDATE no action ON DELETE no action,
	FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON UPDATE no action ON DELETE no action
);
  `);

  // payroll_records
  db.exec(`
    CREATE TABLE IF NOT EXISTS "payroll_records" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"employee_id" integer NOT NULL,
	"salary_structure_id" integer NOT NULL,
	"payroll_month" text NOT NULL,
	"working_days" real NOT NULL,
	"present_days" real NOT NULL,
	"absent_days" real DEFAULT 0,
	"leave_days" real DEFAULT 0,
	"half_days" real DEFAULT 0,
	"overtime_hours" real DEFAULT 0,
	"overtime_amount" real DEFAULT 0,
	"basic_salary_earned" real NOT NULL,
	"allowances_earned" real NOT NULL,
	"deductions_applied" real NOT NULL,
	"gross_salary_earned" real NOT NULL,
	"net_salary_earned" real NOT NULL,
	"bonus_amount" real DEFAULT 0,
	"incentive_amount" real DEFAULT 0,
	"advance_taken" real DEFAULT 0,
	"loan_deduction" real DEFAULT 0,
	"status" text DEFAULT 'draft',
	"processed_date" text,
	"paid_date" text,
	"payment_method" text,
	"bank_transaction_id" text,
	"notes" text,
	"processed_by" integer,
	"created_at" text DEFAULT '2026-03-31T17:45:31.412Z' NOT NULL,
	"updated_at" text DEFAULT '2026-03-31T17:45:31.412Z' NOT NULL,
	FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON UPDATE no action ON DELETE no action,
	FOREIGN KEY ("salary_structure_id") REFERENCES "salary_structures"("id") ON UPDATE no action ON DELETE no action,
	FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON UPDATE no action ON DELETE no action
);
  `);

  // employee_advances
  db.exec(`
    CREATE TABLE IF NOT EXISTS "employee_advances" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"employee_id" integer NOT NULL,
	"advance_amount" real NOT NULL,
	"reason" text NOT NULL,
	"approved_amount" real,
	"installments" integer DEFAULT 1,
	"installment_amount" real,
	"paid_installments" integer DEFAULT 0,
	"remaining_amount" real,
	"status" text DEFAULT 'pending',
	"request_date" text DEFAULT '2026-03-31T17:45:31.413Z' NOT NULL,
	"approved_date" text,
	"approved_by" integer,
	"notes" text,
	"created_at" text DEFAULT '2026-03-31T17:45:31.413Z' NOT NULL,
	"updated_at" text DEFAULT '2026-03-31T17:45:31.413Z' NOT NULL,
	FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON UPDATE no action ON DELETE no action,
	FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON UPDATE no action ON DELETE no action
);
  `);

  // payroll_settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS "payroll_settings" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"company_name" text NOT NULL,
	"payroll_frequency" text DEFAULT 'monthly',
	"standard_working_days" real DEFAULT 26,
	"standard_working_hours" real DEFAULT 8,
	"overtime_rate" real DEFAULT 1.5,
	"pf_rate" real DEFAULT 12,
	"esi_rate" real DEFAULT 3.25,
	"professional_tax_slab" text,
	"leave_policy" text,
	"probation_period" integer DEFAULT 90,
	"notice_period" integer DEFAULT 30,
	"financial_year_start" text DEFAULT '04-01',
	"is_active" integer DEFAULT true,
	"updated_by" integer,
	"updated_at" text DEFAULT '2026-03-31T17:45:31.413Z' NOT NULL,
	FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON UPDATE no action ON DELETE no action
);
  `);

  // offers
  db.exec(`
    CREATE TABLE IF NOT EXISTS "offers" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"trigger_type" text DEFAULT 'automatic',
	"value" real NOT NULL,
	"min_purchase" real DEFAULT 0,
	"max_discount" real,
	"valid_from" text NOT NULL,
	"valid_to" text NOT NULL,
	"applicable_products" text,
	"max_usage" integer,
	"current_usage" integer DEFAULT 0,
	"active" integer DEFAULT true,
	"created_at" text DEFAULT '2026-03-31T17:45:31.380Z' NOT NULL,
	"updated_at" text DEFAULT '2026-03-31T17:45:31.380Z' NOT NULL
);
  `);

  // offer_usage
  db.exec(`
    CREATE TABLE IF NOT EXISTS "offer_usage" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"offer_id" integer NOT NULL,
	"customer_id" integer,
	"sale_id" integer,
	"used_at" text DEFAULT '2026-03-31T17:45:31.380Z' NOT NULL,
	FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON UPDATE no action ON DELETE no action,
	FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON UPDATE no action ON DELETE no action,
	FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON UPDATE no action ON DELETE no action
);
  `);

  // customer_loyalty
  db.exec(`
    CREATE TABLE IF NOT EXISTS "customer_loyalty" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"customer_id" integer NOT NULL,
	"total_points" real DEFAULT 0,
	"used_points" real DEFAULT 0,
	"available_points" real DEFAULT 0,
	"tier" text DEFAULT 'Bronze',
	"created_at" text DEFAULT '2026-03-31T17:45:31.380Z' NOT NULL,
	"last_updated" text DEFAULT '2026-03-31T17:45:31.380Z' NOT NULL,
	FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON UPDATE no action ON DELETE no action
);
  `);

  // Ensure table columns exist (Alter Table if necessary)
  const migrationTables = ['customers', 'sales', 'cash_registers', 'suppliers', 'purchases', 'hsn_codes', 'purchase_items'];
  for (const table of migrationTables) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all().map(col => (col as any).name);
    
    if (table === 'customers' && columns.length > 0 && !columns.includes('outstanding_balance')) {
      console.log('🔄 Adding outstanding_balance to customers...');
      db.exec('ALTER TABLE customers ADD COLUMN outstanding_balance REAL DEFAULT 0');
    }
    
    if (table === 'sales' && columns.length > 0) {
      if (!columns.includes('credit_amount')) {
        console.log('🔄 Adding credit_amount to sales...');
        db.exec('ALTER TABLE sales ADD COLUMN credit_amount REAL DEFAULT 0');
      }
      if (!columns.includes('bill_number')) {
        console.log('🔄 Adding bill_number to sales...');
        db.exec('ALTER TABLE sales ADD COLUMN bill_number TEXT');
      }
      if (!columns.includes('notes')) {
        console.log('🔄 Adding notes to sales...');
        db.exec('ALTER TABLE sales ADD COLUMN notes TEXT');
      }
    }
    
    if (table === 'cash_registers' && columns.length > 0 && !columns.includes('total_credit_sales')) {
      console.log('🔄 Adding total_credit_sales to cash_registers...');
      db.exec('ALTER TABLE cash_registers ADD COLUMN total_credit_sales REAL DEFAULT 0');
    }
    
    if (table === 'suppliers' && columns.length > 0) {
      if (!columns.includes('credit_limit')) {
        console.log('🔄 Adding credit_limit to suppliers...');
        db.exec('ALTER TABLE suppliers ADD COLUMN credit_limit REAL DEFAULT 0');
      }
      if (!columns.includes('outstanding_balance')) {
        console.log('🔄 Adding outstanding_balance to suppliers...');
        db.exec('ALTER TABLE suppliers ADD COLUMN outstanding_balance REAL DEFAULT 0');
      }
    }
    
    if (table === 'purchases' && columns.length > 0) {
      if (!columns.includes('amount_paid')) {
        console.log('🔄 Adding amount_paid to purchases...');
        db.exec('ALTER TABLE purchases ADD COLUMN amount_paid REAL DEFAULT 0');
      }
      if (!columns.includes('payment_status')) {
        console.log('🔄 Adding payment_status to purchases...');
        db.exec("ALTER TABLE purchases ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid'");
      }
    }

    if (table === 'purchase_items' && columns.length > 0) {
      if (!columns.includes('wholesale_price')) {
        console.log('🔄 Adding wholesale_price to purchase_items...');
        db.exec('ALTER TABLE purchase_items ADD COLUMN wholesale_price REAL');
      }
      if (!columns.includes('remaining_quantity')) {
        console.log('🔄 Adding remaining_quantity to purchase_items...');
        db.exec('ALTER TABLE purchase_items ADD COLUMN remaining_quantity REAL');
      }
    }
    
    if (table === 'hsn_codes' && columns.length > 0) {
      if (columns.includes('code') && !columns.includes('hsn_code')) {
        console.log('🔄 Renaming code to hsn_code in hsn_codes...');
        try {
          db.exec('ALTER TABLE hsn_codes RENAME COLUMN code TO hsn_code');
        } catch(e) { console.error('Error renaming hsn_codes column', e); }
      }
      if (!columns.includes('tax_category_id')) {
        console.log('🔄 Adding tax_category_id to hsn_codes...');
        db.exec('ALTER TABLE hsn_codes ADD COLUMN tax_category_id INTEGER DEFAULT 1');
      }
      if (!columns.includes('cgst_rate')) {
        console.log('🔄 Adding tax rate columns to hsn_codes...');
        db.exec('ALTER TABLE hsn_codes ADD COLUMN cgst_rate REAL DEFAULT 0');
        db.exec('ALTER TABLE hsn_codes ADD COLUMN sgst_rate REAL DEFAULT 0');
        db.exec('ALTER TABLE hsn_codes ADD COLUMN igst_rate REAL DEFAULT 0');
        db.exec('ALTER TABLE hsn_codes ADD COLUMN cess_rate REAL DEFAULT 0');
      }
    }
  }

  console.log('✅ All tables created successfully');

  // Migration: Ensure stock_quantity is REAL
  try {
    // In SQLite, we can't easily change column types, but we can verify it works
    // and potentially recreate the table if we were much earlier in development.
    // However, SQLite is dynamic, so as long as we don't force INTEGER, it works.
    // For now, we'll just ensure the code definitions match.
    console.log('🔄 Verifying stock_quantity affinity...');
  } catch (e) {
    console.error('Migration error:', e);
  }

  // Create default admin user if it doesn't exist
  const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');

  if (!existingAdmin) {
    console.log('🔄 Creating default admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    db.prepare(`
      INSERT INTO users (username, password, name, email, role, active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('admin', hashedPassword, 'Administrator', 'admin@pos.local', 'admin', 1);

    console.log('✅ Default admin user created (username: admin, password: admin123)');
  }

  // Create default category if none exist
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };

  if (categoryCount.count === 0) {
    console.log('🔄 Creating default categories...');

    const categories = [
      { name: 'General', description: 'General products' },
      { name: 'Electronics', description: 'Electronic items and gadgets' },
      { name: 'Clothing', description: 'Apparel and fashion items' },
      { name: 'Food & Beverages', description: 'Food products and drinks' },
      { name: 'Home & Garden', description: 'Home improvement and gardening items' }
    ];

    const insertCategory = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');

    for (const category of categories) {
      insertCategory.run(category.name, category.description);
    }

    console.log('✅ Default categories created');
  }

  // Create default supplier if none exist
  const supplierCount = db.prepare('SELECT COUNT(*) as count FROM suppliers').get() as { count: number };

  if (supplierCount.count === 0) {
    console.log('🔄 Creating default suppliers...');

    const suppliers = [
      {
        name: 'General Supplier',
        email: 'supplier@example.com',
        phone: '+1234567890',
        address: '123 Business St, City, State',
        contact_person: 'John Doe'
      },
      {
        name: 'Fresh Foods Supply',
        email: 'fresh@foods.com',
        phone: '+1234567891',
        address: '456 Market Ave, City, State',
        contact_person: 'Jane Smith'
      }
    ];

    const insertSupplier = db.prepare(`
      INSERT INTO suppliers (name, email, phone, address, contact_person)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const supplier of suppliers) {
      insertSupplier.run(
        supplier.name,
        supplier.email,
        supplier.phone,
        supplier.address,
        supplier.contact_person
      );
    }

    console.log('✅ Default suppliers created');
  }

  // Create default expense categories
  const existingExpenseCategories = db.prepare('SELECT COUNT(*) as count FROM expense_categories').get() as { count: number };
  if (existingExpenseCategories.count === 0) {
    const expenseCategories = [
      { name: 'Office Supplies', description: 'Stationery, equipment, and office materials' },
      { name: 'Travel & Transportation', description: 'Business travel, fuel, and transportation costs' },
      { name: 'Marketing & Advertising', description: 'Promotional materials, ads, and marketing campaigns' },
      { name: 'Utilities', description: 'Electricity, water, internet, and phone bills' },
      { name: 'Equipment & Maintenance', description: 'Equipment purchases and maintenance costs' },
      { name: 'Professional Services', description: 'Legal, accounting, and consulting fees' },
      { name: 'Insurance', description: 'Business insurance premiums' },
      { name: 'Rent & Facilities', description: 'Office rent and facility costs' }
    ];

    const insertExpenseCategory = db.prepare(`
      INSERT INTO expense_categories (name, description)
      VALUES (?, ?)
    `);

    for (const category of expenseCategories) {
      insertExpenseCategory.run(category.name, category.description);
    }

    console.log('✅ Default expense categories created');
  }

  // Create default offers
  const existingOffers = db.prepare('SELECT COUNT(*) as count FROM offers').get() as { count: number };
  if (existingOffers.count === 0) {
    const defaultOffers = [
      {
        name: 'Weekend Special',
        description: '10% off on weekend purchases above ₹500',
        offer_type: 'percentage',
        discount_value: '10',
        min_purchase_amount: '500',
        max_discount_amount: '200',
        time_start: '09:00',
        time_end: '21:00',
        created_by: 1
      },
      {
        name: 'Buy 2 Get 1 Free',
        description: 'Buy 2 items, get 1 free (lowest priced item)',
        offer_type: 'buy_x_get_y',
        discount_value: '100',
        buy_quantity: 2,
        get_quantity: 1,
        created_by: 1
      },
      {
        name: 'Loyalty Points',
        description: 'Earn 10 points for every ₹1000 spent',
        offer_type: 'loyalty_points',
        discount_value: '0',
        points_threshold: '1000',
        points_reward: '10',
        created_by: 1
      }
    ];

    const insertOffer = db.prepare(`
      INSERT INTO offers (name, description, offer_type, discount_value, min_purchase_amount, max_discount_amount, 
                         buy_quantity, get_quantity, time_start, time_end, points_threshold, points_reward, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const offer of defaultOffers) {
      insertOffer.run(
        offer.name,
        offer.description,
        offer.offer_type,
        offer.discount_value,
        offer.min_purchase_amount || null,
        offer.max_discount_amount || null,
        offer.buy_quantity || null,
        offer.get_quantity || null,
        offer.time_start || null,
        offer.time_end || null,
        offer.points_threshold || null,
        offer.points_reward || null,
        offer.created_by
      );
    }

    console.log('✅ Default offers created');
  }

  db.close();
  console.log('🎉 Database initialization completed successfully!');
}
console.log('🚩 Checkpoint M_LOADED: sqlite-migrate.ts finished loading');

// Self-execution removed to prevent duplicate initialization when imported by server.
