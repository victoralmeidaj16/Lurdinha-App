import AsyncStorage from '@react-native-async-storage/async-storage';

// Guarda, por usuário e grupo, quando o grupo foi aberto pela última vez.
// Usado para mostrar o ponto de "novidade" nos cards da lista de grupos.

const getKey = (userId, groupId) => `groupLastSeen:${userId}:${groupId}`;

export const markGroupSeen = async (userId, groupId) => {
  if (!userId || !groupId) return;

  try {
    await AsyncStorage.setItem(getKey(userId, groupId), String(Date.now()));
  } catch (error) {
    console.warn('Error saving group last seen:', error);
  }
};

// Retorna { [groupId]: timestamp }. Grupos ainda sem registro recebem o
// momento atual, para que só atividades futuras contem como novidade.
export const getGroupsLastSeen = async (userId, groupIds = []) => {
  if (!userId || groupIds.length === 0) return {};

  try {
    const keys = groupIds.map(groupId => getKey(userId, groupId));
    const entries = await AsyncStorage.multiGet(keys);
    const now = Date.now();
    const missing = [];
    const result = {};

    entries.forEach(([key, value], index) => {
      const groupId = groupIds[index];
      if (value) {
        result[groupId] = Number(value);
      } else {
        result[groupId] = now;
        missing.push([key, String(now)]);
      }
    });

    if (missing.length > 0) {
      await AsyncStorage.multiSet(missing);
    }

    return result;
  } catch (error) {
    console.warn('Error reading group last seen:', error);
    return {};
  }
};
