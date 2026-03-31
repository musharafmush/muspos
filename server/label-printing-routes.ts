import { Router } from "express";
import { db, sqlite as sqliteInstance } from "../db/index.js";
import { eq, and, desc } from "drizzle-orm";
import { products, categories, labelTemplates, printJobs, labelPrinters } from "../shared/sqlite-schema.js";

const router = Router();

// --- Routes ---
router.get("/label-templates", async (req, res) => {
  try {
    const templates = await db.select().from(labelTemplates);
    console.log('--- GET /label-templates ---');
    console.log(`Found ${templates.length} templates in database`);

    // Map database field names to frontend field names
    const mappedTemplates = templates.map(template => {
      let elements = null;
      if (template.elements) {
        try {
          elements = typeof template.elements === 'string'
            ? JSON.parse(template.elements)
            : template.elements;
        } catch (e) {
          console.error(`❌ Failed to parse elements for template ${template.id}:`, e);
          elements = []; // Fallback to empty array
        }
      }

      return {
        ...template,
        font_size: template.fontSize || 12,
        product_name_font_size: template.productNameFontSize || 18,
        include_barcode: template.includeBarcode ?? true,
        include_price: template.includePrice ?? true,
        include_description: template.includeDescription ?? false,
        include_mrp: template.includeMRP ?? true,
        include_weight: template.includeWeight ?? false,
        include_hsn: template.includeHSN ?? false,
        include_manufacturing_date: template.includeManufacturingDate ?? false,
        include_expiry_date: template.includeExpiryDate ?? false,
        barcode_position: template.barcodePosition || 'bottom',
        barcode_width: template.barcodeWidth || 80,
        barcode_height: template.barcodeHeight || 40,
        border_style: template.borderStyle || 'solid',
        border_width: template.borderWidth || 1,
        background_color: template.backgroundColor || '#ffffff',
        text_color: template.textColor || '#000000',
        custom_css: template.customCSS || "",
        store_title: template.storeTitle || "",
        elements: elements,
        is_default: !!template.isDefault,
        is_active: !!template.isActive,
        created_at: template.createdAt,
        updated_at: template.updatedAt
      };
    });

    res.json(mappedTemplates);
  } catch (error) {
    console.error("❌ Error fetching label templates:", error);
    res.status(500).json({ error: "Failed to fetch label templates", details: (error as Error).message });
  }
});

// Get label template by ID
router.get("/label-templates/:id", async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    const [template] = await db
      .select()
      .from(labelTemplates)
      .where(eq(labelTemplates.id, templateId))
      .limit(1);

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    let elements = null;
    if (template.elements) {
      try {
        elements = typeof template.elements === 'string'
          ? JSON.parse(template.elements)
          : template.elements;
      } catch (e) {
        console.error(`❌ Failed to parse elements for template ${template.id}:`, e);
        elements = [];
      }
    }

    const responseData = {
      ...template,
      font_size: template.fontSize || 12,
      product_name_font_size: template.productNameFontSize || 18,
      include_barcode: !!template.includeBarcode,
      include_price: !!template.includePrice,
      include_description: !!template.includeDescription,
      include_mrp: !!template.includeMRP,
      include_weight: !!template.includeWeight,
      include_hsn: !!template.includeHSN,
      include_manufacturing_date: !!template.includeManufacturingDate,
      include_expiry_date: !!template.includeExpiryDate,
      barcode_position: template.barcodePosition || 'bottom',
      barcode_width: template.barcodeWidth || 80,
      barcode_height: template.barcodeHeight || 40,
      border_style: template.borderStyle || 'solid',
      border_width: template.borderWidth || 1,
      background_color: template.backgroundColor || '#ffffff',
      text_color: template.textColor || '#000000',
      custom_css: template.customCSS || "",
      store_title: template.storeTitle || "",
      elements: elements,
      is_default: !!template.isDefault,
      is_active: !!template.isActive,
      created_at: template.createdAt,
      updated_at: template.updatedAt
    };

    res.json(responseData);
  } catch (error) {
    console.error("❌ Error fetching label template:", error);
    res.status(500).json({ error: "Failed to fetch label template" });
  }
});

