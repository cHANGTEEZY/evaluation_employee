import { z } from "zod";

/**
 * DB / JSON may store per-floor rates as strings. Coerce so Zod + edit submit don't fail until the user re-types.
 */
export function normalizeBuildingRatePerSqftInput(
  raw: unknown,
): (number | undefined)[] | undefined {
  if (raw == null) return undefined;
  if (!Array.isArray(raw)) return undefined;
  return raw.map((x) => {
    if (x === "" || x == null) return undefined;
    if (typeof x === "number" && Number.isFinite(x)) {
      return x >= 0 ? x : undefined;
    }
    const n = parseFloat(String(x));
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  });
}

export const valuationSchema = z.object({
  // ===== Basic Details =====
  ref_no: z.string().optional(),
  valuation_date: z
    .date({ message: "Please enter a valid valuation date" })
    .optional(),
  branch: z.string().optional(),
  client_name: z.string().optional(),
  contact_number: z
    .string()
    .regex(/^[0-9+\-\s()]+$/, "Please enter a valid phone number")
    .optional(),
  client_address_nagrita: z.string().optional(),

  // ===== Bank Details (for folder structure) =====
  bank_name: z.string().optional(),
  bank_branch_name: z.string().optional(),
  city: z.string().optional(),
  tole_area: z.string().optional(),

  // ===== Property Ownership & Location =====
  owner_of_property: z.string().optional(),
  property_address_deed: z.string().optional(),
  plot_no: z
    .string({ message: "Plot number is required" })
    .min(1, { message: "Plot number is required" }),
  present_property_address: z.string().optional(),
  district: z.string().optional(),

  // ===== Valuation Purpose =====
  valuation_for: z
    .enum(
      [
        "vacant_land",
        "land_and_building",
        "ready_made_house",
        "apartment_duplex",
        "construction_extension_renovation",
      ],
      { message: "Please select a valuation purpose" },
    )
    .optional(),

  // ===== Road & Access =====
  road_type: z
    .enum(["black_topped", "gravel", "earthen", "concrete", "others"], {
      message: "Please select a road type",
    })
    .optional(),
  road_type_others: z.string().optional(),
  road_width: z
    .number({ message: "Road width must be a number" })
    .positive("Road width must be greater than 0")
    .optional(),
  access_road_direction: z
    .enum(["east", "west", "north", "south", "others"], {
      message: "Please select an access road direction",
    })
    .optional(),
  access_road_direction_others: z.string().optional(),

  // ===== Property Dimensions =====
  property_area_length: z
    .number({ message: "Property area length must be a number" })
    .positive("Property area length must be greater than 0")
    .optional(),
  property_frontage_direction: z
    .enum(["east", "west", "north", "south"], {
      message: "Please select a frontage direction",
    })
    .optional(),
  property_narrowest_length: z
    .number({ message: "Narrowest length must be a number" })
    .positive("Narrowest length must be greater than 0")
    .optional(),
  property_narrowest_direction: z
    .enum(["east", "west", "north", "south"], {
      message: "Please select a narrowest direction",
    })
    .optional(),

  // ===== Road & Access (additional fields) =====
  right_of_way: z.boolean().default(false),
  motorable_access: z.boolean().default(false),
  electricity_available: z.boolean().default(false),
  drainage_near_property: z.boolean().default(false),
  /** UI preset for Right of Way (m): "" for none, or "3"|"4"|"6"|"8"|"22"|"50"|"other". Not persisted; syncs to right_of_way_width_ft + right_of_way. */
  right_of_way_m: z.string().optional(),
  /** Right of way width in meters (was ft; client asked for meters). */
  right_of_way_width_ft: z
    .number({ message: "Right of way width must be a number" })
    .nonnegative("Right of way width cannot be negative")
    .optional(),

  // ===== Property Classification =====
  property_type: z
    .enum(["residential", "commercial", "industrial", "agricultural"], {
      message: "Please select a property type",
    })
    .optional(),
  property_ownership_type: z
    .enum(["company", "individual_single", "individual_joint"], {
      message: "Please select an ownership type",
    })
    .optional(),
  ownership_transferred_through: z
    .enum(["sale", "bokupatra", "family_separation", "habalish"], {
      message: "Please select a transfer method",
    })
    .optional(),
  hold_type: z
    .enum(["freehold", "leasehold"], {
      message: "Please select a hold type",
    })
    .optional(),

  // ===== Land Rates =====
  /** Unit interpretation for the land rate inputs below. */
  land_rate_unit: z.enum(["anna", "kattha"]).default("anna"),
  commercial_rate_per_anna: z
    .number({ message: "Commercial rate must be a number" })
    .nonnegative("Commercial rate cannot be negative")
    .optional(),
  government_rate_per_anna: z
    .number({ message: "Government rate must be a number" })
    .nonnegative("Government rate cannot be negative")
    .optional(),

  // ===== Building Details =====
  building_type: z
    .enum(["rcc_framed", "steel", "load_bearing", "others"], {
      message: "Please select a valid building type",
    })
    .optional(),
  building_purpose: z
    .enum(["residential", "commercial", "both"], {
      message: "Please select a valid building purpose",
    })
    .optional(),
  number_of_storeys: z
    .number({ message: "Number of storeys must be a number" })
    .int("Number of storeys must be a whole number")
    .nonnegative("Number of storeys cannot be negative")
    .optional(),
  storey_height: z
    .number({ message: "Storey height must be a number" })
    .positive("Storey height must be greater than 0")
    .optional(),
  building_age_years: z
    .number({ message: "Building age must be a number" })
    .int("Building age must be a whole number")
    .nonnegative("Building age cannot be negative")
    .optional(),
  /** Per-floor building rate (NPR per sq ft). Index 0 = Ground, 1 = 1st floor, etc. */
  building_rate_per_sqft: z.preprocess(
    normalizeBuildingRatePerSqftInput,
    z.array(z.number().nonnegative().optional()).optional(),
  ),
  completion_date: z.date({ message: "Please enter a valid date" }).optional(),

  // ===== Risk / Area =====
  landslide_prone_area: z.boolean().optional(),
  landslide_prone_area_setback: z.number().nonnegative().optional(),
  river_side: z.boolean().optional(),
  river_side_setback: z.number().nonnegative().optional(),
  high_tension_area: z.boolean().optional(),
  high_tension_area_setback: z.number().nonnegative().optional(),
  canal_area: z.boolean().optional(),
  canal_area_setback: z.number().nonnegative().optional(),
  flood_prone_area: z.boolean().optional(),
  flood_prone_area_setback: z.number().nonnegative().optional(),
  heritage_memorial_site: z.boolean().optional(),
  heritage_memorial_site_setback: z.number().nonnegative().optional(),

  // ===== Site & Topography =====
  high_land_ft: z.number({ message: "High land must be a number" }).optional(),
  low_land_ft: z.number({ message: "Low land must be a number" }).optional(),
  latitude: z
    .number({ message: "Please select a location on the map" })
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90")
    .optional(),
  longitude: z
    .number({ message: "Please select a location on the map" })
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
    .optional(),
  slope_degree: z
    .number({ message: "Slope degree must be a number" })
    .min(0, "Slope degree must be between 0 and 90")
    .max(90, "Slope degree must be between 0 and 90")
    .optional(),

  // ===== Payment & Details =====
  site_charge: z
    .number({ message: "Site charge must be a number" })
    .nonnegative("Site charge cannot be negative")
    .optional(),
  payment_cash: z
    .number({ message: "Cash payment must be a number" })
    .nonnegative("Cash payment cannot be negative")
    .optional(),
  payment_online: z
    .number({ message: "Online payment must be a number" })
    .nonnegative("Online payment cannot be negative")
    .optional(),
  payment_online_mode: z
    .enum(
      [
        "esewa",
        "khalti",
        "mobile_banking",
        "bank_transfer",
        "fonepay",
        "other",
      ],
      {
        message: "Please select an online payment mode",
      },
    )
    .optional(),
  payment_pending_due: z
    .number({ message: "Pending due must be a number" })
    .nonnegative("Pending due cannot be negative")
    .optional(),

  // ===== Documents ===== (BPTM removed – same as Blueprint; Nirman Ijajat / Nirman Sampanna)
  documents: z
    .object({
      citizenship_client: z.object({
        original: z.boolean().default(false),
        photocopy: z.boolean().default(false),
      }),
      citizenship_owner: z.object({
        original: z.boolean().default(false),
        photocopy: z.boolean().default(false),
      }),
      lorc: z.object({
        original: z.boolean().default(false),
        photocopy: z.boolean().default(false),
      }),
      charkilla: z.object({
        original: z.boolean().default(false),
        photocopy: z.boolean().default(false),
      }),
      blueprint: z.object({
        original: z.boolean().default(false),
        photocopy: z.boolean().default(false),
      }),
      plot_utar: z.object({
        original: z.boolean().default(false),
        photocopy: z.boolean().default(false),
      }),
      nirman_ijajat: z.object({
        original: z.boolean().default(false),
        photocopy: z.boolean().default(false),
      }),
      nirman_sampanna: z.object({
        original: z.boolean().default(false),
        photocopy: z.boolean().default(false),
      }),
      building_drawing: z.object({
        original: z.boolean().default(false),
        photocopy: z.boolean().default(false),
      }),
    })
    .default({
      citizenship_client: { original: false, photocopy: false },
      citizenship_owner: { original: false, photocopy: false },
      lorc: { original: false, photocopy: false },
      charkilla: { original: false, photocopy: false },
      blueprint: { original: false, photocopy: false },
      plot_utar: { original: false, photocopy: false },
      nirman_ijajat: { original: false, photocopy: false },
      nirman_sampanna: { original: false, photocopy: false },
      building_drawing: { original: false, photocopy: false },
    }),

  //  Site Plan
  site_plan_note: z.string().optional(),

  //  Site Plan Drawing
  site_plan_drawing: z.string().optional(),

  //  Site Plan Plotter Data (JSON string of PlotterData for resume editing)
  site_plan_plotter_data: z.string().optional(),

  // Property Images
  property_images: z.array(z.string()).optional(),

  // Document photos (optional, no limit) – photos of documents collected on site
  document_photos: z.array(z.string()).optional(),

  // GalliMaps Property Evaluation API response (stored as JSON string)
  property_evaluation_data: z.string().optional(),
});

