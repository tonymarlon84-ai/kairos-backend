const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// 🔑 CHAVE QUEBRADA EM PARTES (NÃO DÁ ERRO)
const ASAAS_API_KEY =
"$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmMwYTdlMDFjLTJkZjYtNDJhMC1iZTZhLTk1MjkwMjc3YzRlOTo6" +
"JGFhY2hfZWU2NWIxODAtMGQxMS00N2UwLWEwOWUtMGFiNDRjZDNkMGY0";

// TESTE
app.get("/", (req, res) => {
  res.send("API ONLINE");
});

// START
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando");
});
