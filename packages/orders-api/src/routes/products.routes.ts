import { Router } from "express";
import {
  requireAuth,
  requireServiceToken,
} from "../middlewares/auth.middleware.js";
import * as ctrl from "../controllers/products.controller.js";

const r = Router();
r.get("/gettoken",ctrl.getToken)
r.post("/products",requireServiceToken, ctrl.create);
r.get("/products/:id",requireServiceToken, ctrl.getById);
r.get("/products",requireServiceToken, ctrl.search);
r.patch("/products/:id",requireServiceToken, ctrl.update);

export default r;