export type ValuationFormValues = z.infer<typeof valuationSchema>;

// Default (dummy) values for the form – used for both the initial form state
// and the `seedDummyValuation` helper in `lib/schema.ts`.
// All values are safe placeholders the user can overwrite.
export const defaultValuationValues: Partial<ValuationFormValues> = {
  // Basic details
  ref_no: undefined,
  valuation_date: new Date(),
  branch: "Head Office",
  client_name: "Test Client",
  contact_number: "9800000000",
  client_address_nagrita: "KTM-123456",

  // Bank / folder details
  bank_name: "Test Bank",
  bank_branch_name: "Boudha Branch",
  city: "Kathmandu",
  tole_area: "Boudha",

  // Property ownership & location
  owner_of_property: "Test Owner",
  property_address_deed: "Boudha, Kathmandu",
  plot_no: "1",
  present_property_address: "Boudha, Kathmandu",
  district: "Kathmandu",

  // Valuation purpose
  valuation_for: "land_and_building",

  // Road & access
  road_type: "black_topped",
  road_width: 20,
  access_road_direction: "east",
  access_road_direction_others: undefined,

  // Property dimensions
  property_area_length: 10,
  property_frontage_direction: "east",
  property_narrowest_length: 8,
  property_narrowest_direction: "west",

  // Road & access (additional)
  right_of_way: true,
  motorable_access: true,
  electricity_available: true,
  drainage_near_property: true,

  // Property classification
  property_type: "residential",
  property_ownership_type: "individual_single",
  ownership_transferred_through: "sale",
  hold_type: "freehold",

  // Land rates
  land_rate_unit: "anna",
  commercial_rate_per_anna: 2500000,
  government_rate_per_anna: 800000,

  // Building details
  building_type: "rcc_framed",
  building_purpose: "residential",
  number_of_storeys: 2,
  storey_height: 10,
  building_age_years: 1,
  building_rate_per_sqft: undefined,
  completion_date: new Date(),

  // Risk / area
  landslide_prone_area: false,
  landslide_prone_area_setback: undefined,
  river_side: false,
  river_side_setback: undefined,
  high_tension_area: false,
  high_tension_area_setback: undefined,
  canal_area: false,
  canal_area_setback: undefined,
  flood_prone_area: false,
  flood_prone_area_setback: undefined,
  heritage_memorial_site: false,
  heritage_memorial_site_setback: undefined,

  // Site & topography
  high_land_ft: 0,
  low_land_ft: 0,
  latitude: 27.7172,
  longitude: 85.324,
  slope_degree: 0,

  // Payment & details
  site_charge: 2000,
  payment_cash: 1000,
  payment_online: 1000,
  payment_online_mode: "esewa",
  payment_pending_due: 0,

  // Notes / drawings / images
  site_plan_note: "Sample site plan note for testing.",
  site_plan_drawing: undefined,
  property_images: undefined,
  documents: {
    citizenship_client: { original: false, photocopy: false },
    citizenship_owner: { original: false, photocopy: false },
    lorc: { original: false, photocopy: false },
    charkilla: { original: false, photocopy: false },
    blueprint: { original: false, photocopy: false },
    plot_utar: { original: false, photocopy: false },
    nirman_ijajat: { original: false, photocopy: false },
    nirman_sampanna: { original: false, photocopy: false },
    building_drawing: { original: false, photocopy: false },
  },
};

// Clean-slate values – use when you want an empty form without dummy data.
// valuation_date defaults to today so user doesn't have to set it every time.
export const cleanValuationValues: Partial<ValuationFormValues> = {
  valuation_date: new Date(),
};
