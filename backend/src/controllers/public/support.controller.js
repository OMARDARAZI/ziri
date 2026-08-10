const supportRepo = require('../../repositories/support-message.repository');

async function supportPage(req, res) {
  res.render('public/support', {
    title: 'Contact Support',
    submitted: false,
    error: null
  });
}

async function processSupportRequest(req, res) {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim();
  const phone = String(req.body.phone || '').trim();
  const subject = String(req.body.subject || '').trim();
  const message = String(req.body.message || '').trim();

  if (!name || !subject || !message) {
    return res.status(422).render('public/support', {
      title: 'Contact Support',
      submitted: false,
      error: 'Name, Subject, and Message are required.'
    });
  }

  await supportRepo.createMessage({
    name,
    email: email || null,
    phone: phone || null,
    subject,
    message
  });

  return res.render('public/support', {
    title: 'Contact Support',
    submitted: true,
    name,
    error: null
  });
}

module.exports = {
  supportPage,
  processSupportRequest
};