// Create new label template
router.post("/label-templates", async (req, res) => {
  try {
    const templateData = req.body;
    console.log('Creating template with data:', templateData);

    const now = new Date().toISOString();

    // Map frontend field names to database field names with explicit type enforcement
    const dbTemplateData = {
      name: templateData.name || `Template ${Date.now()}`,
      description: templateData.description || "",
      width: Number(templateData.width) || 150,
      height: Number(templateData.height) || 100,
      fontSize: Number(templateData.font_size) || 12,
      productNameFontSize: Number(templateData.product_name_font_size) || 18,
      includeBarcode: templateData.include_barcode === true,
      includePrice: templateData.include_price === true,
      includeDescription: templateData.include_description === true,
      includeMRP: templateData.include_mrp === true,
      includeWeight: templateData.include_weight === true,
      includeHSN: templateData.include_hsn === true,
      includeManufacturingDate: templateData.include_manufacturing_date === true,
      includeExpiryDate: templateData.include_expiry_date === true,
      barcodePosition: templateData.barcode_position || 'bottom',
      barcodeWidth: Number(templateData.barcode_width) || 80,
      barcodeHeight: Number(templateData.barcode_height) || 40,
      borderStyle: templateData.border_style || 'solid',
      borderWidth: Number(templateData.border_width) || 1,
      backgroundColor: templateData.background_color || '#ffffff',
      textColor: templateData.text_color || '#000000',
      customCSS: templateData.custom_css || "",
      storeTitle: templateData.store_title || "",
      isDefault: templateData.is_default === true,
      orientation: templateData.orientation || 'landscape',
      elements: templateData.elements ? JSON.stringify(templateData.elements) : null,
      createdAt: now,
      updatedAt: now
    };

    try {
      console.log('Inserting into database...');
      const result = await db.insert(labelTemplates).values(dbTemplateData).returning();

      if (!result || result.length === 0) {
        throw new Error("No template returned after insert");
      }

      const newTemplate = result[0];
      console.log('✅ Template created successfully:', newTemplate.id);

      // Map back to frontend field names for the response
      const responseData = {
        ...newTemplate,
        font_size: newTemplate.fontSize || 12,
        product_name_font_size: newTemplate.productNameFontSize || 18,
        include_barcode: !!newTemplate.includeBarcode,
        include_price: !!newTemplate.includePrice,
        include_description: !!newTemplate.includeDescription,
        include_mrp: !!newTemplate.includeMRP,
        include_weight: !!newTemplate.includeWeight,
        include_hsn: !!newTemplate.includeHSN,
        include_manufacturing_date: !!newTemplate.includeManufacturingDate,
        include_expiry_date: !!newTemplate.includeExpiryDate,
        barcode_position: newTemplate.barcodePosition,
        border_style: newTemplate.borderStyle,
        border_width: newTemplate.borderWidth,
        background_color: newTemplate.backgroundColor,
        text_color: newTemplate.textColor,
        custom_css: newTemplate.customCSS,
        store_title: newTemplate.storeTitle,
        is_default: !!newTemplate.isDefault,
        elements: newTemplate.elements ? JSON.parse(newTemplate.elements) : null,
        created_at: newTemplate.createdAt,
        updated_at: newTemplate.updatedAt
      };

      res.status(201).json(responseData);
    } catch (insertError: any) {
      console.error("❌ Database insertion failed:", insertError);
      throw insertError;
    }
  } catch (error: any) {
    console.error("❌ Error creating label template:", error);
    res.status(500).json({
      error: "Failed to create label template",
      details: error.message,
      db_error: error.code // Useful for unique constraint violations (name already exists)
    });
  }
});

