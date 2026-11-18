
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../config/trpc.js';
import { products } from '../services/memoryService.js';

import {
  getProductsWithDetails,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsPaginated
} from '../services/mongoService.js';

export const appRouter = router({

  hello: publicProcedure.query(() => {
    return {
      message: 'Northwind tRPC server is working'
    };
  }),

  getAllProducts: publicProcedure.query(() => {
    return products;
  }),

  getProductFields: publicProcedure.query(() => {
    return products.map((product) => ({
      ProductID: product.ProductID,
      ProductName: product.ProductName,
      UnitPrice: product.UnitPrice
    }));
  }),

  filterProducts: publicProcedure
    .input(
      z.object({
        categoryId: z.number().int().optional(),
        minPrice: z.number().nonnegative().optional(),
        maxPrice: z.number().nonnegative().optional()
      })
    )
    .query(({ input }) => {
      return products.filter((product) => {
        const categoryMatch =
          input.categoryId === undefined ||
          product.CategoryID === input.categoryId;

        const minPriceMatch =
          input.minPrice === undefined ||
          product.UnitPrice >= input.minPrice;

        const maxPriceMatch =
          input.maxPrice === undefined ||
          product.UnitPrice <= input.maxPrice;

        return categoryMatch &&
          minPriceMatch &&
          maxPriceMatch;
      });
    }),

  getProductsWithDetails: publicProcedure.query(async () => {
    return await getProductsWithDetails();
  }),

  createProduct: protectedProcedure
    .input(
      z.object({
        ProductName: z.string().min(1),
        SupplierID: z.number().int().positive(),
        CategoryID: z.number().int().positive(),
        UnitPrice: z.number().nonnegative(),
        UnitsInStock: z.number().int().nonnegative()
      })
    )
    .mutation(async ({ input }) => {
      return await createProduct(input);
    }),

  updateProduct: protectedProcedure
    .input(
      z.object({
        ProductID: z.number().int().positive(),
        ProductName: z.string().min(1).optional(),
        SupplierID: z.number().int().positive().optional(),
        CategoryID: z.number().int().positive().optional(),
        UnitPrice: z.number().nonnegative().optional(),
        UnitsInStock: z.number().int().nonnegative().optional()
      })
    )
    .mutation(async ({ input }) => {
      const { ProductID, ...changes } = input;
      return await updateProduct(ProductID, changes);
    }),

  deleteProduct: protectedProcedure
    .input(
      z.object({
        ProductID: z.number().int().positive()
      })
    )
    .mutation(async ({ input }) => {
      return await deleteProduct(input.ProductID);
    }),

  getProductsPaginated: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(10),
        sortBy: z.enum(['ProductName', 'UnitPrice']).default('ProductName'),
        order: z.enum(['asc', 'desc']).default('asc')
      })
    )
    .query(async ({ input }) => {
      return await getProductsPaginated(
        input.page,
        input.limit,
        input.sortBy,
        input.order
      );
    })

});

export type AppRouter = typeof appRouter;
