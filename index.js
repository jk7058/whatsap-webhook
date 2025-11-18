const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// ===== Your WhatsApp API Details =====
const TOKEN = "EAALPKL3YVj0BPZCkjgqkMlm3oTNJloskmdOVDTsxZBahbnvPQFPuWcN6urpWYZCPLbcdu70ZAqndAUQUZBUn5QDdaHI3GKU07ZCBVi9X572PN0inyOHyIQJJYZCQmheZC0emxoQBaD9JcmNk5AQhbDWjtYQffqy3qvvWSdkCmENPZAliTnkORKzG2i9kEwW9lajg7oZCvqUbOOfhC7o2obsJi2svUSNXOdw5RTx34XE9DbVThbj5d7ScmwzqBV12z6mDXQWyoeAq5kxJ11JwP6h3DvqkXZB";
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
  const isMarathi = lang === "marathi";

  const title = isMarathi
    ? "कृपया खालीलपैकी सेवा निवडा"
    : "Please choose a service";

  const footer = isMarathi
    ? "जिल्हा परिषद औरंगाबाद"
    : "Zila Parishad Aurangabad";

  const button = isMarathi ? "सेवा निवडा" : "Select Service";

  // SERVICE LISTS IN BOTH LANGUAGES
  const rows = isMarathi
    ? [
        { id: "student_services", title: "🧑‍🎓 विद्यार्थी सेवा", description: "शिष्यवृत्ती, प्रमाणपत्रे" },
        { id: "farmer_services", title: "🚜 शेतकरी सेवा", description: "योजना, माती तपासणी" },
        { id: "health_services", title: "🚑 आरोग्य सेवा", description: "PHC, अँब्युलन्स 102" },
        { id: "complaints", title: "🛑 तक्रार नोंद", description: "आपली समस्या नोंदवा" }
      ]
    : [
        { id: "student_services", title: "🧑‍🎓 Student Services", description: "Scholarships, Certificates" },
        { id: "farmer_services", title: "🚜 Agriculture Services", description: "Schemes, Soil Test" },
        { id: "health_services", title: "🚑 Health & Hospitals", description: "PHC, Ambulance" },
        { id: "complaints", title: "🛑 File Complaint", description: "Register grievance" }
      ];

  const json = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: title },
      footer: { text: footer },
      action: {
        button,
        sections: [
          {
            title: isMarathi ? "नागरिक सेवा" : "Citizen Services",
            rows
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
  const msg = lang === "marathi"
    ? "🎓 *विद्यार्थी सेवा*\n\n" +
      "• शिष्यवृत्ती माहिती\n" +
      "• जात / निवास प्रमाणपत्र\n" +
      "• परीक्षा निकाल\n\n" +
      "📌 *मेनूसाठी 'menu' लिहा*"
    : "🎓 *Student Services*\n\n" +
      "• Scholarship Information\n" +
      "• Certificates (Caste / Residence)\n" +
      "• Exam Results\n\n" +
      "📌 Type *menu* to return to main menu";

  await sendText(to, msg);
}

async function handleFarmer(to, lang) {
  const msg = lang === "marathi"
    ? "🚜 *शेतकरी सेवा*\n\n" +
      "• पीएम किसान स्थिती\n" +
      "• माती तपासणी केंद्र\n" +
      "• कृषी सल्ला\n\n" +
      "📌 *मेनूसाठी 'menu' लिहा*"
    : "🚜 *Farmer Services*\n\n" +
      "• PM-Kisan Status\n" +
      "• Soil Testing Centers\n" +
      "• Crop Advisory\n\n" +
      "📌 Type *menu* to return to main menu";

  await sendText(to, msg);
}

async function handleHealth(to, lang) {
  const msg = lang === "marathi"
    ? "🚑 *आरोग्य सेवा*\n\n" +
      "• PHC (प्राथमिक आरोग्य केंद्र) यादी\n" +
      "• अँब्युलन्स सेवा – 102\n" +
      "• लसीकरण केंद्र माहिती\n\n" +
      "📌 *मेनूसाठी 'menu' लिहा*"
    : "🚑 *Health Services*\n\n" +
      "• PHC List\n" +
      "• Ambulance – 102\n" +
      "• Vaccination Centers\n\n" +
      "📌 Type *menu* to return to main menu";

  await sendText(to, msg);
}


async function handleComplaint(to, lang) {
  const msg = lang === "marathi"
    ? "🛑 *तक्रार नोंद*\n\n" +
      "कृपया खालील माहिती पाठवा:\n" +
      "• नाव\n• क्षेत्र\n• तक्रारीचे तपशील\n\n" +
      "📌 आमची टीम लवकरच संपर्क करेल."
    : "🛑 *File Complaint*\n\n" +
      "Please send the following details:\n" +
      "• Name\n• Area\n• Complaint Details\n\n" +
      "📌 Our team will contact you soon.";

  await sendText(to, msg);
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
