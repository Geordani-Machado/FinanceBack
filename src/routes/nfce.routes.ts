import { Router, Request, Response } from "express";
import { fetchAndParseNfce } from "../services/nfce.service";
import { ExpenseModel } from "../models/expense";

const router = Router();

router.post("/parse", async (req: Request, res: Response) => {
    try {
        const { url, includeRawHtml } = req.body as {
            url?: string;
            includeRawHtml?: boolean;
        };

        if (!url) {
            return res.status(400).json({
                error: true,
                message: "Campo 'url' é obrigatório."
            });
        }

        const parsed = await fetchAndParseNfce(url, Boolean(includeRawHtml));
        const accessKey = parsed.invoice.accessKey;
        
        // Normalizar nome para busca
        const name = (parsed.issuer.name || "Estabelecimento Desconhecido").replace(/\s+/g, " ").trim().toUpperCase();
        const date = parsed.invoice.issueDate ? new Date(parsed.invoice.issueDate) : new Date();
        date.setMilliseconds(0); // Garante comparação exata sem variação de milisegundos

        const totalValue = parsed.invoice.totalAmount || 0;

        // Verificar se já existe
        let existing = null;
        if (accessKey) {
            existing = await ExpenseModel.findOne({ accessKey });
        }
        
        // Se ainda não achou, tenta pelo URL Original (Identificador único absoluto do QR Code)
        if (!existing && url) {
            existing = await ExpenseModel.findOne({ url });
        }

        // Fallback final: Nome exato + Valor + Data
        if (!existing) {
            existing = await ExpenseModel.findOne({
                name: { $regex: new RegExp(`^${name}$`, "i") },
                totalValue,
                date
            });
        }

        if (existing) {
            return res.json({
                error: false,
                message: "Esta nota já foi cadastrada anteriormente.",
                data: parsed,
                savedExpense: existing
            });
        }

        // Salvar no MongoDB como um gasto
        const newExpense = new ExpenseModel({
            accessKey,
            url, // Salvar URL original como identificador único
            name, // Nome já normalizado acima
            date,
            totalValue,
            category: "Alimentação", 
            icon: "https://cdn-icons-png.flaticon.com/512/2331/2331970.png"
        });

        await newExpense.save();

        return res.json({
            error: false,
            data: parsed,
            savedExpense: newExpense
        });
    } catch (error: any) {
        return res.status(500).json({
            error: true,
            message: "Erro ao consultar ou processar a NFC-e.",
            details: error?.message || "Erro desconhecido"
        });
    }
});

export default router;