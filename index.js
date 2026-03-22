const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const EMAIL = "kairostransportes9@gmail.com";
const TOKEN = "98bb80fc-7815-4922-9a81-b2fefb95a5490430f04847768bdf005cd17ac3e850e6e540-5b6b-428f-9279-9c3c04f01996";

const BASE_URL = "https://ws.pagseguro.uol.com.br/v2/transactions";

// ===============================
// 🔹 CRIAR PAGAMENTO PIX
// ===============================
app.post("/criar-pagamento", async (req, res) => {
  const { valor, descricao } = req.body;

  try {
    const response = await axios.post(
      BASE_URL,
      email=${EMAIL}&token=${TOKEN}&paymentMode=default&paymentMethod=pix&currency=BRL&itemId1=1&itemDescription1=${descricao}&itemAmount1=${valor}&itemQuantity1=1,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    res.send(response.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send("Erro ao criar pagamento");
  }
});

// ===============================
// 🔹 VERIFICAR PAGAMENTO
// ===============================
app.get("/verificar-pagamento/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const response = await axios.get(
      ${BASE_URL}/${id}?email=${EMAIL}&token=${TOKEN}
    );

    const status = response.data.status;

    res.send({
      status: status,
      pago: status === "3", // 3 = pago
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send("Erro ao verificar pagamento");
  }
});

// ===============================
// 🔹 SERVIDOR
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
