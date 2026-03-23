import { Router, Request, Response } from "express";
import { ExpenseModel } from "../models/expense";

const router = Router();

/**
 * POST /manual/lancamento
 * Realiza o lançamento manual de um gasto.
 * Body: { name, category, totalValue, date? }
 */
router.post("/lancamento", async (req: Request, res: Response) => {
    try {
        const { name, category, totalValue, date } = req.body as {
            name?: string;
            category?: string;
            totalValue?: number;
            date?: string;
        };

        // Validações obrigatórias
        if (!name || typeof name !== "string" || name.trim() === "") {
            return res.status(400).json({
                error: true,
                message: "Campo 'name' (nome do estabelecimento) é obrigatório."
            });
        }

        if (!category || typeof category !== "string" || category.trim() === "") {
            return res.status(400).json({
                error: true,
                message: "Campo 'category' (categoria) é obrigatório."
            });
        }

        if (totalValue === undefined || totalValue === null || typeof totalValue !== "number" || totalValue <= 0) {
            return res.status(400).json({
                error: true,
                message: "Campo 'totalValue' (valor total da nota) é obrigatório e deve ser um número positivo."
            });
        }

        // Normalizar dados
        const normalizedName = name.replace(/\s+/g, " ").trim().toUpperCase();
        const normalizedCategory = category.trim();
        const entryDate = date ? new Date(date) : new Date();
        entryDate.setMilliseconds(0);

        // Checar duplicata: mesmo nome + valor + data
        const existing = await ExpenseModel.findOne({
            name: { $regex: new RegExp(`^${normalizedName}$`, "i") },
            totalValue,
            date: entryDate
        });

        if (existing) {
            return res.status(409).json({
                error: true,
                message: "Este lançamento já foi registrado anteriormente (mesmo estabelecimento, valor e data).",
                data: existing
            });
        }

        // Criar o novo gasto
        const newExpense = new ExpenseModel({
            name: normalizedName,
            category: normalizedCategory,
            totalValue,
            date: entryDate,
            icon: ""   // Sem ícone fixo para lançamentos manuais
        });

        await newExpense.save();

        return res.status(201).json({
            error: false,
            message: "Lançamento manual registrado com sucesso.",
            data: newExpense
        });
    } catch (error: any) {
        return res.status(500).json({
            error: true,
            message: "Erro ao registrar o lançamento manual.",
            details: error?.message || "Erro desconhecido"
        });
    }
});

export default router;
