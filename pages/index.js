
import { useState } from 'react';

export default function Home() {
  const [busca, setBusca] = useState("");
  const [produtos, setProdutos] = useState([]);
  const [resposta, setResposta] = useState("");
  const [loading, setLoading] = useState(false);

  const pesquisar = async () => {
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(busca)}`);
    const data = await res.json();
    setProdutos(data.produtos);
    setResposta(data.recomendacao);
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🔎 Comparador de Preços com IA</h1>
      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Digite o nome do produto"
      />
      <button onClick={pesquisar} disabled={loading || !busca}>
        {loading ? "Buscando..." : "Pesquisar"}
      </button>

      {resposta && <p><strong>🤖 IA:</strong> {resposta}</p>}

      <ul>
        {produtos.map((p, i) => (
          <li key={i}>
            <a href={p.link} target="_blank" rel="noopener noreferrer">
              {p.title} - R$ {p.price.toFixed(2)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
