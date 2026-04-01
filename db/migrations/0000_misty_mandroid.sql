CREATE TABLE `attendance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`date` text NOT NULL,
	`check_in_time` text,
	`check_out_time` text,
	`total_hours` real DEFAULT 0,
	`overtime_hours` real DEFAULT 0,
	`status` text DEFAULT 'present',
	`notes` text,
	`location` text,
	`is_manual_entry` integer DEFAULT false,
	`approved_by` integer,
	`created_at` text DEFAULT '2026-03-31T17:45:31.412Z' NOT NULL,
	`updated_at` text DEFAULT '2026-03-31T17:45:31.412Z' NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bank_account_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`color` text DEFAULT '#3B82F6',
	`icon` text DEFAULT 'Banknote',
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT '2026-03-31T17:45:31.408Z' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bank_account_categories_name_unique` ON `bank_account_categories` (`name`);--> statement-breakpoint
CREATE TABLE `bank_account_category_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	`created_at` text DEFAULT '2026-03-31T17:45:31.408Z' NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `bank_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `bank_account_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bank_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_name` text NOT NULL,
	`account_number` text NOT NULL,
	`ifsc_code` text,
	`bank_name` text NOT NULL,
	`branch_name` text,
	`account_type` text NOT NULL,
	`currency` text DEFAULT 'INR' NOT NULL,
	`current_balance` real DEFAULT 0 NOT NULL,
	`available_balance` real DEFAULT 0 NOT NULL,
	`minimum_balance` real DEFAULT 0,
	`interest_rate` real DEFAULT 0,
	`status` text DEFAULT 'active' NOT NULL,
	`is_default` integer DEFAULT false,
	`opening_date` text,
	`last_transaction_date` text,
	`description` text,
	`created_by` integer,
	`created_at` text DEFAULT '2026-03-31T17:45:31.407Z' NOT NULL,
	`updated_at` text DEFAULT '2026-03-31T17:45:31.407Z' NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bank_accounts_account_number_unique` ON `bank_accounts` (`account_number`);--> statement-breakpoint
CREATE TABLE `bank_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`transaction_id` text NOT NULL,
	`transaction_type` text NOT NULL,
	`transaction_mode` text NOT NULL,
	`amount` real NOT NULL,
	`balance_after` real NOT NULL,
	`description` text NOT NULL,
	`reference_number` text,
	`beneficiary_name` text,
	`beneficiary_account` text,
	`transfer_account_id` integer,
	`category` text,
	`tags` text,
	`is_reconciled` integer DEFAULT false,
	`reconciled_at` text,
	`receipt_path` text,
	`notes` text,
	`processed_by` integer,
	`transaction_date` text NOT NULL,
	`created_at` text DEFAULT '2026-03-31T17:45:31.407Z' NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `bank_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transfer_account_id`) REFERENCES `bank_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`processed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bank_transactions_transaction_id_unique` ON `bank_transactions` (`transaction_id`);--> statement-breakpoint
CREATE TABLE `cash_register_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`register_id` integer NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`payment_method` text NOT NULL,
	`description` text,
	`reason` text,
	`notes` text,
	`reference_id` integer,
	`user_id` integer NOT NULL,
	`created_by` text,
	`created_at` text DEFAULT '2026-03-31T17:45:31.380Z' NOT NULL,
	FOREIGN KEY (`register_id`) REFERENCES `cash_registers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cash_registers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`register_id` integer NOT NULL,
	`status` text DEFAULT 'closed' NOT NULL,
	`opening_cash` real DEFAULT 0 NOT NULL,
	`current_cash` real DEFAULT 0 NOT NULL,
	`cash_received` real DEFAULT 0 NOT NULL,
	`upi_received` real DEFAULT 0 NOT NULL,
	`card_received` real DEFAULT 0 NOT NULL,
	`bank_received` real DEFAULT 0 NOT NULL,
	`cheque_received` real DEFAULT 0 NOT NULL,
	`other_received` real DEFAULT 0 NOT NULL,
	`total_withdrawals` real DEFAULT 0 NOT NULL,
	`total_refunds` real DEFAULT 0 NOT NULL,
	`total_sales` real DEFAULT 0 NOT NULL,
	`total_credit_sales` real DEFAULT 0 NOT NULL,
	`notes` text,
	`opened_by` integer,
	`closed_by` integer,
	`opened_at` text,
	`closed_at` text,
	`total_transactions` integer DEFAULT 0,
	`created_at` text DEFAULT '2026-03-31T17:45:31.380Z' NOT NULL,
	FOREIGN KEY (`opened_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`closed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT '2026-03-31T17:45:31.377Z' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `customer_loyalty` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`total_points` real DEFAULT 0,
	`used_points` real DEFAULT 0,
	`available_points` real DEFAULT 0,
	`tier` text DEFAULT 'Bronze',
	`created_at` text DEFAULT '2026-03-31T17:45:31.380Z' NOT NULL,
	`last_updated` text DEFAULT '2026-03-31T17:45:31.380Z' NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`address` text,
	`tax_id` text,
	`credit_limit` real DEFAULT 0,
	`outstanding_balance` real DEFAULT 0,
	`business_name` text,
	`created_at` text DEFAULT '2026-03-31T17:45:31.379Z' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`active` integer DEFAULT true,
	`created_at` text DEFAULT '2026-03-31T17:45:31.377Z' NOT NULL,
	`updated_at` text DEFAULT '2026-03-31T17:45:31.377Z' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `departments_name_unique` ON `departments` (`name`);--> statement-breakpoint
CREATE TABLE `employee_advances` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`advance_amount` real NOT NULL,
	`reason` text NOT NULL,
	`approved_amount` real,
	`installments` integer DEFAULT 1,
	`installment_amount` real,
	`paid_installments` integer DEFAULT 0,
	`remaining_amount` real,
	`status` text DEFAULT 'pending',
	`request_date` text DEFAULT '2026-03-31T17:45:31.413Z' NOT NULL,
	`approved_date` text,
	`approved_by` integer,
	`notes` text,
	`created_at` text DEFAULT '2026-03-31T17:45:31.413Z' NOT NULL,
	`updated_at` text DEFAULT '2026-03-31T17:45:31.413Z' NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`employee_id` text NOT NULL,
	`department` text NOT NULL,
	`designation` text NOT NULL,
	`date_of_joining` text NOT NULL,
	`date_of_birth` text,
	`gender` text,
	`marital_status` text,
	`address` text,
	`phone_number` text,
	`emergency_contact` text,
	`emergency_phone` text,
	`bank_account_number` text,
	`bank_name` text,
	`ifsc_code` text,
	`pan_number` text,
	`aadhar_number` text,
	`pf_number` text,
	`esi_number` text,
	`employment_type` text DEFAULT 'full_time',
	`status` text DEFAULT 'active',
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT '2026-03-31T17:45:31.411Z' NOT NULL,
	`updated_at` text DEFAULT '2026-03-31T17:45:31.411Z' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employees_employee_id_unique` ON `employees` (`employee_id`);--> statement-breakpoint