// Update label template
router.put("/label-templates/:id", async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }

    const updateData = req.body;
    console.log(`--- PUT /label-templates/${templateId} ---`);
    console.log('Update data received:', JSON.stringify(updateData, null, 2));

    const now = new Date().toISOString();

    // Map frontend field names to database field names
    const dbUpdateData = {
      name: updateData.name,
      description: updateData.description || "",
      width: Number(updateData.width),
      height: Number(updateData.height),
      fontSize: Number(updateData.font_size),
      productNameFontSize: Number(updateData.product_name_font_size),
      includeBarcode: updateData.include_barcode === true || updateData.include_barcode === 1,
      includePrice: updateData.include_price === true || updateData.include_price === 1,
      includeDescription: updateData.include_description === true || updateData.include_description === 1,
      includeMRP: updateData.include_mrp === true || updateData.include_mrp === 1,
      includeWeight: updateData.include_weight === true || updateData.include_weight === 1,
      includeHSN: updateData.include_hsn === true || updateData.include_hsn === 1,
      includeManufacturingDate: updateData.include_manufacturing_date === true || updateData.include_manufacturing_date === 1,
      includeExpiryDate: updateData.include_expiry_date === true || updateData.include_expiry_date === 1,
      barcodePosition: updateData.barcode_position || 'bottom',
      barcodeWidth: Number(updateData.barcode_width) || 80,
      barcodeHeight: Number(updateData.barcode_height) || 40,
      borderStyle: updateData.border_style || 'solid',
      borderWidth: Number(updateData.border_width) || 1,
      backgroundColor: updateData.background_color || '#ffffff',
      textColor: updateData.text_color || '#000000',
      customCSS: updateData.custom_css || "",
      storeTitle: updateData.store_title || "",
      isDefault: updateData.is_default === true || updateData.is_default === 1,
      orientation: updateData.orientation || 'landscape',
      elements: updateData.elements ? JSON.stringify(updateData.elements) : null,
      updatedAt: now
    };

    console.log('Final DB update data:', JSON.stringify(dbUpdateData, null, 2));

    const result = await db
      .update(labelTemplates)
      .set(dbUpdateData)
      .where(eq(labelTemplates.id, templateId))
      .returning();

    if (!result || result.length === 0) {
      console.log(`❌ Template with ID ${templateId} not found for update`);
      return res.status(404).json({ error: "Template not found" });
    }

    const updatedTemplate = result[0];
    console.log('✅ Template updated successfully:', updatedTemplate.id);

    // Map back to frontend field names
    const responseData = {
      ...updatedTemplate,
      font_size: updatedTemplate.fontSize,
      product_name_font_size: updatedTemplate.productNameFontSize,
      include_barcode: !!updatedTemplate.includeBarcode,
      include_price: !!updatedTemplate.includePrice,
      include_description: !!updatedTemplate.includeDescription,
      include_mrp: !!updatedTemplate.includeMRP,
      include_weight: !!updatedTemplate.includeWeight,
      include_hsn: !!updatedTemplate.includeHSN,
      include_manufacturing_date: !!updatedTemplate.includeManufacturingDate,
      include_expiry_date: !!updatedTemplate.includeExpiryDate,
      barcode_position: updatedTemplate.barcodePosition,
      barcode_width: updatedTemplate.barcodeWidth,
      barcode_height: updatedTemplate.barcodeHeight,
      border_style: updatedTemplate.borderStyle,
      border_width: updatedTemplate.borderWidth,
      background_color: updatedTemplate.backgroundColor,
      text_color: updatedTemplate.textColor,
      custom_css: updatedTemplate.customCSS,
      store_title: updatedTemplate.storeTitle,
      elements: updatedTemplate.elements ? JSON.parse(updatedTemplate.elements) : null,
      is_default: !!updatedTemplate.isDefault,
      is_active: !!updatedTemplate.isActive,
      created_at: updatedTemplate.createdAt,
      updated_at: updatedTemplate.updatedAt
    };

    res.json(responseData);
  } catch (error: any) {
    console.error("❌ Error updating label template:", error);
    res.status(500).json({
      error: "Failed to update label template",
      details: error.message
    });
  }
});

// Delete label template
router.delete("/label-templates/:id", async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);

    const [deletedTemplate] = await db
      .delete(labelTemplates)
      .where(eq(labelTemplates.id, templateId))
      .returning();

    if (!deletedTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting label template:", error);
    res.status(500).json({ error: "Failed to delete label template" });
  }
});

// Get all printers
router.get("/printers", async (req, res) => {
  try {
    const printers = await db.select().from(labelPrinters).where(eq(labelPrinters.isActive, true));
    res.json(printers);
  } catch (error) {
    console.error("Error fetching printers:", error);
    res.status(500).json({ error: "Failed to fetch printers" });
  }
});

// Create printer
router.post("/printers", async (req, res) => {
  try {
    const [newPrinter] = await db.insert(labelPrinters).values({
      ...req.body,
      updatedAt: new Date().toISOString()
    }).returning();
    res.status(201).json(newPrinter);
  } catch (error) {
    console.error("Error creating printer:", error);
    res.status(500).json({ error: "Failed to create printer" });
  }
});

// Update printer
router.patch("/printers/:id", async (req, res) => {
  try {
    const [updatedPrinter] = await db.update(labelPrinters)
      .set({ ...req.body, updatedAt: new Date().toISOString() })
      .where(eq(labelPrinters.id, parseInt(req.params.id)))
      .returning();
    res.json(updatedPrinter);
  } catch (error) {
    res.status(500).json({ error: "Failed to update printer" });
  }
});

