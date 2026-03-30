const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// 🔐 TOKEN PAGSEGURO
const TOKEN = process.env.TOKEN;

// 🔥 BANCO TEMPORÁRIO
const pagamentos = {};

// ===============================
// 🔥 PING
// ===============================
app.get("/ping", (req, res) => {
  res.send("ok");
});

// ===============================
// 🔹 CRIAR PIX (REAL)
// ===============================
app.post("/criar-pix", async (req, res) => {
  const { valor, rideId } = req.body;

  if (!valor || !rideId) {
    return res.status(400).json({
      erro: "valor e rideId obrigatórios"
    });
  }

  try {

    const response = await axios.post(
      "https://api.pagseguro.com/orders",
      {
        reference_id: rideId,
        notification_urls: [
          "https://kairos-backend-o48s.onrender.com/webhook"
        ],
        items: [
          {
            name: "Corrida",
            quantity: 1,
            unit_amount: Math.round(valor * 100)
          }
        ],
        charges: [
          {
            reference_id: rideId,
            description: "Corrida Kairós",
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
          Authorization: "Bearer " + TOKEN,
          "Content-Type": "application/json"
        }
      }
    );

    const charge = response.data.charges[0];
    const pix = charge.payment_method.qr_codes[0];

    // 🔥 SALVA PAGAMENTO
    pagamentos[rideId] = {
      status: "pendente",
      chargeId: charge.id,
      valor: valor
    };

    res.json({
      qrCode: pix.text
    });

  } catch (error) {
    console.error(error.response?.data || error.message);

    res.status(500).json({
      erro: "Erro ao gerar PIX"
    });
  }
});

// ===============================
// 🔥 WEBHOOK PAGSEGURO (AUTOMÁTICO)
// ===============================
app.post("/webhook", async (req, res) => {

  try {

    const data = req.body;

    const chargeId = data.id;

    // 🔥 BUSCA QUAL CORRIDA É
    const ride = Object.keys(pagamentos).find(
      key => pagamentos[key].chargeId === chargeId
    );

    if (!ride) return res.sendStatus(200);

    // 🔥 VERIFICA STATUS
    if (data.status === "PAID") {
      pagamentos[ride].status = "pago";
      console.log("Pagamento confirmado:", ride);
    }

    res.sendStatus(200);

  } catch (err) {
    console.error("Erro webhook:", err);
    res.sendStatus(500);
  }
});

// ===============================
// 🔥 STATUS PRO APP
// ===============================
app.get("/status/:rideId", (req, res) => {

  const rideId = req.params.rideId;

  const pagamento = pagamentos[rideId];

  if (!pagamento) {
    return res.json({ status: "nao_encontrado" });
  }

  res.json({
    status: pagamento.status
  });
});

// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
