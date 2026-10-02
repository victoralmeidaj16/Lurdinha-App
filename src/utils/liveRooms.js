import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const getCreatedAtMs = (roomDoc) => {
    const createdAt = roomDoc.data()?.createdAt;
    if (createdAt?.toMillis) return createdAt.toMillis();
    return createdAt ? new Date(createdAt).getTime() || 0 : 0;
};

// As regras do Firestore só liberam salas em lobby ou salas das quais o usuário
// participa, então buscamos esses dois conjuntos e juntamos, mais recentes primeiro.
export const fetchVisibleRoomDocs = async (uid) => {
    const roomsRef = collection(db, 'game_rooms');
    const [openSnapshot, mineSnapshot] = await Promise.all([
        getDocs(query(roomsRef, where('status', '==', 'waiting'), orderBy('createdAt', 'desc'), limit(30))),
        uid
            ? getDocs(query(roomsRef, where('playerIds', 'array-contains', uid), orderBy('createdAt', 'desc'), limit(10)))
            : Promise.resolve({ docs: [] }),
    ]);

    const byId = new Map();
    [...openSnapshot.docs, ...mineSnapshot.docs].forEach((roomDoc) => {
        byId.set(roomDoc.id, roomDoc);
    });

    return [...byId.values()].sort((first, second) => getCreatedAtMs(second) - getCreatedAtMs(first));
};
