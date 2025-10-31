import { Router } from "express";
import { requireAuth, requireServiceToken } from "../middlewares/auth.middleware.js";
import * as ctrl from "../controllers/orders.controller.js";

const r = Router();
r.get("/gettoken",ctrl.getToken)
r.post("/orders", requireServiceToken, ctrl.createOrder);
r.get("/orders/:id", requireServiceToken,ctrl.getOrder);
r.post("/orders/:id/confirm", requireServiceToken, ctrl.confirmOrder);
r.post("/orders/:id/cancel", requireServiceToken, ctrl.cancelOrder);

export default r;
