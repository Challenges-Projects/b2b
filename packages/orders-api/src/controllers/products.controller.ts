import { Request, Response } from "express";
import {
  ProductCreateSchema,
  ProductUpdateSchema,
} from "../schemas/orders.schema.js";
import * as repo from "../repositories/products.repo.js";
import { createToken } from "../middlewares/auth.middleware.js";

export const create = async (req: Request, res: Response) => {
  const parsed = ProductCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Error de validación",
      errors: parsed.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }
  const data = parsed.data;
  try {
    const exists = await repo.validateProduct(data.name);
    if (exists) return res.status(409).json({ error: "Producto ya existe" });

    data.price = Math.round(data.price * 100);
    
    const producto = await repo.createProduct(data);
    const price = (producto.price_cents / 100).toFixed(2);
    delete producto.price_cents;
    return res.status(201).json({ ...producto, price: price });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      message: "Error al crear producto",
    });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const producto = await repo.findById(Number(req.params.id));
    if (!producto)
      return res.status(404).json({ error: "Producto no encontrado" });

    const price = (producto.price_cents / 100).toFixed(2);
    delete producto.price_cents;
    return res.json({ ...producto, price: price });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      message: "Error al consultar producto",
    });
  }
};

export const search = async (req: Request, res: Response) => {
  const { search, cursor, limit } = req.query as any;
  const products = await repo.searchProducts(
    search ? search : "",
    cursor ? Number(cursor) : 0,
    limit ? Number(limit) : 10
  );
  return res.json(products);
};

export const update = async (req: Request, res: Response) => {
  const { id } = req.params;
  const parsed = ProductUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Error de validación",
      errors: parsed.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }
  const data = parsed.data;
  const { name, price, stock, sku } = data;

  try {
    const producto = await repo.updateProduct(
      Number(id),
      name,
      price,
      stock,
      sku
    );
    if (!producto)
      return res.status(404).json({ error: "Producto no encontrado" });

    const precio = (producto.price_cents / 100).toFixed(2);
    delete producto.price_cents;

    return res.status(200).json({ ...producto, price: precio });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      message: "Error al actualizar producto",
    });
  }
};

export const getToken = (req: Request, res: Response) => {
  try {
    return res.status(200).json({ token: createToken() });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      message: "No se pudo generar token",
    });
  }
};
