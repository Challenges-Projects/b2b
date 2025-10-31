import { pool } from "../utils/db.js";

export const createCustomer = async (input: {
  name: string;
  email: string;
  phone?: string;
}) => {
  const [result] = await pool.execute(
    "INSERT INTO customers (name,email,phone) VALUES (?,?,?)",
    [input.name, input.email, input.phone ?? null]
  );
  // @ts-ignore
  const id = result.insertId as number;
  return findById(id);
};

export const findById = async (id: number) => {
  const [rows] = await pool.execute("SELECT * FROM customers WHERE id = ?", [
    id,
  ]);
  return (rows as any[])[0] || null;
};

export const searchCustomers = async (
  search: string,
  cursor: number,
  limit:number
) => {
  const params: any[] = [];
  let sql = "SELECT * FROM customers WHERE 1=1";
  if (search && search.trim() !== "") {
    sql += " AND (name LIKE ? OR email LIKE ?)";
    console.log(`%${search}%`, `%${search}%`);
    params.push(`%${search}%`, `%${search}%`);
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

export const updateCustomer = async (
  id: number,
  name: string,
  email: string,
  phone: string
) => {
  const customer = await findById(id);
  if (!customer) {
    return null;
  }
  try {
    const [result] = await pool.execute(
    "UPDATE customers SET name=?, email=?, phone=? WHERE id=?",
    [name, email, phone, id]
  );
  
  return await findById(id);  
  } catch (error) {
    
    console.log("entro por aca")
    // @ts-ignore
    console.log(error.errno)
    // @ts-ignore
    if (error.errno="1062") {
      return {
        ok:false,
        message:"Correo ya existe",
        errorCode:"1062"
      }
    }

  }
  
};

export const deleteCustomer = async (id: number) => {
  const customer = await findById(id);
  if (!customer) {
    return false;
  }
  const [result] = await pool.execute("DELETE FROM customers WHERE id=?", [id]);
  // @ts-ignore
  //return result.affectedRows > 0 ? true : false;
  return true
};
