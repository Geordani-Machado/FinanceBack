import { Schema, model } from "mongoose";

const expenseSchema = new Schema({
    accessKey: { type: String, unique: true, sparse: true },
    url: { type: String, unique: true, sparse: true },
    icon: { type: String, default: "" },
    name: { type: String, required: true },
    category: { type: String, default: "Outros" },
    date: { type: Date, required: true },
    totalValue: { type: Number, required: true }
}, {
    timestamps: true,
    collection: "gastos"
});

// Índice único composto para fallback absoluto (Nome + Data + Valor)
expenseSchema.index({ name: 1, date: 1, totalValue: 1 }, { unique: true });

export const ExpenseModel = model("Expense", expenseSchema);
