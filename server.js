const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const STATUS_VALIDOS = ["perdido", "encontrado", "devolvido"];

// "Banco de dados" em memória
let objetos = [
  { id: 1, descricao: "Carteira preta de couro", local: "Biblioteca", data: "2026-10-01", status: "perdido" },
  { id: 2, descricao: "Guarda-chuva azul", local: "Cantina", data: "2026-10-03", status: "encontrado" }
];
let proximoId = 3;

// Valida os campos do objeto. Se parcial = true, só valida os campos enviados.
function validar(body, parcial = false) {
  const erros = [];
  const { descricao, local, data, status } = body;

  if (!parcial || descricao !== undefined) {
    if (typeof descricao !== "string" || !descricao.trim()) erros.push("descricao é obrigatória");
  }
  if (!parcial || local !== undefined) {
    if (typeof local !== "string" || !local.trim()) erros.push("local é obrigatório");
  }
  if (!parcial || data !== undefined) {
    if (typeof data !== "string" || isNaN(Date.parse(data))) erros.push("data inválida (use AAAA-MM-DD)");
  }
  if (!parcial || status !== undefined) {
    if (!STATUS_VALIDOS.includes(status)) erros.push(`status deve ser: ${STATUS_VALIDOS.join(", ")}`);
  }
  return erros;
}

// Lê o id da query (?id=) ou do corpo da requisição
function obterId(req) {
  const id = Number(req.query.id ?? req.body?.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /objetos -> lista todos
app.get("/objetos", (req, res) => {
  res.json(objetos);
});

// GET /objeto?id=1 -> obtém um objeto
app.get("/objeto", (req, res) => {
  const id = obterId(req);
  if (!id) return res.status(400).json({ erro: "Informe um id válido. Ex.: /objeto?id=1" });

  const objeto = objetos.find(o => o.id === id);
  if (!objeto) return res.status(404).json({ erro: "Objeto não encontrado" });

  res.json(objeto);
});

// POST /objeto -> cadastra um objeto
app.post("/objeto", (req, res) => {
  const erros = validar(req.body);
  if (erros.length) return res.status(400).json({ erros });

  const { descricao, local, data, status } = req.body;
  const novo = { id: proximoId++, descricao: descricao.trim(), local: local.trim(), data, status };
  objetos.push(novo);

  res.status(201).json(novo);
});

// PUT /objeto?id=1 (ou id no corpo) -> atualiza um objeto
app.put("/objeto", (req, res) => {
  const id = obterId(req);
  if (!id) return res.status(400).json({ erro: "Informe um id válido (na query ?id= ou no corpo)" });

  const objeto = objetos.find(o => o.id === id);
  if (!objeto) return res.status(404).json({ erro: "Objeto não encontrado" });

  const erros = validar(req.body, true);
  if (erros.length) return res.status(400).json({ erros });

  const { descricao, local, data, status } = req.body;
  if (descricao !== undefined) objeto.descricao = descricao.trim();
  if (local !== undefined) objeto.local = local.trim();
  if (data !== undefined) objeto.data = data;
  if (status !== undefined) objeto.status = status;

  res.json(objeto);
});

// DELETE /objeto?id=1 (ou id no corpo) -> exclui um objeto
app.delete("/objeto", (req, res) => {
  const id = obterId(req);
  if (!id) return res.status(400).json({ erro: "Informe um id válido (na query ?id= ou no corpo)" });

  const indice = objetos.findIndex(o => o.id === id);
  if (indice === -1) return res.status(404).json({ erro: "Objeto não encontrado" });

  const [removido] = objetos.splice(indice, 1);
  res.json({ mensagem: "Objeto excluído com sucesso", objeto: removido });
});

app.listen(PORT, () => {
  console.log(`API Achados e Perdidos rodando em http://localhost:${PORT}`);
});
