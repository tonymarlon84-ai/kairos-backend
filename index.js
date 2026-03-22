const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

const EMAIL = "kairostransportes9@gmail.com";
const TOKEN = "98bb80fc-7815-4922-9a81-b2fefb95a5490430f04847768bdf005cd17ac3e850e6e540-5b6b-428f-9279-9c3c04f01996";

// Criar pagamento
app.post("/criar-pagamento", async (req, res) => {
  const { valor, descricao } = req.body;

  try {
    const response = await axios.post(
      "https://ws.pagseguro.uol.com.br/v2/transactions",
      email=${EMAIL}&token=${TOKEN}&paymentMode=default&paymentMethod=pix&currency=BRL&itemId1=1&itemDescription1=${descricao}&itemAmount1=${valor}&itemQuantity1=1,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    res.send(response.data);
  } catch (error) {
    res.status(500).send(error.response?.data || error.message);
  }
});

app.listen(3000, () => console.log("Servidor rodando"));
