import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { sendPushNotification } from '../hooks/usePushNotifications';

// Avisa os membros de um grupo (menos quem criou) sobre algo novo. Nunca lança erro:
// falha de notificação não pode impedir a criação da enquete.
export const notifyGroupMembers = async ({ memberIds = [], excludeUid, title, body, data = {} }) => {
    try {
        const targets = [...new Set(memberIds)].filter((uid) => uid && uid !== excludeUid);
        if (targets.length === 0) return;

        const userDocs = await Promise.all(
            targets.map((uid) => getDoc(doc(db, 'users', uid)).catch(() => null))
        );
        const tokens = [...new Set(
            userDocs
                .filter((userDoc) => userDoc?.exists())
                .map((userDoc) => userDoc.data().expoPushToken)
                .filter(Boolean)
        )];
        if (tokens.length === 0) return;

        await sendPushNotification(tokens, title, body, data);
    } catch (err) {
        console.error('[quizNotifications] Erro ao enviar notificações:', err);
    }
};
