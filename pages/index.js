// pages/index.js
import { useState } from "react";

export default function Home() {
  const [busca, setBusca] = useState("");
  const [produtos, setProdutos] = useState([]);
  const [resposta, setResposta] = useState("");
  const [loading, setLoading] = useState(false);

  const pesquisar = async () => {
    if (!busca.trim()) return;
    setLoading(true);
    setProdutos([]);
    setResposta("");
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(busca)}`);
      const data = await res.json();
      setProdutos(data.produtos || []);
      setResposta(data.recomendacao || "");
    } catch {
      setResposta("Erro ao buscar produtos.");
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f7f9fc;
          margin: 0; padding: 0;
          display: flex;
          justify-content: center;
          min-height: 100vh;
          align-items: flex-start;
          padding-top: 50px;
        }
        .container {
          max-width: 700px;
          width: 90%;
          background: white;
          box-shadow: 0 0 15px rgb(0 0 0 / 0.1);
          border-radius: 8px;
          padding: 30px 40px;
        }
        h1 {
          margin-bottom: 20px;
          color: #222;
          text-align: center;
        }
        input {
          width: 100%;
          padding: 12px 15px;
          border: 1.5px solid #ccc;
          border-radius: 6px;
          font-size: 16px;
          transition: border-color 0.3s;
          margin-bottom: 15px;
        }
        input:focus {
          outline: none;
          border-color: #0057ff;
          box-shadow: 0 0 8px rgba(0,87,255,0.3);
        }
        button {
          width: 100%;
          background: #0057ff;
          border: none;
          color: white;
          font-size: 16px;
          padding: 14px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.3s;
          margin-bottom: 25px;
        }
        button:disabled {
          background: #aac4ff;
          cursor: not-allowed;
        }
        ul {
          list-style: none;
          padding-left: 0;
          max-height: 350px;
          overflow-y: auto;
          margin-bottom: 20px;
        }
        li {
          padding: 10px 0;
          border-bottom: 1px solid #eee;
          font-size: 15px;
        }
        li a {
          color: #0057ff;
          text-decoration: none;
        }
        li a:hover {
          text-decoration: underline;
        }
        .loading-bar {
          position: fixed;
          top: 0;
          left: 0;
          height: 3px;
          width: 100%;
          background: linear-gradient(90deg, #0057ff 0%, #00c6ff 50%, #0057ff 100%);
          animation: loadingAnim 1.4s infinite;
          z-index: 9999;
        }
        @keyframes loadingAnim {
          0% {
            background-position: 0% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .resposta-ia {
          background: #e3f2fd;
          border-left: 4px solid #0057ff;
          padding: 15px 20px;
          border-radius: 5px;
          font-style: italic;
          color: #003a75;
          margin-bottom: 20px;
          min-height: 50px;
        }
      `}</style>

      <div className="container">
        <h1>🔎 Comparador de Preços com IA</h1>

        <input
          type="text"
          placeholder="Digite o nome do produto..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") pesquisar(); }}
          disabled={loading}
        />
        <button onClick={pesquisar} disabled={loading || !busca.trim()}>
          {loading ? "Buscando..." : "Pesquisar"}
        </button>

        {loading && <div className="loading-bar" aria-label="Carregando" />}

        {resposta && !loading && (
          <div className="resposta-ia" aria-live="polite">{resposta}</div>
        )}

        <ul>
          {produtos.map((p, i) => (
            <li key={i}>
              <a href={p.link} target="_blank" rel="noopener noreferrer">
                [{p.site}] {p.title} - R$ {p.price.toFixed(2)}
              </a>
            </li>
          ))}
          {!loading && produtos.length === 0 && busca.trim() !== "" && (
            <li>Nenhum produto encontrado.</li>
          )}
        </ul>
      </div>
    </>
  );
}
