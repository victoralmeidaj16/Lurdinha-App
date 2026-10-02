const admin = require('firebase-admin');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const logger = require('firebase-functions/logger');
const { processDeadlineReminders } = require('./reminders');

admin.initializeApp();

// A cada 5 minutos avisa quem ainda não votou num quiz que encerra em até 1 hora.
exports.sendQuizDeadlineReminders = onSchedule(
  {
    schedule: 'every 5 minutes',
    timeZone: 'America/Sao_Paulo',
    timeoutSeconds: 120,
    memory: '256MiB',
    maxInstances: 1,
  },
  async () => {
    const summary = await processDeadlineReminders({
      db: admin.firestore(),
      Timestamp: admin.firestore.Timestamp,
      FieldValue: admin.firestore.FieldValue,
      fetchImpl: fetch,
      log: logger,
    });
    logger.info('Lembretes de prazo processados', summary);
  },
);
