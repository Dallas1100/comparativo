import axios from "axios";
import aws4 from "aws4";
import https from "https";

const EBAY_APP_ID = process.env.EBAY_APP_ID || "";
const AMAZON_ACCESS_KEY = process.env.AMAZON_ACCESS_KEY || "";
const AMAZON_SECRET_KEY = process.env.AMAZON_SECRET_KEY || "";
const AMAZON_ASSOCIATE_TAG = process.env.AMAZON_ASSOCIATE_TAG || "";
const AMAZON_REGION = "us-east-1";
const AMAZON_HOST = "webservices.amazon.com";

async function buscarMercadoLivre(query) {
  try {
    const res = await axios.get("https://api.mercadolibre.com/sites/MLB/search", {
      params: { q: query },
    });
    return res.data.results.slice(0, 5).map((p) => ({
      site: "Mercado Livre",
      title: p.title,
      price: p.price,
      link: p.permalink,
    }));
  } catch {
    return [];
  }
}

async function buscarEbay(query) {
  if (!EBAY_APP_ID) return [];
  try {
    const res = await axios.get(
      "https://svcs.ebay.com/services/search/FindingService/v1",
      {
        params: {
          "OPERATION-NAME": "findItemsByKeywords",
          "SERVICE-VERSION": "1.0.0",
          "SECURITY-APPNAME": EBAY_APP_ID,
          "RESPONSE-DATA-FORMAT": "JSON",
          keywords: query,
          "paginationInput.entriesPerPage": 5,
        },
      }
    );
    const items =
      res.data.findItemsByKeywordsResponse?.[0]?.searchResult?.[0]?.item || [];
    return items.map((item) => ({
      site: "eBay",
      title: item.title?.[0] || "Sem título",
      price: parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__) || 0,
      link: item.viewItemURL?.[0] || "#",
    }));
  } catch {
    return [];
  }
}

async function buscarAmazon(query) {
  if (!AMAZON_ACCESS_KEY || !AMAZON_SECRET_KEY || !AMAZON_ASSOCIATE_TAG)
    return [];

  const endpoint = "/paapi5/searchitems";
  const method = "POST";
  const bodyObj = {
    Keywords: query,
    Resources: ["ItemInfo.Title", "Offers.Listings.Price"],
    PartnerTag: AMAZON_ASSOCIATE_TAG,
    PartnerType: "Associates",
    Marketplace: "www.amazon.com",
    SearchIndex: "All",
  };
  const body = JSON.stringify(bodyObj);

  const opts = {
    host: AMAZON_HOST,
    path: endpoint,
    method,
    service: "ProductAdvertisingAPI",
    region: AMAZON_REGION,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Host: AMAZON_HOST,
      "X-Amz-Target": "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
    },
    body,
  };

  aws4.sign(opts, {
    accessKeyId: AMAZON_ACCESS_KEY,
    secretAccessKey: AMAZON_SECRET_KEY,
  });

  return new Promise((resolve) => {
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (!json.ItemsResult?.Items) return resolve([]);
          const items = json.ItemsResult.Items.slice(0, 5);
          const results = items.map((item) => {
            const title = item.ItemInfo?.Title?.DisplayValue || "Sem título";
            const price = item.Offers?.Listings?.[0]?.Price?.Amount || 0;
            const url = item.DetailPageURL || "#";
            return {
              site: "Amazon",
              title,
              price,
              link: url,
            };
          });
          resolve(results);
        } catch {
          resolve([]);
        }
      });
    });
    req.on("error", () => resolve([]));
    req.write(body);
    req.end();
  });
}

export default async function handler(req, res) {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Query vazia" });

  try {
    const [ml, ebay, amazon] = await Promise.all([
      buscarMercadoLivre(query),
      buscarEbay(query),
      buscarAmazon(query),
    ]);
    const produtos = [...ml, ...ebay, ...amazon];

    // OpenAI ChatGPT recomendação
    const openaiRes = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Você é um assistente de compras online." },
          {
            role: "user",
            content: `Esses são os resultados para "${query}": ${JSON.stringify(
              produtos
            )}. Qual a melhor opção e por quê?`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const recomendacao = openaiRes.data.choices?.[0]?.message?.content || "";

    res.status(200).json({ produtos, recomendacao });
  } catch (err) {
    res.status(500).json({ error: err.message || "Erro interno" });
  }
}
