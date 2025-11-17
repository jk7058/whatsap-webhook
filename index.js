const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// ===== Replace with your details =====
const TOKEN = "EAALPKL3YVj0BP185dBEzOduuvc6sxXhH5ubAUdrX9ZAmDHQHEVYdTMjyZBNQP21KYIVgIM5RFyeaLVVjJ4DRJt2PONZADZAFgRD2tZBZA8kw0a9O8BskFEjRWJ6vPRIv6wZBLsvp7xbfXOZBcB0M585P9HoDqMscZBnLtkE18FZCiyz0b6rstZAlDqerzdkhgX1myZClDahjuIdSSejLRyrgqIbmMvxJ0fFrI6lzHnaE47BEGnopvAZDZD";
const PHONE_NUMBER_ID = "899206953271570";
// =====================================

// Auto-reply message
const autoReply = "Hello 👋\nThank you for messaging us!\n\nThis is our demo auto-reply bot.";

// Webhook endpoint
app.post("/webhook", async (req, res) => {
    try {
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const message = changes?.value?.messages?.[0];

        if (!message) return res.sendStatus(200);

        const from = message.from; // user number
        const text = message.text?.body || "";

        console.log("Incoming message:", text);

        // Send Auto Reply
        await axios.post(
            `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: from,
                type: "text",
                text: { body: autoReply }
            },
            {
                headers: { Authorization: `Bearer ${TOKEN}` }
            }
        );

        console.log("Auto reply sent to:", from);
    } catch (err) {
        console.log("Error:", err.response?.data || err.message);
    }

    return res.sendStatus(200);
});

// Webhook verify endpoint
app.get("/webhook", (req, res) => {
    const VERIFY_TOKEN = "testtoken";
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
});

app.listen(8000, () => console.log("Bot running on port 8000"));
