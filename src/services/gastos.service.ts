import { ExpenseModel } from "../models/expense";

export async function getAllExpenses() {
    try {
        const expenses = await ExpenseModel.find().sort({ date: -1 });

        // Calcula o total somando todos os valores
        const total = expenses.reduce((sum, expense) => sum + (expense.totalValue || 0), 0);

        return {
            expenses,
            total
        };
    } catch (error) {
        console.error("Erro ao buscar gastos no banco:", error);
        throw error;
    }
}
