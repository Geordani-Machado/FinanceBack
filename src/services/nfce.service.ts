import axios from "axios";
import * as cheerio from "cheerio";
import { InvoiceData, InvoiceItem } from "../types/nfce";
import {
    brMoneyToNumber,
    cleanText,
    extractAccessKey,
    onlyDigits,
    parseBrazilianDateTime
} from "../utils/helpers";

function parseInfoBlock(infoText: string) {
    const numberMatch = infoText.match(/Número:\s*(\d+)/i);
    const seriesMatch = infoText.match(/Série:\s*(\d+)/i);
    const issueDateMatch = infoText.match(
        /Emissão:\s*(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/i
    );
    const accessKeyMatch = infoText.match(/Chave de acesso:\s*([\d\s]+)/i);

    return {
        number: numberMatch?.[1],
        series: seriesMatch?.[1],
        issueDate: parseBrazilianDateTime(issueDateMatch?.[1]),
        accessKey: onlyDigits(accessKeyMatch?.[1])
    };
}

function extractIssuerData($: cheerio.CheerioAPI) {
    const issuerName =
        cleanText($("#u20").text()) ||
        cleanText($("div.txtCenter h4").first().text()) ||
        cleanText($("div.txtCenter").first().text());

    const textBlocks = $(".txtCenter .text")
        .map((_, el) => cleanText($(el).text()))
        .get()
        .filter(Boolean);

    let cnpj: string | undefined;
    let address: string | undefined;

    for (const block of textBlocks) {
        if (!cnpj && /CNPJ/i.test(block)) {
            cnpj = onlyDigits(block);
            continue;
        }

        if (!address && !/CNPJ/i.test(block)) {
            address = block;
        }
    }

    return {
        name: issuerName || undefined,
        cnpj,
        address
    };
}

function extractPaymentMethod($: cheerio.CheerioAPI): string | undefined {
    const paymentLabels = $("#linhaTotal label.tx")
        .map((_, el) => cleanText($(el).text()))
        .get()
        .filter(Boolean);

    if (paymentLabels.length > 0) {
        return paymentLabels[0];
    }

    const fallbackText = $.text();
    const match = fallbackText.match(
        /(Cartão de Crédito|Cartão de Débito|Dinheiro|Pix|Vale Alimentação|Vale Refeição)/i
    );

    return match?.[1];
}

function extractTotalAmount($: cheerio.CheerioAPI): number | undefined {
    const candidates = [
        cleanText($("#linhaTotal .totalNumb.txtMax").first().text()),
        cleanText($(".totalNumb").first().text())
    ].filter(Boolean);

    for (const candidate of candidates) {
        const value = brMoneyToNumber(candidate);
        if (value !== undefined) return value;
    }

    return undefined;
}

function extractItems($: cheerio.CheerioAPI): InvoiceItem[] {
    const items: InvoiceItem[] = [];

    $("#tabResult tr").each((_, tr) => {
        const row = $(tr);

        const description = cleanText(row.find(".txtTit").first().text());
        const codeText = cleanText(row.find(".RCod").text());
        const quantityText = cleanText(row.find(".Rqtd").text());
        const unitText = cleanText(row.find(".RUN").text());
        const unitPriceText = cleanText(row.find(".RvlUnit").text());
        const totalText = cleanText(row.find(".valor").text());

        if (!description) return;

        const codeMatch = codeText.match(/(\d+)/);
        const quantityMatch = quantityText.match(/Qtde\.?:?\s*([\d,\.]+)/i);
        const unitMatch = unitText.match(/UN:?\s*([A-Z]+)/i);
        const unitPriceMatch = unitPriceText.match(/Vl\.?\s*Unit\.?:?\s*([\d,\.]+)/i);

        items.push({
            description,
            code: codeMatch?.[1],
            quantity: brMoneyToNumber(quantityMatch?.[1]),
            unit: unitMatch?.[1],
            unitPrice: brMoneyToNumber(unitPriceMatch?.[1]),
            totalPrice: brMoneyToNumber(totalText)
        });
    });

    return items;
}

export async function fetchAndParseNfce(
    consultaUrl: string,
    includeRawHtml = false
): Promise<InvoiceData> {
    const response = await axios.get<string>(consultaUrl, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8"
        },
        timeout: 20000
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const issuer = extractIssuerData($);
    const totalAmount = extractTotalAmount($);
    const paymentMethod = extractPaymentMethod($);

    const infoText =
        cleanText($("#infos").text()) ||
        cleanText($("body").text());

    const info = parseInfoBlock(infoText);
    const items = extractItems($);

    return {
        source: "qrcode_url",
        consultaUrl,
        issuer,
        invoice: {
            number: info.number,
            series: info.series,
            issueDate: info.issueDate,
            accessKey: info.accessKey || extractAccessKey(infoText, consultaUrl),
            totalAmount,
            paymentMethod
        },
        items,
        rawHtml: includeRawHtml ? html : undefined
    };
}