import {
  pgTable,
  varchar,
  text,
  timestamp,
  real,
  jsonb,
  integer,
  decimal,
} from "drizzle-orm/pg-core";

export type PropertyType = "MONTE" | "PRADO" | "CASA" | "PISO" | "TERRENO" | "FINCA";

export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const properties = pgTable("properties", {
  id: varchar("id", { length: 255 }).primaryKey(),
  ownerId: varchar("owner_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  type: text("type").$type<PropertyType>().notNull(),
  name: text("name").notNull(),
  address: text("address"),
  locationLat: real("location_lat"),
  locationLng: real("location_lng"),
  geoPolygon: jsonb("geo_polygon"),

  catastroRef: text("catastro_ref"),
  catastroUrl: text("catastro_url"),
  registrySheet: text("registry_sheet"),

  plantedDate: timestamp("planted_date", { mode: "date" }),
  species: text("species"),
  lastHarvestDate: timestamp("last_harvest_date", { mode: "date" }),
  lastHarvestProfit: decimal("last_harvest_profit", { precision: 12, scale: 2 }),

  rentalPrice: decimal("rental_price", { precision: 10, scale: 2 }),
  tenantName: text("tenant_name"),
  tenantEmail: text("tenant_email"),
  tenantPhone: text("tenant_phone"),
  leaseStart: timestamp("lease_start", { mode: "date" }),
  leaseEnd: timestamp("lease_end", { mode: "date" }),

  notes: text("notes"),
  images: text("images").array(),

  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const projections = pgTable("projections", {
  id: varchar("id", { length: 255 }).primaryKey(),
  propertyId: varchar("property_id", { length: 255 })
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  month: integer("month"),
  type: text("type").notNull(),
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: varchar("id", { length: 255 }).primaryKey(),
  propertyId: varchar("property_id", { length: 255 })
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const propertyShares = pgTable("property_shares", {
  id: varchar("id", { length: 255 }).primaryKey(),
  propertyId: varchar("property_id", { length: 255 })
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  sharedById: varchar("shared_by_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  role: text("role").notNull().default("VIEWER"),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const insforgeFiles = pgTable("insforge_files", {
  id: varchar("id", { length: 255 }).primaryKey(),
  propertyId: varchar("property_id", { length: 255 })
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  insforgeFileId: text("insforge_file_id").notNull(),
  name: text("name").notNull(),
  url: text("url"),
  status: text("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const insforgeChatThreads = pgTable("insforge_chat_threads", {
  id: varchar("id", { length: 255 }).primaryKey(),
  propertyId: varchar("property_id", { length: 255 })
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  title: text("title"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const insforgeMessages = pgTable("insforge_messages", {
  id: varchar("id", { length: 255 }).primaryKey(),
  threadId: varchar("thread_id", { length: 255 })
    .notNull()
    .references(() => insforgeChatThreads.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
