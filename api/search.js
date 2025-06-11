
import axios from 'axios';

export default async function handler(req, res) {
  const query = req.query.q;

  if (!query) return res.status(400).json({ error: 'Query vazia' });

  try {
    const ml = await axios.get('https://api.mercadolibre.com/sites/MLB/search', {
      params: { q: query }
    });

    const produtos = ml.data.results.slice(0, 5).map(p => ({
      site: 'Mercado Livre',
      title: p.title,
      price: p.price,
      link: p.permalink
    }));

    const openai = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'Você é um assistente de compras online.' },
          { role: 'user', content: `Esses são os resultados para "${query}": ${JSON.stringify(produtos)}. Qual a melhor opção?` }
        ]
      })
    });

    const gpt = await openai.json();
    const resposta = gpt.choices[0].message.content;

    res.status(200).json({ produtos, recomendacao: resposta });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
