import { Router, Request, Response } from "express";
import { getAllExpenses } from "../services/gastos.service";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
    try {
        const result = await getAllExpenses();
        return res.json({
            error: false,
            data: result.expenses,
            total: result.total
        });
    } catch (error: any) {
        return res.status(500).json({
            error: true,
            message: "Erro ao buscar gastos.",
            details: error?.message || "Erro desconhecido"
        });
    }
});

export default router;
