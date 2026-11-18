
import { z } from 'zod';
import { router, publicProcedure } from '../config/trpc.js';
import { products } from '../services/memoryService.js';


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
    })

});

export type AppRouter = typeof appRouter;
