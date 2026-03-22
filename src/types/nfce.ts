export type InvoiceItem = {
    description?: string;
    code?: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    totalPrice?: number;
};

export type InvoiceData = {
    source: "qrcode_url";
    consultaUrl: string;
    issuer: {
        name?: string;
        cnpj?: string;
        address?: string;
    };
    invoice: {
        number?: string;
        series?: string;
        issueDate?: string;
        accessKey?: string;
        totalAmount?: number;
        paymentMethod?: string;
    };
    items: InvoiceItem[];
    rawHtml?: string;
};