// Delete printer
router.delete("/printers/:id", async (req, res) => {
  try {
    await db.delete(labelPrinters).where(eq(labelPrinters.id, parseInt(req.params.id)));
    res.json({ message: "Printer deleted successfully" });
  } catch (error) {
    console.error("Error deleting printer:", error);
    res.status(500).json({ error: "Failed to delete printer" });
  }
});

// Get all print jobs from database
router.get("/print-jobs", async (req, res) => {
  try {
    const jobs = await db.select().from(printJobs).orderBy(desc(printJobs.createdAt));
    res.json(jobs);
  } catch (error) {
    console.error("Error fetching print jobs:", error);
    res.status(500).json({ error: "Failed to fetch print jobs" });
  }
});

// Get print job by ID
router.get("/print-jobs/:id", async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const [job] = await db
      .select()
      .from(printJobs)
      .where(eq(printJobs.id, jobId))
      .limit(1);

    if (!job) {
      return res.status(404).json({ error: "Print job not found" });
    }

    res.json(job);
  } catch (error) {
    console.error("Error fetching print job:", error);
    res.status(500).json({ error: "Failed to fetch print job" });
  }
});

// Update print job status
router.put("/print-jobs/:id/status", async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const { status } = req.body;

    const validStatuses = ['pending', 'printing', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const [updatedJob] = await db
      .update(printJobs)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(eq(printJobs.id, jobId))
      .returning();

    if (!updatedJob) {
      return res.status(404).json({ error: "Print job not found" });
    }

    res.json(updatedJob);
  } catch (error) {
    console.error("Error updating print job status:", error);
    res.status(500).json({ error: "Failed to update print job status" });
  }
});

// Create print job (record in database)
router.post("/print-jobs", async (req, res) => {
  try {
    const {
      templateId,
      productIds,
      printerId,
      copies,
      labelsPerRow,
      paperSize,
      orientation,
      totalLabels,
      customText,
      printSettings
    } = req.body;

    console.log('🔄 Creating print job for products:', productIds);

    // Fetch template from database to ensure it exists
    const [template] = await db
      .select()
      .from(labelTemplates)
      .where(eq(labelTemplates.id, templateId))
      .limit(1);

    if (!template) {
      console.warn(`⚠️ Template ${templateId} not found, using default fallback logic`);
    }

    // Find printer from database
    const [printer] = await db
      .select()
      .from(labelPrinters)
      .where(eq(labelPrinters.id, parseInt(printerId || "1")))
      .limit(1);

    if (!printer) {
      console.warn(`⚠️ Printer ${printerId} not found, using default fallback`);
    }

    // Create new print job in database
    const [newPrintJob] = await db.insert(printJobs).values({
      templateId,
      userId: (req as any).user?.id || 1, // Fallback for local dev
      productIds: JSON.stringify(productIds),
      copies: copies || 1,
      labelsPerRow: labelsPerRow || 2,
      paperSize: paperSize || (template ? `${template.width}x${template.height}mm` : 'A4'),
      orientation: orientation || (template?.orientation) || "portrait",
      status: "completed",
      totalLabels: totalLabels || (productIds.length * (copies || 1)),
      customText: customText || "",
      printSettings: printSettings ? (typeof printSettings === 'string' ? printSettings : JSON.stringify(printSettings)) : JSON.stringify({
        printerName: printer?.name || 'Unknown Printer',
        printerType: printer?.type || 'generic',
        connection: printer?.connection || 'local',
        paperWidth: printer?.paperWidth || 0,
        paperHeight: printer?.paperHeight || 0
      }),
      updatedAt: new Date().toISOString()
    }).returning();

    console.log(`✅ Print job created successfully: ID ${newPrintJob.id}`);

    res.status(201).json({
      message: "Labels sent to printer successfully",
      jobId: newPrintJob.id,
      status: "completed"
    });
  } catch (error) {
    console.error("❌ Error creating print job:", error);
    res.status(500).json({ error: "Failed to create print job", details: error instanceof Error ? error.message : String(error) });
  }
});


