
import { getDatabase } from "../config/mongodb.js";

export async function getProductsWithDetails() {
  const db = await getDatabase();

  const products = await db
    .collection("products")
    .aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "CategoryID",
          foreignField: "CategoryID",
          as: "category",
        },
      },
      {
        $lookup: {
          from: "suppliers",
          localField: "SupplierID",
          foreignField: "SupplierID",
          as: "supplier",
        },
      },
      {
        $unwind: "$category",
      },
      {
        $unwind: "$supplier",
      },
      {
        $project: {
          _id: 0,
          ProductID: 1,
          ProductName: 1,
          UnitPrice: 1,
          CategoryName: "$category.CategoryName",
          SupplierName: "$supplier.CompanyName",
        },
      },
    ])
    .toArray();

  return products;
}

export async function createProduct(product: {
  ProductName: string;
  SupplierID: number;
  CategoryID: number;
  UnitPrice: number;
  UnitsInStock: number;
}) {
  const db = await getDatabase();
  const collection = db.collection("products");

  const lastProduct = await collection
    .find({})
    .sort({ ProductID: -1 })
    .limit(1)
    .next();

  const newProduct = {
    ProductID: (lastProduct?.ProductID ?? 0) + 1,
    ...product,
  };

  await collection.insertOne(newProduct);

  return newProduct;
}

export async function updateProduct(
  productId: number,
  changes: {
    ProductName?: string;
    SupplierID?: number;
    CategoryID?: number;
    UnitPrice?: number;
    UnitsInStock?: number;
  }
) {
  const db = await getDatabase();

  const result = await db.collection("products").updateOne(
    { ProductID: productId },
    { $set: changes }
  );

  return {
    updated: result.matchedCount > 0,
    modifiedCount: result.modifiedCount,
  };
}

export async function deleteProduct(productId: number) {
  const db = await getDatabase();

  const result = await db.collection("products").deleteOne({
    ProductID: productId,
  });

  return {
    deleted: result.deletedCount > 0,
  };
}

export async function getProductsPaginated(
  page: number,
  limit: number,
  sortBy: "ProductName" | "UnitPrice",
  order: "asc" | "desc"
) {
  const db = await getDatabase();
  const collection = db.collection("products");

  const skip = (page - 1) * limit;
  const sortDirection = order === "asc" ? 1 : -1;

  const total = await collection.countDocuments();

  const products = await collection
    .find({}, { projection: { _id: 0 } })
    .sort({ [sortBy]: sortDirection, ProductID: 1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    products,
  };
}
