const express = require("express");
const axios = require("axios");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();
app.use(express.json());
app.use(cors());

// 🔐 PAGSEGURO
const TOKEN = process.env.TOKEN;

// 🔥 FIREBASE ADMIN
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

// ===============================
// 🔥 PING
// ===============================
app.get("/ping", (req, res) => {
  res.send("ok");
});

// ===============================
// 🔹 CRIAR PIX (BLINDADO)
// ===============================
app.post("/criar-pix", async (req, res) => {

  const { rideId } = req.body;

  if (!rideId) {
    return res.status(400).json({ erro: "rideId obrigatório" });
  }

  try {

    // 🔥 BUSCA CORRIDA REAL
    const rideDoc = await firestore.collection("rides").doc(rideId).get();

    if (!rideDoc.exists) {
      return res.status(400).json({ erro: "Corrida não encontrada" });
    }

    const rideData = rideDoc.data();

    // 🔒 VALIDA STATUS
    if (rideData.paymentStatus === "paid") {
      return res.status(400).json({ erro: "Corrida já paga" });
    }

    // 🔒 VALOR VEM DO BANCO (ANTI-FRAUDE)
    const valor = rideData.price;

    if (!valor || valor <= 0) {
      return res.status(400).json({ erro: "Valor inválido" });
    }

    // 🔥 CRIA PIX REAL
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

    // 🔥 SALVA NO FIREBASE
    await firestore.collection("rides").doc(rideId).update({
      paymentStatus: "pending",
      chargeId: charge.id,
      pixCode: pix.text
    });

    res.json({
      qrCode: pix.text
    });

  } catch (error) {
    console.error(error.response?.data || error.message);

    res.status(500).json({
      erro: "Erro ao gerar pagamento"
    });
  }
});

// ===============================
// 🔥 WEBHOOK SEGURO
// ===============================
app.post("/webhook", async (req, res) => {

  try {

    const data = req.body;

    const chargeId = data.id;

    if (!chargeId) return res.sendStatus(200);

    // 🔥 BUSCA NO FIREBASE
    const snapshot = await firestore
      .collection("rides")
      .where("chargeId", "==", chargeId)
      .get();

    if (snapshot.empty) return res.sendStatus(200);

    const doc = snapshot.docs[0];
    const rideId = doc.id;
    const rideData = doc.data();

    // 🔒 VALIDAR VALOR PAGO
    const valorPago = data.amount?.value;
    const valorReal = Math.round(rideData.price * 100);

    if (valorPago !== valorReal) {
      console.log("🚨 FRAUDE DETECTADA:", rideId);
      return res.sendStatus(400);
    }

    // 🔥 CONFIRMA PAGAMENTO
    if (data.status === "PAID") {

      await firestore.collection("rides").doc(rideId).update({
        paymentStatus: "paid",
        paidAt: new Date()
      });

      console.log("✅ Pagamento confirmado:", rideId);
    }

    res.sendStatus(200);

  } catch (err) {
    console.error("Erro webhook:", err);
    res.sendStatus(500);
  }
});

// ===============================
// 🔥 STATUS PARA O APP
// ===============================
app.get("/status/:rideId", async (req, res) => {

  const rideId = req.params.rideId;

  try {

    const rideDoc = await firestore.collection("rides").doc(rideId).get();

    if (!rideDoc.exists) {
      return res.json({ status: "nao_encontrado" });
    }

    const data = rideDoc.data();

    res.json({
      status: data.paymentStatus || "pending"
    });

  } catch (e) {
    res.status(500).json({ status: "erro" });
  }
});

// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
