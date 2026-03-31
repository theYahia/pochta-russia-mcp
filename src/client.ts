const BASE_URL = "https://otpravka-api.pochta.ru/1.0";
const TRACKING_URL = "https://tracking.russianpost.ru/rtm34";
const TIMEOUT = 15_000;

export interface PochtaAuth {
  token: string;
  key: string;
}

function getAuth(): PochtaAuth {
  // New env: POCHTA_TOKEN + POCHTA_KEY
  const token = process.env.POCHTA_TOKEN ?? "";
  const key = process.env.POCHTA_KEY ?? "";

  // Backward compat: POCHTA_LOGIN + POCHTA_PASSWORD + POCHTA_TOKEN
  const login = process.env.POCHTA_LOGIN ?? "";
  const password = process.env.POCHTA_PASSWORD ?? "";

  if (token && key) {
    return { token, key };
  }
  if (login && password && token) {
    return {
      token,
      key: "Basic " + Buffer.from(`${login}:${password}`).toString("base64"),
    };
  }

  throw new Error(
    "Требуется авторизация. Укажите POCHTA_TOKEN + POCHTA_KEY, " +
    "либо POCHTA_LOGIN + POCHTA_PASSWORD + POCHTA_TOKEN. " +
    "Получите их в личном кабинете: https://otpravka.pochta.ru/"
  );
}

export class PochtaClient {
  private auth: PochtaAuth;

  constructor(auth?: PochtaAuth) {
    this.auth = auth ?? getAuth();
  }

  async get(path: string, params?: Record<string, string>): Promise<unknown> {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request("GET", `${path}${query}`);
  }

  async post(path: string, body?: unknown): Promise<unknown> {
    return this.request("POST", path, body);
  }

  private async request(method: string, path: string, body?: unknown): Promise<unknown> {
    const url = `${BASE_URL}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    // Determine Authorization header
    const authorization = this.auth.key.startsWith("Basic ")
      ? this.auth.key
      : `AccessToken ${this.auth.key}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Authorization": authorization,
          "X-User-Authorization": `accessToken ${this.auth.token}`,
          "Content-Type": "application/json",
          "Accept": "application/json;charset=UTF-8",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        const text = await response.text();
        let errMsg = `Почта России HTTP ${response.status}`;
        try {
          const parsed = JSON.parse(text);
          if (parsed.desc) errMsg += `: ${parsed.desc}`;
          else if (parsed.message) errMsg += `: ${parsed.message}`;
          else errMsg += `: ${text}`;
        } catch {
          errMsg += `: ${text}`;
        }
        throw new Error(errMsg);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timer);
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("Почта России: таймаут запроса (15 секунд). Попробуйте позже.");
      }
      throw error;
    }
  }

  async trackByBarcode(barcode: string): Promise<unknown> {
    const login = process.env.POCHTA_LOGIN ?? "";
    const password = process.env.POCHTA_PASSWORD ?? "";

    // Tracking SOAP API needs login/password
    if (!login || !password) {
      // Fallback: use REST tracking endpoint
      return this.get(`/shipment/search?query=${encodeURIComponent(barcode)}`);
    }

    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
  xmlns:oper="http://russianpost.org/operationhistory"
  xmlns:data="http://russianpost.org/operationhistory/data"
  xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope">
  <soap:Header/>
  <soap:Body>
    <oper:getOperationHistory>
      <data:OperationHistoryRequest>
        <data:Barcode>${barcode}</data:Barcode>
        <data:MessageType>0</data:MessageType>
        <data:Language>RUS</data:Language>
      </data:OperationHistoryRequest>
      <data:AuthorizationHeader soapenv:mustUnderstand="1">
        <data:login>${login}</data:login>
        <data:password>${password}</data:password>
      </data:AuthorizationHeader>
    </oper:getOperationHistory>
  </soap:Body>
</soap:Envelope>`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const response = await fetch(TRACKING_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/soap+xml;charset=UTF-8",
        },
        body: soapBody,
        signal: controller.signal,
      });
      clearTimeout(timer);

      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Почта России (трекинг) HTTP ${response.status}: ${text}`);
      }

      return this.parseSoapTracking(text, barcode);
    } catch (error) {
      clearTimeout(timer);
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("Почта России: таймаут запроса отслеживания. Попробуйте позже.");
      }
      throw error;
    }
  }

  private parseSoapTracking(xml: string, barcode: string): unknown {
    const events: Array<Record<string, string>> = [];
    const itemRegex = /<historyRecord>([\s\S]*?)<\/historyRecord>/g;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xml)) !== null) {
      const block = match[1];
      const operType = this.extractTag(block, "OperType", "Name");
      const operAttr = this.extractTag(block, "OperAttr", "Name");
      const operDate = this.extractSimpleTag(block, "OperDate");
      const address = this.extractTag(block, "OperationAddress", "Description") ||
                      this.extractSimpleTag(block, "Description");

      events.push({
        операция: operType || "Неизвестно",
        атрибут: operAttr || "",
        дата: operDate || "",
        место: address || "",
      });
    }

    if (events.length === 0) {
      return { трек_номер: barcode, сообщение: "Информация об отправлении не найдена." };
    }

    const last = events[events.length - 1];
    return {
      трек_номер: barcode,
      последний_статус: last,
      все_события: events,
    };
  }

  private extractTag(block: string, parentTag: string, childTag: string): string | null {
    const openTag = "<" + parentTag + ">";
    const closeTag = "</" + parentTag + ">";
    const start = block.indexOf(openTag);
    if (start === -1) return null;
    const end = block.indexOf(closeTag, start);
    if (end === -1) return null;
    const inner = block.substring(start + openTag.length, end);
    return this.extractSimpleTag(inner, childTag);
  }

  private extractSimpleTag(block: string, tag: string): string | null {
    const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`);
    const match = regex.exec(block);
    return match ? match[1] : null;
  }
}
