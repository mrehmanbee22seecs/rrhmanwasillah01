/**
 * Email Webhook for Spark Plan (Google Apps Script)
 *
 * Supports two operations via HTTPS POST JSON:
 *  - { type: 'send', token, to, subject, html, text? }
 *    -> sends immediately via configured provider (Resend/SendGrid/Mailgun) or GmailApp fallback
 *  - { type: 'schedule', token, to: [..], subject, html, sendAt: ISO }
 *    -> stores job and a minute trigger will deliver around the scheduled time
 *
 * Configure Script Properties (File > Project properties > Script properties):
 *  - WEBHOOK_TOKEN: shared secret to authorize requests
 *  - FROM_EMAIL: e.g., no-reply@yourdomain.com
 *  - FROM_NAME: e.g., Wasilah
 *  - RESEND_API_KEY: optional
 *  - SENDGRID_API_KEY: optional
 *  - MAILGUN_API_KEY: optional
 *  - MAILGUN_DOMAIN: optional (e.g., mg.yourdomain.com)
 */

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var props = PropertiesService.getScriptProperties();
    var token = props.getProperty('WEBHOOK_TOKEN');
    if (!payload || payload.token !== token) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'unauthorized' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    ensureMinuteTrigger();

    if (payload.type === 'send') {
      var result = sendNow_(payload);
      return ContentService.createTextOutput(JSON.stringify({ ok: true, result: result }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (payload.type === 'schedule') {
      schedule_(payload);
      return ContentService.createTextOutput(JSON.stringify({ ok: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'unknown_type' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log(err);
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sendNow_(payload) {
  var to = payload.to;
  var subject = payload.subject || '';
  var html = payload.html || '';
  var text = payload.text || html.replace(/<[^>]+>/g, ' ');

  if (Array.isArray(to)) {
    to = to.join(',');
  }

  // Try providers in order: Resend, SendGrid, Mailgun; fallback to GmailApp
  if (sendViaResend_(to, subject, html, text)) return 'resend';
  if (sendViaSendGrid_(to, subject, html, text)) return 'sendgrid';
  if (sendViaMailgun_(to, subject, html, text)) return 'mailgun';
  sendViaGmail_(to, subject, html, text);
  return 'gmail';
}

function schedule_(payload) {
  var to = payload.to || payload.recipients || [];
  if (!Array.isArray(to)) to = [to];
  var subject = payload.subject || '';
  var html = payload.html || '';
  var sendAtISO = payload.sendAt || payload.sendAtISO;
  if (!sendAtISO) throw new Error('sendAt missing');
  var sendAtMs = Date.parse(sendAtISO);
  if (isNaN(sendAtMs)) throw new Error('Invalid sendAt');

  var lock = LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    var props = PropertiesService.getScriptProperties();
    var jobsRaw = props.getProperty('SCHEDULED_EMAIL_JOBS') || '[]';
    var jobs = JSON.parse(jobsRaw);
    jobs.push({ id: Utilities.getUuid(), to: to, subject: subject, html: html, sendAtMs: sendAtMs, createdAtMs: Date.now() });
    props.setProperty('SCHEDULED_EMAIL_JOBS', JSON.stringify(jobs));
  } finally {
    lock.releaseLock();
  }
}

function processScheduledEmails() {
  var now = Date.now();
  var lock = LockService.getScriptLock();
  lock.tryLock(20000);
  try {
    var props = PropertiesService.getScriptProperties();
    var jobsRaw = props.getProperty('SCHEDULED_EMAIL_JOBS') || '[]';
    var jobs = JSON.parse(jobsRaw);

    var remaining = [];
    for (var i = 0; i < jobs.length; i++) {
      var job = jobs[i];
      if (job.sendAtMs <= now + 15000) { // allow 15s window
        for (var j = 0; j < job.to.length; j++) {
          try {
            sendNow_({ to: job.to[j], subject: job.subject, html: job.html });
          } catch (e) {
            Logger.log('Failed to send scheduled email: ' + e);
          }
        }
      } else {
        remaining.push(job);
      }
    }

    props.setProperty('SCHEDULED_EMAIL_JOBS', JSON.stringify(remaining));
  } catch (e) {
    Logger.log('processScheduledEmails error: ' + e);
  } finally {
    lock.releaseLock();
  }
}

function ensureMinuteTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  var has = false;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction && triggers[i].getHandlerFunction() === 'processScheduledEmails') {
      has = true;
      break;
    }
  }
  if (!has) {
    ScriptApp.newTrigger('processScheduledEmails')
      .timeBased()
      .everyMinutes(1)
      .create();
  }
}

function sendViaResend_(to, subject, html, text) {
  var key = PropertiesService.getScriptProperties().getProperty('RESEND_API_KEY');
  var fromEmail = PropertiesService.getScriptProperties().getProperty('FROM_EMAIL') || 'no-reply@example.com';
  var fromName = PropertiesService.getScriptProperties().getProperty('FROM_NAME') || 'Mailer';
  if (!key) return false;
  try {
    var url = 'https://api.resend.com/emails';
    var payload = {
      from: fromName + ' <' + fromEmail + '>',
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: html,
      text: text
    };
    var resp = UrlFetchApp.fetch(url, {
      method: 'post',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });
    var code = resp.getResponseCode();
    if (code >= 200 && code < 300) return true;
    Logger.log('Resend error: ' + resp.getContentText());
    return false;
  } catch (e) {
    Logger.log('Resend exception: ' + e);
    return false;
  }
}

function sendViaSendGrid_(to, subject, html, text) {
  var key = PropertiesService.getScriptProperties().getProperty('SENDGRID_API_KEY');
  var fromEmail = PropertiesService.getScriptProperties().getProperty('FROM_EMAIL') || 'no-reply@example.com';
  var fromName = PropertiesService.getScriptProperties().getProperty('FROM_NAME') || 'Mailer';
  if (!key) return false;
  try {
    var url = 'https://api.sendgrid.com/v3/mail/send';
    var payload = {
      personalizations: [{ to: (Array.isArray(to) ? to : [to]).map(function (t) { return { email: t }; }) }],
      from: { email: fromEmail, name: fromName },
      subject: subject,
      content: [ { type: 'text/html', value: html } ]
    };
    var resp = UrlFetchApp.fetch(url, {
      method: 'post',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });
    var code = resp.getResponseCode();
    if (code >= 200 && code < 300) return true;
    Logger.log('SendGrid error: ' + resp.getContentText());
    return false;
  } catch (e) {
    Logger.log('SendGrid exception: ' + e);
    return false;
  }
}

function sendViaMailgun_(to, subject, html, text) {
  var key = PropertiesService.getScriptProperties().getProperty('MAILGUN_API_KEY');
  var domain = PropertiesService.getScriptProperties().getProperty('MAILGUN_DOMAIN');
  var fromEmail = PropertiesService.getScriptProperties().getProperty('FROM_EMAIL') || 'no-reply@example.com';
  var fromName = PropertiesService.getScriptProperties().getProperty('FROM_NAME') || 'Mailer';
  if (!key || !domain) return false;
  try {
    var url = 'https://api.mailgun.net/v3/' + domain + '/messages';
    var form = {
      from: fromName + ' <' + fromEmail + '>',
      to: Array.isArray(to) ? to.join(',') : to,
      subject: subject,
      text: text,
      html: html
    };
    var resp = UrlFetchApp.fetch(url, {
      method: 'post',
      headers: { 'Authorization': 'Basic ' + Utilities.base64Encode('api:' + key) },
      payload: form,
      muteHttpExceptions: true,
    });
    var code = resp.getResponseCode();
    if (code >= 200 && code < 300) return true;
    Logger.log('Mailgun error: ' + resp.getContentText());
    return false;
  } catch (e) {
    Logger.log('Mailgun exception: ' + e);
    return false;
  }
}

function sendViaGmail_(to, subject, html, text) {
  try {
    GmailApp.sendEmail(to, subject, text || subject, { htmlBody: html });
  } catch (e) {
    Logger.log('Gmail send failed: ' + e);
    throw e;
  }
}
