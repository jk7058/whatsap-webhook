require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// env vars
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'testtoken';
const TOKEN = process.env.WA_TOKEN || ''; // long-lived token
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || ''; // numeric id like 12345...
const PORT = process.env.PORT || 8000;

if (!TOKEN || !PHONE_NUMBER_ID) {
  console.warn('WARN: WA_TOKEN or PHONE_NUMBER_ID missing. Set env vars WA_TOKEN and PHONE_NUMBER_ID');
}

// simple in-memory session store (demo only)
const sessions = new Map(); // key: user phone, value: {lang}

// Utility: send text message
async function sendText(to, text) {
  try {
    await axios.post(
      `https://graph.facebook.com/v24.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text }
      },
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
  } catch (err) {
    console.error('sendText error:', err.response?.data || err.message);
  }
}

// Utility: send button (language selection)
async function sendLanguageButtons(to) {
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: 'Please select language / कृपया भाषा निवडा' },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'lang_marathi', title: 'मराठी' } },
          { type: 'reply', reply: { id: 'lang_english', title: 'English' } }
        ]
      }
    }
  };
  try {
    await axios.post(`https://graph.facebook.com/v24.0/${PHONE_NUMBER_ID}/messages`, payload, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
  } catch (err) {
    console.error('sendLanguageButtons error:', err.response?.data || err.message);
  }
}

// Utility: send main services list
async function sendMainServicesList(to, lang = 'english') {
  const title = lang === 'marathi' ? 'कृपया सेवा निवडा' : 'Please choose a service';
  const footer = lang === 'marathi' ? 'जिल्हा परिषद औरंगाबाद सेवा' : 'Zila Parishad Aurangabad Services';
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: title },
      footer: { text: footer },
      action: {
        button: lang === 'marathi' ? 'सेवा निवडा' : 'Select Service',
        sections: [
          {
            title: lang === 'marathi' ? 'नागरी सेवा' : 'Citizen Services',
            rows: [
              { id: 'student_services', title: '🧑‍🎓 Student Services', description: 'Scholarships, Certificates' },
              { id: 'farmer_services', title: '🚜 Agriculture Services', description: 'Schemes, Soil Test' },
              { id: 'health_services', title: '🚑 Health & Hospitals', description: 'PHC, Ambulance' },
              { id: 'schemes', title: '🧾 Citizen Schemes', description: 'NREGA, Pensions' },
              { id: 'complaints', title: '🛑 File Complaint', description: 'Register grievance' },
              { id: 'contacts', title: '🧭 Department Contacts', description: 'Offices & helplines' }
            ]
          }
        ]
      }
    }
  };

  try {
    await axios.post(`https://graph.facebook.com/v24.0/${PHONE_NUMBER_ID}/messages`, payload, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
  } catch (err) {
    console.error('sendMainServicesList error:', err.response?.data || err.message);
  }
}

// Submenu handlers (simple text replies for demo)
async function handleStudentServices(to, lang) {
  const text =
    lang === 'marathi'
      ? '🎓 Student Services:\n1. Scholarship Info\n2. School Certificates\n3. Results\n\nSend \'menu\' to go back.'
      : '🎓 Student Services:\n1. Scholarship Info\n2. School Certificates\n3. Results\n\nSend \'menu\' to go back.';
  await sendText(to, text);
}

async function handleFarmerServices(to, lang) {
  const text =
    lang === 'marathi'
      ? '🚜 Agriculture Services:\n- PM Kisan Status\n- Soil Test Centers\n- Crop Advice\n\nSend \'menu\' to go back.'
      : '🚜 Agriculture Services:\n- PM Kisan Status\n- Soil Test Centers\n- Crop Advice\n\nSend \'menu\' to go back.';
  await sendText(to, text);
}

async function handleHealthServices(to, lang) {
  const text =
    lang === 'marathi'
      ? '🚑 Health & Hospitals:\n- PHC list\n- Ambulance: 102\n- Vaccination Centers\n\nSend \'menu\' to go back.'
      : '🚑 Health & Hospitals:\n- PHC list\n- Ambulance: 102\n- Vaccination Centers\n\nSend \'menu\' to go back.';
  await sendText(to, text);
}

async function handleComplaints(to, lang) {
  const text =
    lang === 'marathi'
      ? '🛑 File Complaint:\nPlease send details: Name, Area, Issue.\nOur team will respond soon.\nSend \'menu\' to go back.'
      : '🛑 File Complaint:\nPlease send details: Name, Area, Issue.\nOur team will respond soon.\nSend \'menu\' to go back.';
  await sendText(to, text);
}

