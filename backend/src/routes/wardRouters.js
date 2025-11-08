// routes/wardRep.routes.js
import express from "express";
const wardRoutes = express.Router();
import * as ctrl from "../controllers/wardController.js"

wardRoutes.post('/register', ctrl.registerWardRep);
wardRoutes.post('/login', ctrl.loginWardRep);

wardRoutes.get('/', ctrl.listWardReps);
wardRoutes.get('/:id', ctrl.getWardRepById);
wardRoutes.patch('/:id', ctrl.updateWardRep);
wardRoutes.delete('/:id', ctrl.deleteWardRep);

wardRoutes.post('/add-verified-issue', ctrl.addVerifiedIssue);
wardRoutes.post('/:id/increment-resolved', ctrl.incrementResolvedIssues);

export default wardRoutes;
