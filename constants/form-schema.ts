import { z } from "zod";

export const valuationSchema = z.object({
  // ===== Basic Details =====
  ref_no: z.string().optional(),
  valuation_date: z.date({ message: "Please enter a valid valuation date" }),
  branch: z.string().min(1, "Branch is required"),
  client_name: z.string().min(1, "Client name is required"),
  contact_number: z
    .string()
    .min(1, "Contact number is required")
    .regex(/^[0-9+\-\s()]+$/, "Please enter a valid phone number"),
  client_address_nagrita: z.string().min(1, "Client address is required"),

  // ===== Property Ownership & Location =====
  owner_of_property: z.string().min(1, "Property owner name is required"),
  property_address_deed: z
    .string()
    .min(1, "Property address (deed) is required"),
  plot_no: z.string().optional(),
  present_property_address: z
    .string()
    .min(1, "Present property address is required"),
  district: z.string().min(1, "District is required"),

  // ===== Valuation Purpose =====
  valuation_for: z.enum(
    [
      "vacant_land",
      "land_and_building",
      "ready_made_house",
      "apartment_duplex",
      "construction_extension_renovation",
    ],
    { message: "Please select a valuation purpose" }
  ),

  // ===== Road & Access =====
  road_type: z.enum(["black_topped", "gravel", "earthen", "concrete"], {
    message: "Please select a road type",
  }),
  road_width: z
    .number({ message: "Road width must be a number" })
    .positive("Road width must be greater than 0")
    .optional(),
  access_road_direction: z.enum(["east", "west", "north", "south"], {
    message: "Please select an access road direction",
  }),

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

  // ===== Access & Rights =====
  right_of_way: z.boolean().default(false),
  motorable_access: z.boolean().default(false),
  electricity_available: z.boolean().default(false),
  drainage_near_property: z.boolean().default(false),

  // ===== Property Classification =====
  property_type: z.enum(
    ["residential", "commercial", "industrial", "agricultural"],
    {
      message: "Please select a property type",
    }
  ),
  property_ownership_type: z.enum(
    ["company", "individual_single", "individual_joint"],
    {
      message: "Please select an ownership type",
    }
  ),
  ownership_transferred_through: z.enum(
    ["sale", "bakupatra", "family_separation", "habalish"],
    { message: "Please select a transfer method" }
  ),
  hold_type: z.enum(["freehold", "leasehold"], {
    message: "Please select a hold type",
  }),

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
  building_type: z.enum(["rcc_framed", "steel", "load_bearing", "others"], {
    message: "Please select a valid building type",
  }),
  building_purpose: z.enum(["residential", "commercial", "both"], {
    message: "Please select a valid building purpose",
  }),
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
  river_side: z.boolean().default(false),
  high_tension_area: z.boolean().default(false),
  canal_area: z.boolean().default(false),

  // ===== Site & Topography =====
  site_charge: z
    .number({ message: "Site charge must be a number" })
    .nonnegative("Site charge cannot be negative")
    .optional(),
  high_land_ft: z.number({ message: "High land must be a number" }).optional(),
  low_land_ft: z.number({ message: "Low land must be a number" }).optional(),
  latitude: z
    .number({ message: "Latitude must be a number" })
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90")
    .optional(),
  longitude: z
    .number({ message: "Longitude must be a number" })
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
    .optional(),
  slope_degree: z
    .number({ message: "Slope degree must be a number" })
    .min(0, "Slope degree must be between 0 and 90")
    .max(90, "Slope degree must be between 0 and 90")
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

  // ===== Site Plan =====
  site_plan_note: z.string().optional(),

  // ===== Site Plan Drawing =====
  site_plan_drawing: z.string().optional(),

  // ===== Property Images =====
  property_images: z.array(z.string()).optional(),
});

export type ValuationFormValues = z.infer<typeof valuationSchema>;

// Default values for the form (pre-filled with test data for easier testing)
export const defaultValuationValues: Partial<ValuationFormValues> = {
  // Basic Details
  ref_no: "VAL-2026-001",
  valuation_date: new Date(),
  branch: "Kathmandu Branch",
  client_name: "Sushank Gurung",
  contact_number: "9841234567",
  client_address_nagrita: "Thamel, Kathmandu",

  // Property Ownership & Location
  owner_of_property: "Sushank Gurung",
  property_address_deed: "Ward No. 16, Thamel, Kathmandu",
  plot_no: "123",
  present_property_address: "Ward No. 16, Thamel, Kathmandu",
  district: "Kathmandu",

  // Valuation Purpose
  valuation_for: "land_and_building",

  // Road & Access
  road_type: "black_topped",
  road_width: 15,
  access_road_direction: "north",

  // Property Dimensions
  property_area_length: 2500,
  property_frontage_direction: "north",
  property_narrowest_length: 50,
  property_narrowest_direction: "east",

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
  commercial_rate_per_anna: 500000,
  government_rate_per_anna: 450000,

  // Building Details
  building_type: "rcc_framed",
  building_purpose: "residential",
  number_of_storeys: 3,
  storey_height: 10,
  building_age_years: 5,
  completion_date: new Date(2021, 0, 1),

  // Risk / Area
  landslide_prone_area: false,
  river_side: false,
  high_tension_area: false,
  canal_area: false,

  // Site & Topography
  site_charge: 50000,
  high_land_ft: 100,
  low_land_ft: 95,
  latitude: 27.7172,
  longitude: 85.324,
  slope_degree: 5,

  // Documents
  documents: {
    citizenship_client: { original: true, photocopy: false },
    citizenship_owner: { original: true, photocopy: false },
    lorc: { original: false, photocopy: true },
    bptm: { original: false, photocopy: true },
    charkilla: { original: false, photocopy: true },
    blueprint: { original: false, photocopy: true },
    plot_utar: { original: false, photocopy: false },
    nirmal_lagat: { original: false, photocopy: false },
    nirmal_sangarna: { original: false, photocopy: false },
    building_drawing: { original: false, photocopy: true },
  },

  // Site Plan
  site_plan_note:
    "Property located in prime residential area with good access to main road.",
};
