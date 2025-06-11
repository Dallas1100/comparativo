// pages/index.js (só a função pesquisar e alertas, substitua o atual)
const pesquisar = async () => {
  if (!busca.trim()) return;
  setLoading(true);
  setProdutos([]);
  setResposta("");
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(busca)}`);
    if (!res.ok) {
      const err = await res.json();
      setResposta(`Erro: ${err.error || 'Falha na busca'}`);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setProdutos(data.produtos || []);
    setResposta(data.recomendacao || "");
  } catch {
    setResposta("Erro ao buscar produtos.");
  }
  setLoading(false);
};