// process incoming message (single)
async function processMessage(message) {
  // message structure assumptions based on WhatsApp Cloud API
  const from = message.from;
  // maintain session
  const session = sessions.get(from) || {};
  // message may be text or interactive
  if (message.type === 'text') {
    const body = message.text?.body?.trim();
    console.log('Text body:', body);
    if (!body) return;
    const normalized = body.toLowerCase();
    if (normalized === 'hi' || normalized === 'hello' || normalized === 'menu') {
      // fresh greeting or show menu
      await sendLanguageButtons(from);
      return;
    }
    // if session.lang exists and user types keywords like 'student' or 'farmer'
    if (session.lang) {
      if (normalized.includes('student')) return handleStudentServices(from, session.lang);
      if (normalized.includes('farmer') || normalized.includes('agri')) return handleFarmerServices(from, session.lang);
      if (normalized.includes('health')) return handleHealthServices(from, session.lang);
      if (normalized.includes('complaint')) return handleComplaints(from, session.lang);
      // fallback: show menu
      await sendText(from, session.lang === 'marathi' ? 'कृपया खालील मेन्यूमधून सेवा निवडा. / Send \'menu\' to open the menu.' : 'Please choose from the menu. Send \'menu\' to open services.');
      return;
    } else {
      // no language set -> ask language
      await sendLanguageButtons(from);
      return;
    }
  }

  // interactive replies: button or list
  if (message.type === 'interactive') {
    const interactive = message.interactive;
    if (!interactive) return;
    // button reply (language selection)
    if (interactive.type === 'button_reply' || (interactive.type === 'button' && interactive.button)) {
      const buttonId = interactive.button?.id || interactive.button_reply?.id || interactive.button?.payload;
      // set language if it's language button
      if (buttonId === 'lang_marathi' || buttonId === 'lang_english') {
        const lang = buttonId === 'lang_marathi' ? 'marathi' : 'english';
        sessions.set(from, { lang });
        // send main menu in selected language
        await sendText(from, lang === 'marathi' ? 'भाषा निवडली. पुढील मेन्यू...' : 'Language selected. Opening services menu...');
        await sendMainServicesList(from, lang);
        return;
      }
    }
    // list reply
    if (interactive.type === 'list_reply' || (interactive.type === 'list' && interactive.list_reply)) {
      const listId = interactive.list_reply?.id || interactive.list?.id;
      const sessionLang = sessions.get(from)?.lang || 'english';
      switch (listId) {
        case 'student_services':
          return handleStudentServices(from, sessionLang);
        case 'farmer_services':
          return handleFarmerServices(from, sessionLang);
        case 'health_services':
          return handleHealthServices(from, sessionLang);
        case 'complaints':
          return handleComplaints(from, sessionLang);
        default:
          return sendText(from, sessionLang === 'marathi' ? 'कृपया योग्य सेवा निवडा.' : 'Please select a valid service.');
      }
    }
  }
}

// webhook verify endpoint (GET)
app.get('/webhook', (req, res) => {
  console.log("Hii")
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// webhook receiver (POST)
app.post('/webhook', async (req, res) => {
  console.log("POST")
  try {
    const body = req.body;
    // basic shape guard
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    // messages array
    const messages = value?.messages;
    // statuses or other events - ignore
    if (!messages || messages.length === 0) {
      // you may log statuses here if needed
      return res.sendStatus(200);
    }

    // There can be multiple messages in one webhook; process each but avoid duplicates
    for (const m of messages) {
      // only handle text & interactive messages (ignore stickers, voice, status events)
      const mtype = m.type;
      if (!['text', 'interactive'].includes(mtype)) {
        console.log('Ignored message type:', mtype);
        continue;
      }

      // Prevent replying twice: check if message is from business (shouldn't happen) or already processed
      // For demo we rely on message.id uniqueness; you can store processed ids in Redis to be safe
      // Process message
      await processMessage(m);
      console.log('Auto reply flow processed for:', m.from);
    }
  } catch (err) {
    console.error('Webhook Error:', err.response?.data || err.message || err);
  }
  return res.sendStatus(200);
});

app.listen(PORT, () => console.log(`ZP Aurangabad bot running on port ${PORT}`));
