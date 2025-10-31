import { pool } from "../utils/db.js";

export const createProduct = async (input: {
  sku: string;
  name: string;
  price: number;
  stock: number;
}) => {
  const [result] = await pool.execute(
    "INSERT INTO products (name,price_cents,stock,sku) VALUES (?,?,?,?)",
    [input.name, input.price, input.stock, input.sku]
  );
  // @ts-ignore
  const id = result.insertId as number;
  return findById(id);
};

export const findById = async (id: number) => {
  const [rows] = await pool.execute("SELECT * FROM products WHERE id = ?", [
    id,
  ]);
  //console.log((rows as any[])[0])
  return (rows as any[])[0] || null;
};

export const searchProducts = async (
  search: string,
  cursor: number,
  limit: number
) => {
  const params: any[] = [];
  //let sql = "SELECT * FROM products WHERE 1=1"; 
  let sql = "SELECT id, sku ,name , price_cents/100 as price_cents ,stock , created_at FROM products WHERE 1=1";
  if (search && search.trim() !== "") {
    sql += " AND name LIKE ?";
    console.log(`%${search}%`);
    params.push(`%${search}%`);
  }
  if (cursor) {
    sql += " AND id > ?";
    params.push(cursor);
  }
  sql += " ORDER BY id ASC LIMIT ?";
  params.push(String(limit));
  console.log("DEBUG SQL:", sql);
  console.log("DEBUG PARAMS:", params);
  console.log(
    "DEBUG TYPES:",
    params.map((p) => typeof p)
  );
  const [rows] = await pool.execute(sql, params);
  console.log(rows);
  return rows as any[];
};

export const validateProduct = async (search: string) => {
  const params: any[] = [];
  let sql = "SELECT * FROM products WHERE 1=1 AND name = ?";
  params.push(`%${search}%`);
  const [rows] = await pool.execute(sql, params);
  return (rows as any[])[0] || null;
};

export const updateProduct = async (
  id: number,
  name?: string,
  price?: number,
  stock?: number,
  sku?: string
) => {
  const product = await findById(id);
  if (!product) {
    return null;
  }
  try {
    if (name)
      await pool.execute("UPDATE products SET name=? WHERE id=?", [name, id]);
    if (price)
      price = Math.round(price * 100);
      await pool.execute("UPDATE products SET price_cents=? WHERE id=?", [
        price,
        id,
      ]);
    if (stock)
      
      await pool.execute("UPDATE products SET stock=? WHERE id=?", [stock, id]);
    if (sku)
      await pool.execute("UPDATE products SET sku=? WHERE id=?", [sku, id]);

    return await findById(id);
  } catch (error) {
    console.log(error)
    // @ts-ignore
    console.log(error.errno);
    return {
      ok: false,
      message: "Error al actualizar productos",
    };
  }
};
