const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// ===== Your WhatsApp API Details =====
const TOKEN = "EAALPKL3YVj0BPZBAmwzQ2nZABMMCZBkA6yqtl1xT6FNluGVU2zPZCW3RgOjHGAHoP7tDQbdjfmaAQYzEDGcJciZBzaeaFanWUKyvHuJg1L3ZBZA1cgqyB0s8HyYe9z2EWXQDZAE7S5MW2C40jax8aI3VIZBofX59yF1jUMpivieCdxkdYgnpH7lZAfptM9xIl2svPncGKiItJFMDPZC8jCf9fRA7nsXCAgtzVmIppmf7t4Fc12oZCsTofvXZAzmHePU77P1iM09ROUav73SZAIYL8q8xhzpWM4";
const PHONE_NUMBER_ID = "899206953271570";
// =====================================

const sessions = new Map();

// Send text message
async function sendText(to, message) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message }
      },
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
  } catch (err) {
    console.log("sendText error:", err.response?.data || err.message);
  }
}



// Send language buttons
async function sendLanguageButtons(to) {
  const json = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: "Select your language / कृपया भाषा निवडा" },
      action: {
        buttons: [
          { type: "reply", reply: { id: "lang_marathi", title: "मराठी" } },
          { type: "reply", reply: { id: "lang_english", title: "English" } }
        ]
      }
    }
  };

  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      json,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
  } catch (err) {
    console.log("Language error:", err.response?.data || err.message);
  }
}

// Send main menu
async function sendMainMenu(to, lang = "english") {
  const title = lang === "marathi" ? "कृपया सेवा निवडा" : "Please choose a service";

  const json = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: title },
      footer: { text: "Zila Parishad Aurangabad" },
      action: {
        button: lang === "marathi" ? "सेवा निवडा" : "Select Service",
        sections: [
          {
            title: "Citizen Services",
            rows: [
              { id: "student_services", title: "🧑‍🎓 Student Services" },
              { id: "farmer_services", title: "🚜 Agriculture Services" },
              { id: "health_services", title: "🚑 Health & Hospitals" },
              { id: "complaints", title: "🛑 File Complaint" }
            ]
          }
        ]
      }
    }
  };

  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      json,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
  } catch (err) {
    console.log("Menu error:", err.response?.data || err.message);
  }
}


// ---------------- MESSAGE HANDLERS ----------------

async function handleStudent(to, lang) {
  await sendText(
    to,
    lang === "marathi"
      ? "🎓 विद्यार्थी सेवा:\n- शिष्यवृत्ती\n- प्रमाणपत्रे\n- परीक्षा"
      : "🎓 Student Services:\n- Scholarships\n- Certificates\n- Results"
  );
}

async function handleFarmer(to, lang) {
  await sendText(
    to,
    lang === "marathi"
      ? "🚜 शेतकरी सेवा:\n- पीएम किसान\n- माती तपासणी केंद्र"
      : "🚜 Farmer Services:\n- PM Kisan\n- Soil Test Centers"
  );
}

async function handleHealth(to, lang) {
  await sendText(
    to,
    lang === "marathi"
      ? "🚑 आरोग्य सेवा:\n- PHC यादी\n- अँब्युलन्स 102"
      : "🚑 Health Services:\n- PHC List\n- Ambulance 102"
  );
}

async function handleComplaint(to, lang) {
  await sendText(
    to,
    lang === "marathi"
      ? "🛑 तक्रार नोंद: कृपया नाव, क्षेत्र, समस्या पाठवा."
      : "🛑 File Complaint: Please send Name, Area, Issue."
  );
}



app.post("/webhook", async (req, res) => {
  try {
    const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg) return res.sendStatus(200);

    const from = msg.from;
    const type = msg.type;
    const session = sessions.get(from) || {};

    // TEXT
    if (type === "text") {
      const text = msg.text.body.toLowerCase();

      if (text === "hi" || text === "hello" || text === "menu") {
        await sendLanguageButtons(from);
        return res.sendStatus(200);
      }

      if (!session.lang) {
        await sendLanguageButtons(from);
        return res.sendStatus(200);
      }

      await sendText(from, "Type 'menu' to see services.");
      return res.sendStatus(200);
    }

    // INTERACTIVE
    if (type === "interactive") {
      const interactive = msg.interactive;

      if (interactive.type === "button_reply") {
        const id = interactive.button_reply.id;

        if (id === "lang_marathi") {
          sessions.set(from, { lang: "marathi" });
          await sendMainMenu(from, "marathi");
        }

        if (id === "lang_english") {
          sessions.set(from, { lang: "english" });
          await sendMainMenu(from, "english");
        }

        return res.sendStatus(200);
      }

      if (interactive.type === "list_reply") {
        const id = interactive.list_reply.id;
        const lang = session.lang || "english";

        if (id === "student_services") await handleStudent(from, lang);
        if (id === "farmer_services") await handleFarmer(from, lang);
        if (id === "health_services") await handleHealth(from, lang);
        if (id === "complaints") await handleComplaint(from, lang);

        return res.sendStatus(200);
      }
    }
  } catch (e) {
    console.log("Webhook error:", e.response?.data || e.message);
  }

  res.sendStatus(200);
});






// Webhook endpoint
// app.post("/webhook", async (req, res) => {
//     try {
//         const entry = req.body.entry?.[0];
//         const changes = entry?.changes?.[0];
//         const message = changes?.value?.messages?.[0];

//         // Ignore delivery/read/status updates
//         if (!message || !message.text) {
//             return res.sendStatus(200);
//         }

//         const from = message.from;
//         const text = message.text.body;

//         console.log("Incoming message:", text);

//         // Send Auto Reply
//         await axios.post(
//             `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
//             {
//                 messaging_product: "whatsapp",
//                 to: from,
//                 type: "text",
//                 text: { body: autoReply }
//             },
//             {
//                 headers: { Authorization: `Bearer ${TOKEN}` }
//             }
//         );

//         console.log("Auto reply sent to:", from);

//     } catch (err) {
//         console.log("Error:", err.response?.data || err.message);
//     }

//     return res.sendStatus(200);
// });


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
