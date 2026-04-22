import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: Database;

async function initDb() {
  db = await open({
    filename: path.join(__dirname, "keevo.db"),
    driver: sqlite3.Database,
  });

  // Create core tables for ERP system
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      uid TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      displayName TEXT,
      password TEXT,
      role TEXT,
      companyId TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT,
      logo TEXT,
      deliveryNumber TEXT,
      address TEXT,
      email TEXT,
      website TEXT,
      currency TEXT,
      ownerId TEXT,
      isSubscribed INTEGER DEFAULT 0,
      licenseStatus TEXT DEFAULT 'trial',
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      companyId TEXT,
      name TEXT,
      sku TEXT,
      barcode TEXT,
      category TEXT,
      price REAL,
      cost REAL,
      currency TEXT,
      unit TEXT,
      stock INTEGER DEFAULT 0,
      minStock INTEGER DEFAULT 0,
      location TEXT,
      image TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      companyId TEXT,
      name TEXT,
      createdAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      companyId TEXT,
      name TEXT,
      type TEXT,
      phone TEXT,
      email TEXT,
      balance REAL DEFAULT 0,
      createdAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      companyId TEXT,
      date TEXT,
      description TEXT,
      amount REAL,
      category TEXT,
      paymentMethod TEXT,
      createdAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      companyId TEXT,
      invoiceNumber TEXT,
      date TEXT,
      customerId TEXT,
      items TEXT, -- JSON string
      subtotal REAL,
      tax REAL,
      total REAL,
      discountAmount REAL,
      paymentMethod TEXT,
      currency TEXT,
      exchangeRate REAL,
      cashierId TEXT,
      status TEXT DEFAULT 'paid',
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS stock_adjustments (
      id TEXT PRIMARY KEY,
      companyId TEXT,
      date TEXT,
      productId TEXT,
      productName TEXT,
      type TEXT,
      quantity INTEGER,
      reason TEXT,
      previousStock INTEGER,
      newStock INTEGER,
      userId TEXT,
      createdAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS damaged_items (
      id TEXT PRIMARY KEY,
      companyId TEXT,
      date TEXT,
      productId TEXT,
      productName TEXT,
      quantity INTEGER,
      reason TEXT,
      location TEXT,
      notes TEXT,
      cost REAL,
      userId TEXT,
      createdAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      companyId TEXT,
      timestamp TEXT,
      userId TEXT,
      userName TEXT,
      action TEXT,
      entityType TEXT,
      entityId TEXT,
      changes TEXT, -- JSON string
      metadata TEXT, -- JSON string
      createdAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      companyId TEXT,
      date TEXT,
      description TEXT,
      reference TEXT,
      totalDebit REAL,
      totalCredit REAL,
      lines TEXT, -- JSON string
      type TEXT,
      createdBy TEXT,
      createdAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS returns (
      id TEXT PRIMARY KEY,
      companyId TEXT,
      date TEXT,
      type TEXT,
      customerSupplier TEXT,
      amount REAL,
      status TEXT,
      reason TEXT,
      items TEXT, -- JSON string
      createdAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY,
      companyId TEXT,
      orderNumber TEXT,
      supplierId TEXT,
      date TEXT,
      items TEXT, -- JSON string
      total REAL,
      status TEXT,
      createdAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS sales_orders (
      id TEXT PRIMARY KEY,
      companyId TEXT,
      orderNumber TEXT,
      customerId TEXT,
      date TEXT,
      items TEXT, -- JSON string
      total REAL,
      status TEXT,
      createdAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id)
    );
  `);

  console.log("SQLite Database initialized");
}

console.log("Starting Keevo ERP Server...");

async function startServer() {
  await initDb();
  
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Request Logging
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`${req.method} ${req.path}`);
    }
    next();
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Keevo ERP SQLite Server is running" });
  });

  // Auth Endpoints
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, displayName, companyName } = req.body;
    const uid = Math.random().toString(36).substring(2, 15);
    const companyId = Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString();

    console.log(`Registering user ${email} for company ${companyName}`);
    try {
      await db.run(
        "INSERT INTO users (uid, email, password, displayName, role, companyId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [uid, email, password, displayName || email.split('@')[0], 'admin', companyId, now]
      );
      
      await db.run(
        "INSERT INTO companies (id, name, ownerId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
        [companyId, companyName || 'My Company', uid, now, now]
      );

      res.json({ uid, email, displayName, role: 'admin', companyId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt: ${email}`);
    try {
      const user = await db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, password]);
      if (user) {
        res.json(user);
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Company Endpoints
  app.get("/api/companies/:companyId", async (req, res) => {
    try {
      const company = await db.get("SELECT * FROM companies WHERE id = ?", [req.params.companyId]);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(company);
    } catch (error: any) {
      console.error("Error fetching company:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/companies/:companyId", async (req, res) => {
    const data = req.body;
    const now = new Date().toISOString();
    const keys = Object.keys(data).filter(k => k !== 'id');
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => data[k]);
    
    try {
      await db.run(
        `UPDATE companies SET ${setClause}, updatedAt = ? WHERE id = ?`,
        [...values, now, req.params.companyId]
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/users/:uid", async (req, res) => {
    const data = req.body;
    const keys = Object.keys(data).filter(k => k !== 'uid');
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => data[k]);
    
    try {
      await db.run(
        `UPDATE users SET ${setClause} WHERE uid = ?`,
        [...values, req.params.uid]
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Products Endpoints
  app.get("/api/companies/:companyId/products", async (req, res) => {
    try {
      const products = await db.all("SELECT * FROM products WHERE companyId = ?", [req.params.companyId]);
      res.json(products || []);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/companies/:companyId/products", async (req, res) => {
    const product = req.body;
    const id = Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString();
    try {
      await db.run(
        "INSERT INTO products (id, companyId, name, sku, barcode, category, price, cost, currency, unit, stock, minStock, location, image, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [id, req.params.companyId, product.name, product.sku, product.barcode, product.category, product.price, product.cost, product.currency, product.unit, product.stock, product.minStock, product.location, product.image, now, now]
      );
      res.json({ id, ...product });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/companies/:companyId/products/:productId", async (req, res) => {
    const product = req.body;
    const now = new Date().toISOString();
    try {
      await db.run(
        "UPDATE products SET name = ?, sku = ?, barcode = ?, category = ?, price = ?, cost = ?, currency = ?, unit = ?, stock = ?, minStock = ?, location = ?, image = ?, updatedAt = ? WHERE id = ? AND companyId = ?",
        [product.name, product.sku, product.barcode, product.category, product.price, product.cost, product.currency, product.unit, product.stock, product.minStock, product.location, product.image, now, req.params.productId, req.params.companyId]
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/companies/:companyId/products/:productId", async (req, res) => {
    try {
      await db.run("DELETE FROM products WHERE id = ? AND companyId = ?", [req.params.productId, req.params.companyId]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Sales Endpoints
  app.get("/api/companies/:companyId/sales", async (req, res) => {
    try {
      const sales = await db.all("SELECT * FROM sales WHERE companyId = ? ORDER BY date DESC", [req.params.companyId]);
      res.json(sales.map(s => ({ ...s, items: JSON.parse(s.items) })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/companies/:companyId/sales", async (req, res) => {
    const sale = req.body;
    const id = Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString();
    try {
      await db.run(
        "INSERT INTO sales (id, companyId, invoiceNumber, date, customerId, items, subtotal, tax, total, discountAmount, paymentMethod, currency, exchangeRate, cashierId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [id, req.params.companyId, sale.invoiceNumber, sale.date, sale.customerId, JSON.stringify(sale.items), sale.subtotal, sale.tax, sale.total, sale.discountAmount, sale.paymentMethod, sale.currency, sale.exchangeRate, sale.cashierId, now, now]
      );

      // Decrement stock
      for (const item of sale.items) {
        await db.run("UPDATE products SET stock = stock - ? WHERE id = ?", [item.quantity, item.id]);
      }

      res.json({ id, ...sale });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Staff Endpoints
  app.get("/api/companies/:companyId/staff", async (req, res) => {
    try {
      console.log(`Fetching staff for company: ${req.params.companyId}`);
      const staff = await db.all("SELECT * FROM users WHERE companyId = ?", [req.params.companyId]);
      res.json(staff || []);
    } catch (error: any) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/staff", async (req, res) => {
    const { email, password, role, displayName, companyId } = req.body;
    const uid = Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString();
    try {
      await db.run(
        "INSERT INTO users (uid, email, password, displayName, role, companyId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [uid, email, password, displayName, role, companyId, now]
      );
      res.json({ success: true, id: uid });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Generic List Endpoints for remaining collections
  const collections = ['categories', 'contacts', 'expenses', 'stock_adjustments', 'damaged_items', 'audit_logs', 'journal_entries', 'returns', 'purchase_orders', 'sales_orders'];
  collections.forEach(col => {
    app.get(`/api/companies/:companyId/${col}`, async (req, res) => {
      try {
        const rows = await db.all(`SELECT * FROM ${col} WHERE companyId = ?`, [req.params.companyId]);
        res.json(rows || []);
      } catch (error: any) {
        console.error(`Error fetching ${col}:`, error);
        res.status(500).json({ error: error.message });
      }
    });

    app.post(`/api/companies/:companyId/${col}`, async (req, res) => {
      const data = req.body;
      const id = Math.random().toString(36).substring(2, 15);
      const keys = Object.keys(data).filter(k => k !== 'id');
      
      // Handle JSON fields
      const processedValues = keys.map(k => {
        const val = data[k];
        if (val && typeof val === 'object') return JSON.stringify(val);
        return val;
      });

      const placeholders = keys.map(() => '?').join(', ');
      
      try {
        await db.run(
          `INSERT INTO ${col} (id, companyId, ${keys.join(', ')}, createdAt) VALUES (?, ?, ${placeholders}, ?)`,
          [id, req.params.companyId, ...processedValues, new Date().toISOString()]
        );
        res.json({ id, ...data });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.delete(`/api/companies/:companyId/${col}/:id`, async (req, res) => {
      try {
        await db.run(`DELETE FROM ${col} WHERE id = ? AND companyId = ?`, [req.params.id, req.params.companyId]);
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });
  });

  // API 404 Handler - Catch unmatched /api routes to prevent HTML fallback
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.path}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

startServer();
