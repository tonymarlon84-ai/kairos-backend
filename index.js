const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 INICIALIZA FIREBASE
admin.initializeApp();

// 🚀 ROTA WEBHOOK (ASAAS)
app.post("/webhook", async (req, res) => {
  try {
    const data = req.body;

    console.log("Webhook recebido:", data);

    if (data.event === "PAYMENT_RECEIVED") {
      const payment = data.payment;
      const rideId = payment.externalReference;

      if (!rideId) {
        return res.status(200).send("Ride not found");
      }

      const rideRef = admin.firestore().collection("rides").doc(rideId);
      const rideDoc = await rideRef.get();

      if (!rideDoc.exists) {
        return res.status(200).send("Ride not found");
      }

      // 🔥 MARCA CORRIDA COMO PAGA (DINHEIRO FICA NA EMPRESA)
      await rideRef.update({
        paymentStatus: "paid",
        paidAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log("Pagamento confirmado e salvo na empresa");
    }

    res.status(200).send("OK");

  } catch (error) {
    console.error("Erro webhook:", error);
    res.status(500).send("Erro");
  }
});

// 🔥 ROTA PRA TESTE (OPCIONAL)
app.get("/", (req, res) => {
  res.send("Servidor Kairos rodando");
});

// 🚀 PORTA (ESSENCIAL PRO RENDER)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
