const test = require('node:test');
const assert = require('node:assert/strict');
const { initializeApp, deleteApp } = require('firebase/app');
const firestore = require('firebase/firestore');
const host = process.env.FIRESTORE_EMULATOR_HOST;
const emulatorTest = host ? test : test.skip;
const apps = [];
let id = 0;

function connection(uid = 'owner') {
  assert.match(host, /^(127\.0\.0\.1|localhost):\d+$/, 'Somente emulador local');
  const app = initializeApp({ projectId: 'demo-lurdinha-fixes', apiKey: 'demo-key' }, `failover-${++id}`);
  apps.push(app);
  const db = firestore.getFirestore(app);
  const [hostname, port] = host.split(':');
  firestore.connectFirestoreEmulator(db, hostname, Number(port), {
    mockUserToken: uid === 'owner' ? 'owner' : { sub: uid, user_id: uid, email: `${uid}@example.com` },
  });
  return db;
}

test.after(async () => {
  for (const app of apps) {
    await firestore.terminate(firestore.getFirestore(app));
    await deleteApp(app);
  }
});

const player = uid => ({ uid, name: uid, score: 0 });

async function seedRoom(roomId, hostSeenAgoMs) {
  const admin = connection();
  await firestore.setDoc(firestore.doc(admin, 'game_rooms', roomId), {
    roomId,
    hostId: 'host',
    status: 'playing',
    settings: { gameType: 'lurdinha' },
    players: [player('host'), player('guest'), player('third')],
    playerIds: ['host', 'guest', 'third'],
    hostSeenAt: firestore.Timestamp.fromMillis(Date.now() - hostSeenAgoMs),
    roundData: { answers: {} },
  });
}

const claim = () => ({
  hostId: 'guest',
  hostSeenAt: firestore.serverTimestamp(),
  players: [player('guest'), player('third')],
  playerIds: ['guest', 'third'],
});

emulatorTest('jogador assume a sala quando o host parou há mais de 30s', async () => {
  await seedRoom('stale-ok', 60000);
  const db = connection('guest');
  const ref = firestore.doc(db, 'game_rooms', 'stale-ok');
  await firestore.updateDoc(ref, claim());
  const room = (await firestore.getDoc(ref)).data();
  assert.equal(room.hostId, 'guest');
  assert.deepEqual(room.playerIds, ['guest', 'third']);
});

emulatorTest('regras recusam assumir a sala com host ativo', async () => {
  await seedRoom('fresh-host', 5000);
  const db = connection('guest');
  await assert.rejects(firestore.updateDoc(firestore.doc(db, 'game_rooms', 'fresh-host'), claim()), /permission/i);
});

emulatorTest('regras recusam assumir a sala mexendo em outros campos ou sem remover o host', async () => {
  await seedRoom('stale-tamper', 60000);
  const db = connection('guest');
  const ref = firestore.doc(db, 'game_rooms', 'stale-tamper');
  await assert.rejects(firestore.updateDoc(ref, { ...claim(), status: 'finished' }), /permission/i);
  await assert.rejects(firestore.updateDoc(ref, {
    hostId: 'guest', hostSeenAt: firestore.serverTimestamp(),
  }), /permission/i);
  await assert.rejects(firestore.updateDoc(ref, { ...claim(), hostId: 'third' }), /permission/i);
});

emulatorTest('quem não está na sala não assume o host', async () => {
  await seedRoom('stale-outsider', 60000);
  const db = connection('outsider');
  await assert.rejects(firestore.updateDoc(firestore.doc(db, 'game_rooms', 'stale-outsider'), claim()), /permission/i);
});
