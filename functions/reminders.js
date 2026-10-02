// Lembrete "falta 1 hora para votar": roda a cada poucos minutos, acha quizzes de grupo
// que terminam na próxima hora e avisa quem ainda não votou em todas as enquetes.

const REMINDER_LEAD_MS = 60 * 60 * 1000;
// Quizzes curtos demais (recém-criados com prazo de ~1h) não recebem lembrete:
// os membros acabaram de ser avisados da criação.
const MIN_QUIZ_DURATION_MS = 75 * 60 * 1000;
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const toMillis = (value) => {
  if (!value) return null;
  if (typeof value.toMillis === 'function') return value.toMillis();
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
};

// Quem deve ser lembrado: membros (menos o criador) que não votaram em todas as enquetes.
const findPendingVoters = ({ members = [], createdBy, quizzes = [] }) => {
  if (quizzes.length === 0) return [];
  return members.filter((uid) => (
    uid !== createdBy
    && !quizzes.every((quiz) => quiz.votes && quiz.votes[uid] !== undefined)
  ));
};

const chunk = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
};

// Envia em lotes de 100 (limite da Expo) e devolve os tokens que não existem mais.
const sendExpoPush = async ({ fetchImpl, tokens, title, body, data }) => {
  const invalidTokens = [];
  for (const batch of chunk(tokens, 100)) {
    const response = await fetchImpl(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(batch.map((to) => ({ to, sound: 'default', title, body, data }))),
    });
    if (!response.ok) throw new Error(`Expo respondeu ${response.status}`);
    const { data: tickets = [] } = await response.json();
    tickets.forEach((ticket, index) => {
      if (ticket?.details?.error === 'DeviceNotRegistered') invalidTokens.push(batch[index]);
    });
  }
  return invalidTokens;
};

const processDeadlineReminders = async ({ db, Timestamp, FieldValue, fetchImpl, now = Date.now(), log = console }) => {
  const dueSnapshot = await db.collection('quizGroups')
    .where('status', '==', 'active')
    .where('endTime', '>', Timestamp.fromMillis(now))
    .where('endTime', '<=', Timestamp.fromMillis(now + REMINDER_LEAD_MS))
    .get();

  const summary = { checked: dueSnapshot.size, reminded: 0, recipients: 0 };

  for (const quizGroupDoc of dueSnapshot.docs) {
    const quizGroup = quizGroupDoc.data();
    if (quizGroup.deadlineReminderSentAt) continue;

    const endMs = toMillis(quizGroup.endTime);
    const createdMs = toMillis(quizGroup.createdAt);
    if (createdMs !== null && endMs - createdMs < MIN_QUIZ_DURATION_MS) continue;
    if (!quizGroup.groupId || !(quizGroup.quizzes || []).length) continue;

    // Marca antes de enviar: se duas execuções se sobrepuserem, só uma envia.
    const claimed = await db.runTransaction(async (tx) => {
      const fresh = await tx.get(quizGroupDoc.ref);
      if (!fresh.exists || fresh.data().deadlineReminderSentAt) return false;
      tx.update(quizGroupDoc.ref, { deadlineReminderSentAt: FieldValue.serverTimestamp() });
      return true;
    });
    if (!claimed) continue;

    try {
      const groupDoc = await db.collection('groups').doc(quizGroup.groupId).get();
      if (!groupDoc.exists) continue;
      const group = groupDoc.data();

      const quizDocs = await db.getAll(...quizGroup.quizzes.map((id) => db.collection('quizzes').doc(id)));
      const quizzes = quizDocs.filter((quizDoc) => quizDoc.exists).map((quizDoc) => quizDoc.data());

      const pendingUids = findPendingVoters({
        members: group.members,
        createdBy: quizGroup.createdBy,
        quizzes,
      });
      if (pendingUids.length === 0) continue;

      const userDocs = await db.getAll(...pendingUids.map((uid) => db.collection('users').doc(uid)));
      const tokenOwners = {};
      userDocs.forEach((userDoc) => {
        const token = userDoc.exists ? userDoc.data().expoPushToken : null;
        if (token && String(token).startsWith('ExponentPushToken')) tokenOwners[token] = userDoc.ref;
      });
      const tokens = Object.keys(tokenOwners);
      if (tokens.length === 0) continue;

      const invalidTokens = await sendExpoPush({
        fetchImpl,
        tokens,
        title: 'Falta 1 hora para votar ⏰',
        body: `O quiz "${quizGroup.title}" em ${group.name || 'seu grupo'} encerra em 1 hora e você ainda não votou.`,
        data: { type: 'QUIZ_DEADLINE', quizGroupId: quizGroupDoc.id, groupId: quizGroup.groupId },
      });
      await Promise.all(invalidTokens.map((token) => (
        tokenOwners[token].update({ expoPushToken: FieldValue.delete() }).catch(() => {})
      )));

      summary.reminded += 1;
      summary.recipients += tokens.length - invalidTokens.length;
    } catch (err) {
      // Falhou antes de avisar: libera para a próxima execução tentar de novo.
      log.error(`[quizDeadlineReminders] Falha em ${quizGroupDoc.id}:`, err);
      await quizGroupDoc.ref.update({ deadlineReminderSentAt: FieldValue.delete() }).catch(() => {});
    }
  }

  return summary;
};

module.exports = {
  REMINDER_LEAD_MS,
  MIN_QUIZ_DURATION_MS,
  findPendingVoters,
  processDeadlineReminders,
};
