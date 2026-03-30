const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const TOKEN = process.env.TOKEN;

// 🔥 memória temporária
const pagamentos = {};

// ===============================
app.get("/ping", (req, res) => {
  res.send("ok");
});

// ===============================
app.post("/criar-pix", async (req, res) => {

  const { valor, rideId } = req.body;

  if (!valor || !rideId) {
    return res.status(400).json({ erro: "Dados inválidos" });
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

    // salva temporário
    pagamentos[rideId] = {
      status: "pending",
      valor: valor,
      chargeId: charge.id
    };

    res.json({
      qrCode: pix.text
    });

  } catch (e) {
    res.status(500).json({ erro: "Erro ao gerar PIX" });
  }
});

// ===============================
app.post("/webhook", async (req, res) => {

  try {

    const data = req.body;
    const chargeId = data.id;

    const ride = Object.keys(pagamentos).find(
      key => pagamentos[key].chargeId === chargeId
    );

    if (!ride) return res.sendStatus(200);

    const valorPago = data.amount?.value;
    const valorReal = Math.round(pagamentos[ride].valor * 100);

    // 🔒 valida valor
    if (valorPago !== valorReal) {
      console.log("FRAUDE DETECTADA");
      return res.sendStatus(400);
    }

    if (data.status === "PAID") {
      pagamentos[ride].status = "pago";
      console.log("Pagamento confirmado:", ride);
    }

    res.sendStatus(200);

  } catch (e) {
    res.sendStatus(500);
  }
});

// ===============================
app.get("/status/:rideId", (req, res) => {

  const pagamento = pagamentos[req.params.rideId];

  if (!pagamento) {
    return res.json({ status: "pending" });
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
