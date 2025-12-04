import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export function useUserData() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchUserData();
    } else {
      setUserData(null);
      setLoading(false);
    }
  }, [currentUser]);

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const firestoreData = userDoc.data();
        // Priorizar displayName do Firebase Auth se existir, senão usar do Firestore
        const displayName = currentUser.displayName || firestoreData.displayName || 'Usuário';

        // Se o displayName do Firebase Auth estiver diferente do Firestore, atualizar
        if (currentUser.displayName && firestoreData.displayName !== currentUser.displayName) {
          await updateDoc(doc(db, 'users', currentUser.uid), {
            displayName: currentUser.displayName
          });
          setUserData({ ...firestoreData, displayName: currentUser.displayName });
        } else {
          setUserData({ ...firestoreData, displayName });
        }
      } else {
        // Create new user document
        // Usar displayName do Firebase Auth ou 'Usuário' como fallback
        const userName = currentUser.displayName || 'Usuário';
        const newUserData = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: userName,
          photoURL: currentUser.photoURL || 'https://i.pravatar.cc/100?img=25',
          createdAt: new Date(),
          stats: {
            ranking: 0,
            fireStreak: 0,
            acertos: 0,
            enquetesVotadas: 0,
            grupos: 0
          },
          groups: []
        };
        await setDoc(doc(db, 'users', currentUser.uid), newUserData);
        setUserData(newUserData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStats = async (updates) => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        [`stats.${Object.keys(updates)[0]}`]: Object.values(updates)[0]
      });

      // Update local state
      setUserData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          ...updates
        }
      }));
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  };

  const createGroup = async (groupData) => {
    if (!currentUser) return;

    try {
      const groupRef = doc(collection(db, 'groups'));
      const newGroup = {
        id: groupRef.id,
        name: groupData.name,
        description: groupData.description,
        createdBy: currentUser.uid,
        createdAt: new Date(),
        members: [currentUser.uid],
        polls: [],
        isActive: true
      };

      await setDoc(groupRef, newGroup);

      // Add group to user's groups
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        groups: [...(userData?.groups || []), groupRef.id]
      });

      return newGroup;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  };

  const joinGroup = async (groupId) => {
    if (!currentUser) return;

    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);

      if (groupDoc.exists()) {
        const groupData = groupDoc.data();
        const updatedMembers = [...groupData.members, currentUser.uid];

        await updateDoc(groupRef, {
          members: updatedMembers
        });

        // Add group to user's groups
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          groups: [...(userData?.groups || []), groupId]
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error('Error joining group:', error);
      throw error;
    }
  };

  const getTopUsers = async () => {
    try {
      const usersQuery = query(collection(db, 'users'));
      const querySnapshot = await getDocs(usersQuery);

      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by acertos (correct answers)
      return users.sort((a, b) => (b.stats?.acertos || 0) - (a.stats?.acertos || 0)).slice(0, 3);
    } catch (error) {
      console.error('Error fetching top users:', error);
      return [];
    }
  };

  const updateUserPhoto = async (photoURI) => {
    if (!currentUser) return;

    try {
      // Criar referência no Storage
      const photoRef = ref(storage, `profile_photos/${currentUser.uid}_${Date.now()}.jpg`);

      // Converter URI para Blob
      const response = await fetch(photoURI);
      const blob = await response.blob();

      // Upload da imagem
      await uploadBytes(photoRef, blob);

      // Obter URL da imagem
      const downloadURL = await getDownloadURL(photoRef);

      // Atualizar no Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        photoURL: downloadURL
      });

      // Atualizar estado local
      setUserData(prev => ({
        ...prev,
        photoURL: downloadURL
      }));

      return downloadURL;
    } catch (error) {
      console.error('Error updating user photo:', error);
      throw error;
    }
  };

  const getUserProfile = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        // Retornar apenas dados públicos
        return {
          uid: data.uid,
          displayName: data.displayName || 'Usuário',
          photoURL: data.photoURL,
          stats: data.stats || {
            ranking: 0,
            fireStreak: 0,
            acertos: 0,
            enquetesVotadas: 0,
            grupos: 0
          },
          createdAt: data.createdAt
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  };

  const checkUsernameAvailable = async (username) => {
    try {
      const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()));
      return !usernameDoc.exists();
    } catch (error) {
      console.error('Error checking username availability:', error);
      throw error;
    }
  };

  const saveUsername = async (username) => {
    if (!currentUser) return;
    const lowerUsername = username.toLowerCase();

    try {
      // 1. Check availability again to be safe
      const isAvailable = await checkUsernameAvailable(lowerUsername);
      if (!isAvailable) {
        throw new Error('Este nome de usuário já está em uso.');
      }

      // 2. Reserve username in 'usernames' collection
      await setDoc(doc(db, 'usernames', lowerUsername), {
        uid: currentUser.uid,
        createdAt: new Date()
      });

      // 3. Update user profile in 'users' collection
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        username: lowerUsername
      });

      // 4. Update local state
      setUserData(prev => ({
        ...prev,
        username: lowerUsername
      }));

      return true;
    } catch (error) {
      console.error('Error saving username:', error);
      throw error;
    }
  };

  return {
    userData,
    loading,
    updateUserStats,
    updateUserPhoto,
    createGroup,
    joinGroup,
    getTopUsers,
    getUserProfile,
    checkUsernameAvailable,
    saveUsername
  };
}
