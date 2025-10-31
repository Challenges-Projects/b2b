import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Missing Bearer token" });
  try {
    console.log(`token : ${token}`);
    console.log(`secret key: ${process.env.JWT_SECRET!}`);
    jwt.verify(token, process.env.JWT_SECRET!);
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

export const requireServiceToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (token && token === process.env.SERVICE_TOKEN) return next();
  return res.status(401).json({ error: "Invalid service token" });
};

export const createToken=():String=> {
  // const createToken=jwt.sign(
  //     { sub: "operator" },
  //     process.env.JWT_SECRET!
  //   )
  // console.log(createToken)  
  return process.env.SERVICE_TOKEN!
}
