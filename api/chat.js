import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { mensagem } = req.body;

  if (!mensagem) {
    return res.status(400).json({ error: "Mensagem é obrigatória" });
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o", // você pode trocar por gpt-3.5-turbo se quiser
        messages: [{ role: "user", content: mensagem }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const resposta = response.data.choices[0].message.content;
    res.status(200).json({ resposta });
  } catch (error) {
    console.error("Erro na requisição OpenAI:", error?.response?.data || error.message);
    res.status(500).json({ error: "Erro na comunicação com a OpenAI." });
  }
}
