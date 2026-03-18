const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

/*
COLE SUA API KEY ASAAS ENTRE AS ASPAS ABAIXO
*/
const ASAAS_API_KEY = "$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmZkNGY5NGE2LTk5N2EtNGExMy04MzFjLWQ1MmE3YTY3NjgzYjo6JGFhY2hfYTcwMzRmMTQtMzNhZi00MWI1LWE2YTUtMzAzMDY0MWE1NjZk";

exports.kairos_webhook = functions.https.onRequest(async (req, res) => {

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

      const ride = rideDoc.data();

      const driverId = ride.driverId;
      const price = ride.price;

      await rideRef.update({
        paymentStatus: "paid",
        paidAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const driverDoc = await admin.firestore()
        .collection("drivers")
        .doc(driverId)
        .get();

      if (!driverDoc.exists) {
        return res.status(200).send("Driver not found");
      }

      const driver = driverDoc.data();

      const pixKey = driver.pixKey;

      if (!pixKey) {
        console.log("Motorista sem chave PIX");
        return res.status(200).send("Driver without pixKey");
      }

      const driverValue = price * 0.90;

      await axios.post(
        "https://api.asaas.com/v3/transfers",
        {
          value: driverValue,
          pixAddressKey: pixKey,
          description: "Repasse automático corrida Kairós"
        },
        {
          headers: {
            access_token: ASAAS_API_KEY,
            "Content-Type": "application/json"
          }
        }
      );

      console.log("Repasse enviado automaticamente");

    }

    res.status(200).send("OK");

  } catch (error) {

    console.error("Erro webhook:", error);

    res.status(500).send("Erro");

  }

});