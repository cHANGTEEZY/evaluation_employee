import { z } from "zod";

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
  plot_no: z.string().optional(),
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
    .enum(["black_topped", "gravel", "earthen", "concrete"], {
      message: "Please select a road type",
    })
    .optional(),
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
  completion_date: z.date({ message: "Please enter a valid date" }).optional(),

  // ===== Risk / Area =====
  landslide_prone_area: z.boolean().default(false),
  landslide_prone_area_setback: z.number().nonnegative().optional(),
  river_side: z.boolean().default(false),
  river_side_setback: z.number().nonnegative().optional(),
  high_tension_area: z.boolean().default(false),
  high_tension_area_setback: z.number().nonnegative().optional(),
  canal_area: z.boolean().default(false),
  canal_area_setback: z.number().nonnegative().optional(),
  watchlist_category: z.boolean().default(false),
  watchlist_category_setback: z.number().nonnegative().optional(),
  heritage_memorial_site: z.boolean().default(false),
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

  // ===== Documents =====
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
      bptm: z.object({
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
      nirmal_lagat: z.object({
        original: z.boolean().default(false),
        photocopy: z.boolean().default(false),
      }),
      nirmal_sangarna: z.object({
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
      bptm: { original: false, photocopy: false },
      charkilla: { original: false, photocopy: false },
      blueprint: { original: false, photocopy: false },
      plot_utar: { original: false, photocopy: false },
      nirmal_lagat: { original: false, photocopy: false },
      nirmal_sangarna: { original: false, photocopy: false },
      building_drawing: { original: false, photocopy: false },
    }),

  //  Site Plan
  site_plan_note: z.string().optional(),

  //  Site Plan Drawing
  site_plan_drawing: z.string().optional(),

  // Property Images
  property_images: z.array(z.string()).optional(),
});

export type ValuationFormValues = z.infer<typeof valuationSchema>;

// Default values for the form (all fields filled for testing)
export const defaultValuationValues: Partial<ValuationFormValues> = {
  // Basic Details - ref_no will be auto-generated
  ref_no: undefined,
  valuation_date: new Date(),
  branch: "Main Branch",
  client_name: "Ram Bahadur Sharma",
  contact_number: "9841234567",
  client_address_nagrita: "Kathmandu-10, Baneshwor",

  // Bank Details
  bank_name: "NIC Asia Bank",
  bank_branch_name: "Thapathali Branch",
  city: "Kathmandu",
  tole_area: "New Baneshwor",

  // Property Ownership & Location
  owner_of_property: "Ram Bahadur Sharma",
  property_address_deed: "Ward No. 10, Baneshwor, Kathmandu (as per deed)",
  plot_no: "45",
  present_property_address: "New Baneshwor, Kathmandu-10",
  district: "Kathmandu",

  // Valuation Purpose
  valuation_for: "land_and_building",

  // Road & Access
  road_type: "black_topped",
  road_width: 20,
  access_road_direction: "north",
  access_road_direction_others: "",

  // Property Dimensions
  property_area_length: 150,
  property_frontage_direction: "north",
  property_narrowest_length: 120,
  property_narrowest_direction: "south",

  // Access & Rights
  right_of_way: true,
  motorable_access: true,
  electricity_available: true,
  drainage_near_property: true,

  // Property Classification
  property_type: "residential",
  property_ownership_type: "individual_single",
  ownership_transferred_through: "sale",
  hold_type: "freehold",

  // Land Rates
  commercial_rate_per_anna: 50000,
  government_rate_per_anna: 45000,

  // Building Details
  building_type: "rcc_framed",
  building_purpose: "residential",
  number_of_storeys: 2,
  storey_height: 10,
  building_age_years: 5,
  completion_date: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000),

  // Risk / Area
  landslide_prone_area: false,
  landslide_prone_area_setback: undefined,
  river_side: false,
  river_side_setback: undefined,
  high_tension_area: false,
  high_tension_area_setback: undefined,
  canal_area: false,
  canal_area_setback: undefined,
  watchlist_category: false,
  watchlist_category_setback: undefined,
  heritage_memorial_site: false,
  heritage_memorial_site_setback: undefined,

  // Site & Topography
  high_land_ft: 15,
  low_land_ft: 12,
  latitude: 27.7172,
  longitude: 85.324,
  slope_degree: 5,

  // Payment & Details
  site_charge: 15000,
  payment_cash: 5000,
  payment_online: 10000,
  payment_online_mode: "esewa",
  payment_pending_due: 0,

  // Site Plan
  site_plan_note: "Sample site plan for testing",

  // Documents - some checked for testing
  documents: {
    citizenship_client: { original: true, photocopy: true },
    citizenship_owner: { original: false, photocopy: true },
    lorc: { original: false, photocopy: true },
    bptm: { original: false, photocopy: false },
    charkilla: { original: false, photocopy: false },
    blueprint: { original: false, photocopy: true },
    plot_utar: { original: false, photocopy: true },
    nirmal_lagat: { original: false, photocopy: false },
    nirmal_sangarna: { original: false, photocopy: false },
    building_drawing: { original: false, photocopy: true },
  },

  // site_plan_drawing and property_images remain empty (user adds via UI)
};
