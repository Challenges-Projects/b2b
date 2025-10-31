import { Router } from "express";
import { requireAuth, requireServiceToken } from "../middlewares/auth.middleware.js";
import * as ctrl from "../controllers/customers.controller.js";

const r = Router();
r.get("/gettoken",ctrl.getToken)
r.post("/customers", requireServiceToken, ctrl.create);
r.get("/customers/:id", requireServiceToken, ctrl.getById);
r.get("/customers", requireServiceToken, ctrl.search);
r.put("/customers/:id",requireServiceToken,ctrl.update)
r.delete("/customers/:id",requireServiceToken,ctrl.deleteCustomer)
// Endpoint interno protegido por SERVICE_TOKEN
r.get("/internal/customers/:id", requireServiceToken, ctrl.getById);

export default r;
