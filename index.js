const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// 🔐 TOKEN PAGSEGURO (Bearer Token novo)
const TOKEN = process.env.TOKEN;

// ===============================
// 🔹 CRIAR PIX (API NOVA)
// ===============================
app.post("/criar-pix", async (req, res) => {
  const { valor } = req.body;

  try {
    const response = await axios.post(
      "https://api.pagseguro.com/orders",
      {
        reference_id: "corrida_kairos",
        customer: {
          name: "Cliente",
          email: "cliente@email.com",
          tax_id: "12345678909"
        },
        items: [
          {
            name: "Corrida",
            quantity: 1,
            unit_amount: Math.round(valor * 100)
          }
        ],
        charges: [
          {
            reference_id: "pix_charge",
            description: "Pagamento via Pix",
            amount: {
              value: Math.round(valor * 100),
              currency: "BRL"
            },
            payment_method: {
              type: "PIX",
              expires_in: 300
            }
          }
        ]
      },
      {
        headers: {
          Authorization: Bearer ${TOKEN},
          "Content-Type": "application/json"
        }
      }
    );

    const pix =
      response.data.charges[0].payment_method.qr_codes[0];

    res.json({
      qrCode: pix.text,
      qrCodeBase64: pix.links[0].href
    });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({
      erro: "Erro no backend",
      detalhe: error.response?.data || error.message
    });
  }
});

// ===============================
// 🔹 SERVIDOR
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