// Generate barcode data (for frontend preview)
router.post("/generate-barcode", async (req, res) => {
  try {
    const { value, type } = req.body;

    // Mock barcode generation - in real implementation, use a barcode library
    const barcodeData = {
      value,
      type,
      width: 200,
      height: 60,
      format: "PNG",
      displayValue: true
    };

    res.json(barcodeData);
  } catch (error) {
    console.error("Error generating barcode:", error);
    res.status(500).json({ error: "Failed to generate barcode" });
  }
});

// Export label template
router.get("/label-templates/:id/export", async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    const [template] = await db
      .select()
      .from(labelTemplates)
      .where(eq(labelTemplates.id, templateId))
      .limit(1);

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="template_${template.name.replace(/\s+/g, '_')}.json"`);
    res.json(template);
  } catch (error) {
    console.error("Error exporting template:", error);
    res.status(500).json({ error: "Failed to export template" });
  }
});

// Import label template
router.post("/label-templates/import", async (req, res) => {
  try {
    const templateData = req.body;

    // Validate template data
    if (!templateData.name || !templateData.width || !templateData.height) {
      return res.status(400).json({ error: "Invalid template data" });
    }

    const now = new Date().toISOString();
    const dbTemplateData = {
      ...templateData,
      createdAt: now,
      updatedAt: now
    };

    // Remove ID if present to let DB auto-increment
    delete (dbTemplateData as any).id;

    const [newTemplate] = await db.insert(labelTemplates).values(dbTemplateData as any).returning();

    // Map back to frontend field names
    const responseData = {
      ...newTemplate,
      font_size: newTemplate.fontSize,
      product_name_font_size: newTemplate.productNameFontSize,
      include_barcode: !!newTemplate.includeBarcode,
      include_price: !!newTemplate.includePrice,
      include_description: !!newTemplate.includeDescription,
      include_mrp: !!newTemplate.includeMRP,
      include_weight: !!newTemplate.includeWeight,
      include_hsn: !!newTemplate.includeHSN,
      include_manufacturing_date: !!newTemplate.includeManufacturingDate,
      include_expiry_date: !!newTemplate.includeExpiryDate,
      barcode_position: newTemplate.barcodePosition,
      barcode_width: newTemplate.barcodeWidth,
      barcode_height: newTemplate.barcodeHeight,
      border_style: newTemplate.borderStyle,
      border_width: newTemplate.borderWidth,
      background_color: newTemplate.backgroundColor,
      text_color: newTemplate.textColor,
      custom_css: newTemplate.customCSS,
      store_title: newTemplate.storeTitle,
      elements: newTemplate.elements ? JSON.parse(newTemplate.elements) : null,
      is_default: !!newTemplate.isDefault,
      is_active: !!newTemplate.isActive,
      created_at: newTemplate.createdAt,
      updated_at: newTemplate.updatedAt
    };

    res.status(201).json(responseData);
  } catch (error) {
    console.error("Error importing template:", error);
    res.status(500).json({ error: "Failed to import template" });
  }
});

// Test printer connection
router.post("/printers/:id/test", async (req, res) => {
  try {
    const printerId = parseInt(req.params.id);
    const [printer] = await db
      .select()
      .from(labelPrinters)
      .where(eq(labelPrinters.id, printerId))
      .limit(1);

    if (!printer) {
      return res.status(404).json({ error: "Printer not found" });
    }

    // Mock printer test - in real implementation, send test command to printer
    console.log(`Testing printer: ${printer.name}`);

    const testResult = {
      success: true,
      message: `Test successful for ${printer.name}`,
      printerStatus: "online",
      paperStatus: "loaded",
      connectionType: printer.connection
    };

    res.json(testResult);
  } catch (error) {
    console.error("Error testing printer:", error);
    res.status(500).json({ error: "Failed to test printer" });
  }
});

// Backward compatibility for legacy endpoints
router.post("/print-labels", async (req, res) => {
  try {
    const { templateId, productIds, copies, totalLabels, customText } = req.body;

    const [newPrintJob] = await db.insert(printJobs).values({
      templateId,
      userId: (req as any).user?.id || 1,
      productIds: JSON.stringify(productIds || []),
      copies: copies || 1,
      status: "completed",
      totalLabels: totalLabels || (Array.isArray(productIds) ? productIds.length * (copies || 1) : 0),
      customText: customText || "",
      updatedAt: new Date().toISOString()
    }).returning();

    res.json(newPrintJob);
  } catch (error) {
    console.error("Error in legacy print-labels route:", error);
    res.status(500).json({ error: "Failed to process print request" });
  }
});

export default router;