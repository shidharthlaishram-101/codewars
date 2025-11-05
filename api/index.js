const serverless = require('serverless-http');
const express = require('express');
const path = require('path');
const { admin, db } = require('../firebaseServer');
const session = require('express-session');

const app = express();

// NOTE: express-session with the default MemoryStore is not suitable for serverless
// environments because it won't persist across invocations. For a production
// serverless deployment you should replace this with a cookie-based JWT auth
// or an external session store (Redis/Upstash). This change keeps the current
// behavior for minimal migration, but sessions will be ephemeral.
app.use(session({
  secret: process.env.SESSION_SECRET || 'codewars_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 60 * 60 * 1000 }
}));

// View engine and static
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Confirm Firestore connection
db.listCollections()
  .then(collections => {
    console.log('✅ Firestore connected! Existing collections:');
    if (collections.length === 0) console.log('   (no collections yet)');
    else collections.forEach(c => console.log(' -', c.id));
  })
  .catch(err => console.error('❌ Firestore connection failed:', err.message));

// Routes (mirrors app.js)
app.get('/', (req, res) => {
  res.render('index', { title: 'Home Page', message: 'Welcome to My Website!' });
});

app.get('/registration', (req, res) => {
  res.render('registration', { title: 'Register - Prajyuktam Coding Competition', error: null });
});

// Helper: generate unique 4-digit code
async function generateUniqueCode() {
  const min = 1000;
  const max = 9999;
  let code;
  let exists = true;
  let tries = 0;

  while (exists) {
    if (++tries > 50) {
      code = Date.now().toString().slice(-6);
      break;
    }
    code = Math.floor(Math.random() * (max - min + 1)) + min;
    const snapshot = await db.collection('registrations').where('code', '==', String(code)).limit(1).get();
    exists = !snapshot.empty;
  }
  return String(code);
}

app.post('/register', async (req, res) => {
  console.log('📩 Received registration data:', req.body);
  const {
    competition_type,
    p1_name, p1_email, p1_phone, p1_branch, p1_semester,
    p2_name, p2_email, p2_phone, p2_branch, p2_semester
  } = req.body;

  if (!competition_type || !['solo', 'duet'].includes(competition_type)) {
    return res.status(400).render('registration', {
      error: 'Please select a valid competition type.'
    });
  }

  if (!p1_name || !p1_email || !p1_phone || !p1_branch || !p1_semester) {
    return res.status(400).render('registration', {
      error: 'All fields for the first participant are required.'
    });
  }

  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(p1_phone)) {
    return res.status(400).render('registration', { error: 'Participant 1 phone must be 10 digits.' });
  }

  const participants = [
    {
      name: p1_name.trim(),
      email: p1_email.trim().toLowerCase(),
      phone: p1_phone.trim(),
      branch: p1_branch,
      semester: p1_semester,
    }
  ];

  if (competition_type === 'duet') {
    if (!p2_name || !p2_email || !p2_phone || !p2_branch || !p2_semester) {
      return res.status(400).render('registration', {
        error: 'All fields for both participants are required for duet.'
      });
    }

    if (!phoneRegex.test(p2_phone)) {
      return res.status(400).render('registration', { error: 'Participant 2 phone must be 10 digits.' });
    }

    if (p1_email === p2_email || p1_phone === p2_phone) {
      return res.status(400).render('registration', {
        error: 'Participants must use different emails and phone numbers.'
      });
    }

    participants.push({
      name: p2_name.trim(),
      email: p2_email.trim().toLowerCase(),
      phone: p2_phone.trim(),
      branch: p2_branch,
      semester: p2_semester,
    });
  }

  try {
    const code = await generateUniqueCode();
    const docRef = await db.collection('registrations').add({
      type: competition_type,
      participants,
      code,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Registration saved (id=${docRef.id}) with code: ${code}`);
    res.redirect(`/success?code=${code}`);
  } catch (error) {
    console.error('❌ Error saving to Firebase:', error);
    res.status(500).render('registration', {
      error: 'Server error while saving registration. Please try again later.'
    });
  }
});

app.get('/success', (req, res) => {
  const code = req.query.code || 'N/A';
  res.render('success', { title: 'Registration Successful', code });
});

app.get('/auth', (req, res) => {
  res.render('auth', { error: null });
});

app.post('/auth', async (req, res) => {
  const { uniqueCode, email } = req.body;

  try {
    if (!uniqueCode || !email) {
      return res.render('auth', { error: 'Please enter both code and email.' });
    }

    const code = uniqueCode.trim();
    const enteredEmail = email.trim().toLowerCase();

    const snapshot = await db.collection('registrations')
      .where('code', '==', code)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.render('auth', { error: 'Invalid code. Please try again.' });
    }

    const teamDoc = snapshot.docs[0].data();
    const participants = teamDoc.participants || [];

    const validParticipant = participants.find(p => p.email === enteredEmail);

    if (!validParticipant) {
      console.log(`❌ Unauthorized access attempt with email: ${enteredEmail}`);
      return res.render('auth', { error: 'This email is not registered under the provided code.' });
    }

    req.session.authenticated = true;
    req.session.email = enteredEmail;
    req.session.teamCode = code;

    console.log(`✅ Access granted for ${enteredEmail} (Team ${code})`);
    res.redirect(`/landing?code=${code}&email=${encodeURIComponent(enteredEmail)}`);
  } catch (error) {
    console.error('❌ Error verifying participant:', error);
    res.render('auth', { error: 'Server error. Please try again later.' });
  }
});

app.get('/landing', async (req, res) => {
  try {
    if (!req.session || !req.session.authenticated) {
      return res.redirect('/auth');
    }

    const { teamCode, email } = req.session;

    const snapshot = await db.collection('registrations')
      .where('code', '==', teamCode)
      .limit(1)
      .get();

    if (snapshot.empty) {
      req.session.destroy(() => {});
      return res.render('landing', {
        title: 'Invalid Code',
        code: teamCode,
        participants: [],
        notFound: true,
        error: 'Invalid team code. Please re-login.',
      });
    }

    const teamDoc = snapshot.docs[0].data();
    const participants = teamDoc.participants || [];

    const authorized = participants.some(p => p.email === email);

    if (!authorized) {
      req.session.destroy(() => {});
      return res.render('landing', {
        title: 'Access Denied',
        code: teamCode,
        participants: [],
        notFound: true,
        error: 'This email is not authorized for this code.',
      });
    }

    res.render('landing', {
      title: 'Welcome to CodeWars',
      code: teamCode,
      participants,
      notFound: false,
      authorizedEmail: email,
    });
  } catch (err) {
    console.error('❌ Error loading landing page:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    console.log('🔒 Session ended, user logged out');
    res.redirect('/auth');
  });
});

app.get('/contest', (req, res) => {
  res.render('contest', { title: 'CodeWars Contest' });
});

module.exports = serverless(app);
