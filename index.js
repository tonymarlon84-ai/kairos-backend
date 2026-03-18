const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// 🔑 SUA CHAVE ASAAS (JÁ INCLUSA)
const ASAAS_API_KEY = "$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmMwYTdlMDFjLTJkZjYtNDJhMC1iZTZhLTk1MjkwMjc3YzRlOTo6JGFhY2hfZWU2NWIxODAtMGQxMS00N2UwLWEwOWUtMGFiNDRjZDNkMGY0";

// 🌐 URL BASE ASAAS
const ASAAS_URL = "https://api.asaas.com/v3";

// 🚀 CRIAR COBRANÇA PIX
app.post("/criar-pagamento", async (req, res) => {
  try {
    const { name, cpfCnpj, value } = req.body;

    const cliente = await axios.post(
      ${ASAAS_URL}/customers,
      {
        name: name,
        cpfCnpj: cpfCnpj
      },
      {
        headers: {
          access_token: ASAAS_API_KEY
        }
      }
    );

    const pagamento = await axios.post(
      ${ASAAS_URL}/payments,
      {
        customer: cliente.data.id,
        billingType: "PIX",
        value: value,
        dueDate: new Date().toISOString().split("T")[0]
      },
      {
        headers: {
          access_token: ASAAS_API_KEY
        }
      }
    );

    const qr = await axios.get(
      ${ASAAS_URL}/payments/${pagamento.data.id}/pixQrCode,
      {
        headers: {
          access_token: ASAAS_API_KEY
        }
      }
    );

    res.json({
      success: true,
      paymentId: pagamento.data.id,
      qrCode: qr.data.payload,
      qrImage: qr.data.encodedImage
    });

  } catch (error) {
    console.log("ERRO:", error.response?.data || error.message);
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
});

// 🔔 WEBHOOK
app.post("/webhook", (req, res) => {
  const data = req.body;

  console.log("WEBHOOK RECEBIDO:", data);

  if (data.event === "PAYMENT_RECEIVED") {
    console.log("💰 PAGAMENTO RECEBIDO!");
  }

  res.sendStatus(200);
});

// 🚀 START
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
