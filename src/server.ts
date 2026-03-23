import "./polyfills";
import express from "express";
import dotenv from "dotenv";
import nfceRoutes from "./routes/nfce.routes";
import gastosRoutes from "./routes/gastos.routes";
import manualRoutes from "./routes/manual.routes";
import { connectDB } from "./config/database";

dotenv.config();

// Conectar ao banco de dados
connectDB();

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({ ok: true });
});

app.use("/nfce", nfceRoutes);
app.use("/gastos", gastosRoutes);
app.use("/manual", manualRoutes);

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});