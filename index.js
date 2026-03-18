const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// 🔑 VEM DO RENDER (SEM QUEBRAR NADA)
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

app.get("/", (req, res) => {
  res.send("API ONLINE");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando");
});
