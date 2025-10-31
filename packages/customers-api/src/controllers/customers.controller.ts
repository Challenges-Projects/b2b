import { Request, Response } from "express";
import { CustomerCreateSchema } from "../schemas/customers.schema.js";
import * as repo from "../repositories/customers.repo.js";
import { createToken } from "../middlewares/auth.middleware.js";

export const create = async (req: Request, res: Response) => {
  const parsed = CustomerCreateSchema.safeParse(req.body);
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
    const exists = await repo.searchCustomers(data.email, 0, 1);
    if (exists.find((c: any) => c.email === data.email))
      return res.status(409).json({ error: "Email already exists" });
    const customer = await repo.createCustomer(data);
    return res.status(201).json(customer);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      message: "Error al crear cliente",
    });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const customer = await repo.findById(Number(req.params.id));
    if (!customer)
      return res.status(404).json({ error: "Cliente no encontrado" });
    return res.json(customer);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      message: "Error al consultar cliente",
    });
  }
};

export const search = async (req: Request, res: Response) => {
  const { search, cursor, limit } = req.query as any;
  const customers = await repo.searchCustomers(
    search ? search : "",
    cursor ? Number(cursor) : 0,
    limit ? Number(limit) : 10
  );
  return res.json(customers);
};

export const update = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, phone = "" } = CustomerCreateSchema.parse(req.body);

  try {
    const customer = await repo.updateCustomer(Number(id), name, email, phone);
    if (!customer)
      return res.status(404).json({ error: "Cliente no encontrado" });
    if (customer.ok == false)
      return res.status(400).json({ error: "Correo ya existe" });
    return res.status(200).json(customer);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      message: "Error al actualizar cliente",
    });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const customer = await repo.deleteCustomer(Number(id));
    if (!customer)
      return res.status(404).json({ error: "Cliente no encontrado" });
    return res.status(204).json();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      message: "Error al eliminar cliente",
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