CREATE TABLE `expense_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon` text,
	`color` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT '2026-03-31T17:45:31.395Z' NOT NULL,
	`updated_at` text DEFAULT '2026-03-31T17:45:31.395Z' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`expense_number` text NOT NULL,
	`category_id` integer,
	`supplier_id` integer,
	`purchase_id` integer,
	`user_id` integer,
	`amount` real NOT NULL,
	`description` text,
	`expense_date` text NOT NULL,
	`payment_method` text DEFAULT 'cash',
	`reference` text,
	`notes` text,
	`attachments` text,
	`is_recurring` integer DEFAULT false,
	`recurring_interval` text,
	`tags` text,
	`created_at` text DEFAULT '2026-03-31T17:45:31.395Z' NOT NULL,
	`updated_at` text DEFAULT '2026-03-31T17:45:31.395Z' NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `expense_categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `hsn_codes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hsn_code` text NOT NULL,
	`description` text NOT NULL,
	`tax_category_id` integer NOT NULL,
	`cgst_rate` real DEFAULT 0,
	`sgst_rate` real DEFAULT 0,
	`igst_rate` real DEFAULT 0,
	`cess_rate` real DEFAULT 0,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT '2026-03-31T17:45:31.377Z' NOT NULL,
	`updated_at` text DEFAULT '2026-03-31T17:45:31.377Z' NOT NULL,
	FOREIGN KEY (`tax_category_id`) REFERENCES `tax_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hsn_codes_hsn_code_unique` ON `hsn_codes` (`hsn_code`);--> statement-breakpoint
CREATE TABLE `inventory_adjustments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`type` text NOT NULL,
	`quantity` real NOT NULL,
	`previous_quantity` real NOT NULL,
	`new_quantity` real NOT NULL,
	`reason` text,
	`notes` text,
	`user_id` integer NOT NULL,
	`created_at` text DEFAULT '2026-03-31T17:45:31.380Z' NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `item_product_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`active` integer DEFAULT true,
	`created_at` text DEFAULT '2026-03-31T17:45:31.377Z' NOT NULL,
	`updated_at` text DEFAULT '2026-03-31T17:45:31.377Z' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `item_product_types_name_unique` ON `item_product_types` (`name`);--> statement-breakpoint
CREATE TABLE `label_printers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'endura',
	`connection` text DEFAULT 'usb',
	`ip_address` text,
	`port` integer,
	`paper_width` integer DEFAULT 80,
	`paper_height` integer DEFAULT 40,
	`is_default` integer DEFAULT false,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT '2026-03-31T17:45:31.421Z' NOT NULL,
	`updated_at` text DEFAULT '2026-03-31T17:45:31.421Z' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `label_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`width` real NOT NULL,
	`height` real NOT NULL,
	`font_size` integer DEFAULT 12 NOT NULL,
	`product_name_font_size` integer DEFAULT 18,
	`include_barcode` integer DEFAULT true,
	`include_price` integer DEFAULT true,
	`include_description` integer DEFAULT false,
	`include_mrp` integer DEFAULT true,
	`include_weight` integer DEFAULT false,
	`include_hsn` integer DEFAULT false,
	`include_manufacturing_date` integer DEFAULT false,
	`include_expiry_date` integer DEFAULT false,
	`barcode_position` text DEFAULT 'bottom',
	`barcode_width` integer DEFAULT 80,
	`barcode_height` integer DEFAULT 40,
	`orientation` text DEFAULT 'landscape',
	`border_style` text DEFAULT 'solid',
	`border_width` integer DEFAULT 1,
	`background_color` text DEFAULT '#ffffff',
	`text_color` text DEFAULT '#000000',
	`custom_css` text,
	`store_title` text,
	`elements` text,
	`is_default` integer DEFAULT false,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT '2026-03-31T17:45:31.421Z' NOT NULL,
	`updated_at` text DEFAULT '2026-03-31T17:45:31.421Z' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `label_templates_name_unique` ON `label_templates` (`name`);--> statement-breakpoint
CREATE TABLE `leave_applications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`leave_type` text NOT NULL,
	`from_date` text NOT NULL,
	`to_date` text NOT NULL,
	`total_days` real NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'pending',
	`applied_date` text DEFAULT '2026-03-31T17:45:31.412Z' NOT NULL,
	`reviewed_by` integer,
	`reviewed_date` text,
	`review_comments` text,
	`emergency_contact` text,
	`is_half_day` integer DEFAULT false,
	`created_at` text DEFAULT '2026-03-31T17:45:31.412Z' NOT NULL,
	`updated_at` text DEFAULT '2026-03-31T17:45:31.412Z' NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `manufacturing_batches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`manufacturing_order_id` integer NOT NULL,
	`batch_number` text NOT NULL,
	`quantity` real NOT NULL,
	`status` text DEFAULT 'in_progress',
	`start_time` text,
	`end_time` text,
	`quality_status` text DEFAULT 'pending',
	`notes` text,
	`created_at` text DEFAULT '2026-03-31T17:45:31.401Z' NOT NULL,
	`updated_at` text DEFAULT '2026-03-31T17:45:31.401Z' NOT NULL,
	FOREIGN KEY (`manufacturing_order_id`) REFERENCES `manufacturing_orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `manufacturing_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`product_id` integer NOT NULL,
	`quantity` real NOT NULL,
	`required_quantity` real NOT NULL,
	`produced_quantity` real DEFAULT 0,
	`status` text DEFAULT 'pending',
	`priority` text DEFAULT 'medium',
	`start_date` text,
	`expected_completion_date` text,
	`actual_completion_date` text,
	`assigned_to` integer,
	`created_by` integer,
	`notes` text,
	`estimated_cost` real,
	`actual_cost` real,
	`created_at` text DEFAULT '2026-03-31T17:45:31.400Z' NOT NULL,
	`updated_at` text DEFAULT '2026-03-31T17:45:31.400Z' NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `manufacturing_recipes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`version` text DEFAULT '1.0',
	`instructions` text,
	`preparation_time` integer,
	`cooking_time` integer,
	`total_time` integer,
	`difficulty` text DEFAULT 'medium',
	`servings` integer DEFAULT 1,
	`active` integer DEFAULT true,
	`created_by` integer,
	`created_at` text DEFAULT '2026-03-31T17:45:31.401Z' NOT NULL,
	`updated_at` text DEFAULT '2026-03-31T17:45:31.401Z' NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `offer_usage` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`offer_id` integer NOT NULL,
	`customer_id` integer,
	`sale_id` integer,
	`used_at` text DEFAULT '2026-03-31T17:45:31.380Z' NOT NULL,
	FOREIGN KEY (`offer_id`) REFERENCES `offers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `offers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`trigger_type` text DEFAULT 'automatic',
	`value` real NOT NULL,
	`min_purchase` real DEFAULT 0,
	`max_discount` real,
	`valid_from` text NOT NULL,
	`valid_to` text NOT NULL,
	`applicable_products` text,
	`max_usage` integer,
	`current_usage` integer DEFAULT 0,
	`active` integer DEFAULT true,
	`created_at` text DEFAULT '2026-03-31T17:45:31.380Z' NOT NULL,
	`updated_at` text DEFAULT '2026-03-31T17:45:31.380Z' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payroll_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`salary_structure_id` integer NOT NULL,
	`payroll_month` text NOT NULL,
	`working_days` real NOT NULL,
	`present_days` real NOT NULL,
	`absent_days` real DEFAULT 0,
	`leave_days` real DEFAULT 0,
	`half_days` real DEFAULT 0,
	`overtime_hours` real DEFAULT 0,
	`overtime_amount` real DEFAULT 0,
	`basic_salary_earned` real NOT NULL,
	`allowances_earned` real NOT NULL,
	`deductions_applied` real NOT NULL,
	`gross_salary_earned` real NOT NULL,
	`net_salary_earned` real NOT NULL,
	`bonus_amount` real DEFAULT 0,
	`incentive_amount` real DEFAULT 0,
	`advance_taken` real DEFAULT 0,
	`loan_deduction` real DEFAULT 0,
	`status` text DEFAULT 'draft',
	`processed_date` text,
	`paid_date` text,
	`payment_method` text,
	`bank_transaction_id` text,
	`notes` text,
	`processed_by` integer,
	`created_at` text DEFAULT '2026-03-31T17:45:31.412Z' NOT NULL,
	`updated_at` text DEFAULT '2026-03-31T17:45:31.412Z' NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`salary_structure_id`) REFERENCES `salary_structures`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`processed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payroll_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_name` text NOT NULL,
	`payroll_frequency` text DEFAULT 'monthly',
	`standard_working_days` real DEFAULT 26,
	`standard_working_hours` real DEFAULT 8,
	`overtime_rate` real DEFAULT 1.5,
	`pf_rate` real DEFAULT 12,
	`esi_rate` real DEFAULT 3.25,
	`professional_tax_slab` text,
	`leave_policy` text,
	`probation_period` integer DEFAULT 90,
	`notice_period` integer DEFAULT 30,
	`financial_year_start` text DEFAULT '04-01',
	`is_active` integer DEFAULT true,
	`updated_by` integer,
	`updated_at` text DEFAULT '2026-03-31T17:45:31.413Z' NOT NULL,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `print_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`template_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`product_ids` text NOT NULL,
	`copies` integer DEFAULT 1 NOT NULL,
	`labels_per_row` integer DEFAULT 2 NOT NULL,
	`paper_size` text DEFAULT 'A4',
	`orientation` text DEFAULT 'portrait',
	`status` text DEFAULT 'completed',
	`total_labels` integer NOT NULL,
	`custom_text` text,
	`print_settings` text,
	`created_at` text DEFAULT '2026-03-31T17:45:31.421Z' NOT NULL,
	`updated_at` text DEFAULT '2026-03-31T17:45:31.421Z' NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `label_templates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`sku` text NOT NULL,
	`price` real NOT NULL,
	`mrp` real NOT NULL,
	`cost` real NOT NULL,
	`wholesale_price` real,
	`weight` real,
	`weight_unit` text DEFAULT 'kg',
	`category_id` integer NOT NULL,
	`stock_quantity` real DEFAULT 0 NOT NULL,
	`alert_threshold` integer DEFAULT 10 NOT NULL,
	`barcode` text,
	`image` text,
	`hsn_code` text,
	`gst_code` text,
	`cgst_rate` text DEFAULT '0',
	`sgst_rate` text DEFAULT '0',
	`igst_rate` text DEFAULT '0',
	`cess_rate` text DEFAULT '0',
	`tax_calculation_method` text,
	`manufacturer_name` text,
	`supplier_name` text,
	`manufacturer_id` integer,
	`supplier_id` integer,
	`alias` text,
	`item_product_type` text,
	`department` text,
	`brand` text,
	`buyer` text,
	`purchase_gst_calculated_on` text,
	`gst_uom` text,
	`purchase_abatement` text,
	`config_item_with_commodity` integer DEFAULT false,
	`senior_exempt_applicable` integer DEFAULT false,
	`ean_code_required` integer DEFAULT false,
	`weights_per_unit` text,
	`batch_expiry_details` text,
	`item_preparations_status` text,
	`grinding_charge` text,
	`weight_in_gms` text,
	`bulk_item_name` text,
	`repackage_units` text,
	`repackage_type` text,
	`packaging_material` text,
	`decimal_point` text,
	`product_type` text,
	`sell_by` text,
	`item_per_unit` text,
	`maintain_selling_mrp_by` text,
	`batch_selection` text,
	`is_weighable` integer DEFAULT false,
	`sku_type` text,
	`indent_type` text,
	`gate_keeper_margin` text,
	`allow_item_free` integer DEFAULT false,
	`show_on_mobile_dashboard` integer DEFAULT true,
	`enable_mobile_notifications` integer DEFAULT true,
	`quick_add_to_cart` integer DEFAULT false,
	`perishable_item` integer DEFAULT false,
	`temperature_controlled` integer DEFAULT false,
	`fragile_item` integer DEFAULT false,
	`track_serial_numbers` integer DEFAULT false,
	`fda_approved` integer DEFAULT false,
	`bis_certified` integer DEFAULT false,
	`organic_certified` integer DEFAULT false,
	`item_ingredients` text,
	`model` text,
	`size` text,
	`color` text,
	`material` text,
	`min_order_qty` integer DEFAULT 1,
	`max_order_qty` integer,
	`reorder_point` integer,
	`shelf_life` integer,
	`expiry_date` text,
	`batch_number` text,
	`serial_number` text,
	`warranty` text,
	`location` text,
	`rack` text,
	`bin` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT '2026-03-31T17:45:31.378Z' NOT NULL,
	`updated_at` text DEFAULT '2026-03-31T17:45:31.378Z' NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE TABLE `purchase_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`purchase_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`quantity` real NOT NULL,
	`unit_cost` real NOT NULL,
	`subtotal` real NOT NULL,
	`received_qty` real DEFAULT 0,
	`free_qty` real DEFAULT 0,
	`cost` real,
	`selling_price` real,
	`wholesale_price` real,
	`mrp` real,
	`hsn_code` text,
	`tax_percentage` real,
	`discount_amount` real,
	`discount_percent` real,
	`expiry_date` text,
	`batch_number` text,
	`net_cost` real,
	`roi_percent` real,
	`gross_profit_percent` real,
	`net_amount` real,
	`cash_percent` real,
	`cash_amount` real,
	`location` text,
	`unit` text,
	`remaining_quantity` real,
	`created_at` text DEFAULT '2026-03-31T17:45:31.379Z' NOT NULL,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`supplier_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`total` real NOT NULL,
	`tax` real DEFAULT 0 NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`order_date` text NOT NULL,
	`expected_date` text,
	`received_date` text,
	`amount_paid` real DEFAULT 0,
	`payment_status` text DEFAULT 'unpaid' NOT NULL,
	`notes` text,
	`created_at` text DEFAULT '2026-03-31T17:45:31.379Z' NOT NULL,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchases_order_number_unique` ON `purchases` (`order_number`);--> statement-breakpoint
CREATE TABLE `quality_control_checks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`batch_id` integer NOT NULL,
	`check_type` text NOT NULL,
	`check_parameter` text NOT NULL,
	`expected_value` text,
	`actual_value` text,
	`status` text DEFAULT 'pending',
	`checked_by` integer,
	`check_date` text DEFAULT '2026-03-31T17:45:31.401Z',
	`notes` text,
	`created_at` text DEFAULT '2026-03-31T17:45:31.401Z' NOT NULL,
	FOREIGN KEY (`batch_id`) REFERENCES `manufacturing_batches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`checked_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `raw_materials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`sku` text NOT NULL,
	`category` text,
	`unit` text NOT NULL,
	`cost_per_unit` real NOT NULL,
	`stock_quantity` integer DEFAULT 0,
	`minimum_stock` integer DEFAULT 0,
	`supplier_id` integer,
	`storage_location` text,
	`expiry_date` text,
	`batch_number` text,
	`active` integer DEFAULT true,
	`created_at` text DEFAULT '2026-03-31T17:45:31.401Z' NOT NULL,
	`updated_at` text DEFAULT '2026-03-31T17:45:31.401Z' NOT NULL,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `recipe_ingredients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` integer NOT NULL,
	`raw_material_id` integer NOT NULL,
	`quantity` real NOT NULL,
	`unit` text NOT NULL,
	`notes` text,
	`optional` integer DEFAULT false,
	`created_at` text DEFAULT '2026-03-31T17:45:31.401Z' NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `manufacturing_recipes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`raw_material_id`) REFERENCES `raw_materials`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `salary_structures` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`basic_salary` real NOT NULL,
	`hra` real DEFAULT 0,
	`da` real DEFAULT 0,
	`conveyance_allowance` real DEFAULT 0,
	`medical_allowance` real DEFAULT 0,
	`special_allowance` real DEFAULT 0,
	`other_allowances` real DEFAULT 0,
	`pf_employee_contribution` real DEFAULT 0,
	`pf_employer_contribution` real DEFAULT 0,
	`esi_employee_contribution` real DEFAULT 0,
	`esi_employer_contribution` real DEFAULT 0,
	`professional_tax` real DEFAULT 0,
	`income_tax` real DEFAULT 0,
	`other_deductions` real DEFAULT 0,
	`gross_salary` real NOT NULL,
	`net_salary` real NOT NULL,
	`effective_from` text NOT NULL,
	`effective_to` text,
	`is_active` integer DEFAULT true,
	`created_by` integer,
	`created_at` text DEFAULT '2026-03-31T17:45:31.411Z' NOT NULL,
	`updated_at` text DEFAULT '2026-03-31T17:45:31.411Z' NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sale_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sale_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`quantity` real NOT NULL,
	`unit_price` real NOT NULL,
	`subtotal` real NOT NULL,
	`mrp` real DEFAULT 0,
	`cost` real DEFAULT 0,
	`batch_id` integer,
	`created_at` text DEFAULT '2026-03-31T17:45:31.379Z' NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`customer_id` integer,
	`user_id` integer NOT NULL,
	`total` real NOT NULL,
	`tax` real NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`payment_method` text NOT NULL,
	`status` text DEFAULT 'completed' NOT NULL,
	`cash_amount` real DEFAULT 0,
	`upi_amount` real DEFAULT 0,
	`card_amount` real DEFAULT 0,
	`bank_transfer_amount` real DEFAULT 0,
	`cheque_amount` real DEFAULT 0,
	`credit_amount` real DEFAULT 0,
	`notes` text,
	`bill_number` text,
	`vessel_name` text,
	`voyage_number` text,
	`container_number` text,
	`port_of_loading` text,
	`port_of_discharge` text,
	`freight_cost` real DEFAULT 0,
	`insurance_cost` real DEFAULT 0,
	`customs_duty` real DEFAULT 0,
	`handling_charges` real DEFAULT 0,
	`ocean_total` real DEFAULT 0,
	`is_ocean_shipment` integer DEFAULT false,
	`created_at` text DEFAULT '2026-03-31T17:45:31.379Z' NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sales_order_number_unique` ON `sales` (`order_number`);--> statement-breakpoint
CREATE TABLE `sales_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sale_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`quantity` real NOT NULL,
	`unit_price` real NOT NULL,
	`subtotal` real NOT NULL,
	`mrp` real,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT '2026-03-31T17:45:31.372Z' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`address` text,
	`gstin` text,
	`contact_person` text,
	`payment_terms` text,
	`business_type` text,
	`supplier_type` text,
	`credit_limit` real DEFAULT 0,
	`outstanding_balance` real DEFAULT 0,
	`created_at` text DEFAULT '2026-03-31T17:45:31.378Z' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tax_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`rate` real NOT NULL,
	`hsn_code_range` text,
	`description` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT '2026-03-31T17:45:31.376Z' NOT NULL,
	`updated_at` text DEFAULT '2026-03-31T17:45:31.376Z' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tax_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tax_calculation_method` text DEFAULT 'afterDiscount',
	`prices_include_tax` integer DEFAULT false,
	`enable_multiple_tax_rates` integer DEFAULT true,
	`company_gstin` text,
	`company_state` text,
	`company_state_code` text,
	`default_tax_category_id` integer,
	`updated_at` text DEFAULT '2026-03-31T17:45:31.377Z' NOT NULL,
	FOREIGN KEY (`default_tax_category_id`) REFERENCES `tax_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'cashier' NOT NULL,
	`image` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT '2026-03-31T17:45:31.379Z' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);