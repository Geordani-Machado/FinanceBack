import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:asjsimdtk49yasrw@69.62.93.97:27017";

export async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Conectado ao MongoDB com sucesso.");
    } catch (error) {
        console.error("Erro ao conectar ao MongoDB:", error);
        process.exit(1);
    }
}
