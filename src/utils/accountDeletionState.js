// Compartilhado pelos listeners para não recriar o perfil durante sua exclusão.
const deletingUsers = new Set();

export const isAccountDeletionInProgress = (uid) => deletingUsers.has(uid);
export const beginAccountDeletion = (uid) => deletingUsers.add(uid);
export const cancelAccountDeletion = (uid) => deletingUsers.delete(uid);
