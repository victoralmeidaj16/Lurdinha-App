import {
  collection, deleteDoc, deleteField, doc, getDoc, getDocs,
  query, runTransaction, setDoc, where,
} from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db } from '../firebase';
import { beginAccountDeletion, cancelAccountDeletion, isAccountDeletionInProgress } from './accountDeletionState';

export const buildOwnVoteRemoval = (quiz, uid) => {
  if (!Object.prototype.hasOwnProperty.call(quiz.votes || {}, uid)) return null;

  const optionKey = String(quiz.votes[uid]);
  const patch = { [`votes.${uid}`]: deleteField() };
  const avatars = quiz.voterAvatars?.[optionKey];
  if (Array.isArray(avatars) && avatars.includes(uid)) {
    patch[`voterAvatars.${optionKey}`] = avatars.filter((voterId) => voterId !== uid);
  }
  return patch;
};

// Auth e Firestore não compartilham uma transação. A limpeza é repetível, o
// perfil fica por último e é restaurado se a exclusão no Auth falhar.
export async function deleteAccountData(user) {
  if (!user?.uid) throw new Error('Usuário não autenticado.');
  const uid = user.uid;
  if (isAccountDeletionInProgress(uid)) throw new Error('A exclusão já está em andamento.');
  beginAccountDeletion(uid);
  const userRef = doc(db, 'users', uid);
  let profileBackup;
  let profileDeleted = false;

  try {
    // Primeiro a etapa que exige permissões especiais em documentos de terceiros.
    const quizzes = await getDocs(collection(db, 'quizzes'));
    for (const quiz of quizzes.docs) {
      if (!Object.prototype.hasOwnProperty.call(quiz.data().votes || {}, uid)) continue;
      await runTransaction(db, async (transaction) => {
        const freshQuiz = await transaction.get(quiz.ref);
        if (!freshQuiz.exists()) return;
        const patch = buildOwnVoteRemoval(freshQuiz.data(), uid);
        if (patch) transaction.update(quiz.ref, patch);
      });
    }

    const groupSnapshots = await Promise.all([
      getDocs(query(collection(db, 'groups'), where('members', 'array-contains', uid))),
      getDocs(query(collection(db, 'groups'), where('createdBy', '==', uid))),
    ]);
    const groups = new Map(groupSnapshots.flatMap((snapshot) => snapshot.docs).map((group) => [group.id, group]));
    for (const group of groups.values()) {
      await runTransaction(db, async (transaction) => {
        const freshGroup = await transaction.get(group.ref);
        if (!freshGroup.exists()) return;
        const data = freshGroup.data();
        if (data.createdBy !== uid && !(data.members || []).includes(uid)) return;
        const members = (data.members || []).filter((id) => id !== uid);
        const admins = (data.admins || []).filter((id) => id !== uid);
        const patch = { members, admins, 'stats.totalMembers': members.length };
        if (data.createdBy === uid) {
          patch.createdBy = admins[0] || members[0] || null;
          if (patch.createdBy && !admins.includes(patch.createdBy)) admins.push(patch.createdBy);
        }
        transaction.update(group.ref, patch);
      });
    }

    const profile = await getDoc(userRef);
    profileBackup = profile.exists() ? profile.data() : null;
    await deleteDoc(userRef);
    profileDeleted = true;
    await deleteUser(user);
    // Mantém a proteção para callbacks atrasados após o logout automático.
  } catch (error) {
    if (profileDeleted && profileBackup) {
      try {
        // Os vínculos com grupos já foram removidos; não restaurar IDs obsoletos.
        await setDoc(userRef, { ...profileBackup, groups: [], stats: { ...profileBackup.stats, grupos: 0 } });
      } catch (restoreError) {
        console.error('Erro ao restaurar perfil após falha na exclusão:', restoreError);
      }
    }
    cancelAccountDeletion(uid);
    throw error;
  }
}
