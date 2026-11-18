
import { readFileSync } from 'node:fs';

export interface Product {
  ProductID: number;
  ProductName: string;
  SupplierID: number;
  CategoryID: number;
  QuantityPerUnit: string;
  UnitPrice: number;
  UnitsInStock: number;
  ReorderLevel: number;
}

export interface Category {
  CategoryID: number;
  CategoryName: string;
  Description: string;
}

export interface Supplier {
  SupplierID: number;
  CompanyName: string;
  ContactName: string;
  ContactTitle: string;
  Country: string;
  City: string;
  Address: string;
}

function loadData<T>(fileName: string): T[] {
  const fileUrl = new URL(`../data/${fileName}`, import.meta.url);
  const content = readFileSync(fileUrl, 'utf8');

  return JSON.parse(content) as T[];
}

export const products = loadData<Product>('Products.json');
export const categories = loadData<Category>('Categories.json');
export const suppliers = loadData<Supplier>('Suppliers.json');
