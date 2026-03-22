export function cleanText(value?: string): string {
    return (value || "").replace(/\s+/g, " ").trim();
}

export function onlyDigits(value?: string): string | undefined {
    if (!value) return undefined;
    const digits = value.replace(/\D/g, "");
    return digits || undefined;
}

export function brMoneyToNumber(value?: string): number | undefined {
    if (!value) return undefined;

    const cleaned = value
        .replace(/[^\d,.-]/g, "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim();

    const num = Number(cleaned);
    return Number.isNaN(num) ? undefined : num;
}

export function parseBrazilianDateTime(value?: string): string | undefined {
    if (!value) return undefined;

    const match = value.match(
        /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/
    );

    if (!match) return value;

    const [, dd, mm, yyyy, hh, mi, ss] = match;
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}-03:00`;
}

export function extractAccessKey(text: string, url: string): string | undefined {
    // 1. Procurar no URL por parâmetros específicos ou sequência de 44 dígitos
    const urlMatch = url.match(/p=(\d{44})/i) || 
                     url.match(/chNFe=(\d{44})/i) || 
                     url.match(/(\d{44})/);
    
    if (urlMatch) return urlMatch[1] || urlMatch[0];

    // 2. Procurar no texto por "Chave de acesso"
    const textMatch = text.match(/Chave\s+de\s+acesso:?\s*([\d\s\.]+)/i);
    if (textMatch) {
        const cleaned = onlyDigits(textMatch[1]);
        if (cleaned && (cleaned.length === 44 || cleaned.length === 47)) {
            return cleaned.substring(0, 44);
        }
    }

    // 3. Fallback: procurar sequencia de 44 digitos em todo o texto (sem espaços)
    const fallbackMatch = text.replace(/\s+/g, "").match(/\d{44}/);
    return fallbackMatch?.[0];
}