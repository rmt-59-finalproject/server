const { z } = require("zod");

const productSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .refine((val) => val !== null, { message: "Name is required" }),

    stock: z.number().nonnegative("Stock cannot be negative"),

    unit: z
      .string()
      .min(1, "Unit is required")
      .refine((val) => val !== null, { message: "Unit is required" }),

    category: z
      .string()
      .min(1, "Category is required")
      .refine((val) => val !== null, { message: "Category is required" }),
  })
  .passthrough();

const productUpdateSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .refine((val) => val !== null, { message: "Name is required" })
      .optional(),

    stock: z.number().nonnegative("Stock cannot be negative").optional(),

    unit: z
      .string()
      .min(1, "Unit is required")
      .refine((val) => val !== null, { message: "Unit is required" })
      .optional(),

    category: z
      .string()
      .min(1, "Category is required")
      .refine((val) => val !== null, { message: "Category is required" })
      .optional(),
  })
  .passthrough();

module.exports = {
  productSchema,
  productUpdateSchema,
};
