import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  arrayUnion, 
  arrayRemove,
  Timestamp,
  addDoc,
  orderBy,
  limit,
  onSnapshot,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export function useGroups() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Criar grupo
  const createGroup = async (groupData) => {
    if (!currentUser) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    setError(null);
    
    try {
      const groupRef = doc(collection(db, 'groups'));
      const newGroup = {
        id: groupRef.id,
        name: groupData.name,
        description: groupData.description || '',
        isPublic: groupData.isPublic !== false,
        createdBy: currentUser.uid,
        createdAt: Timestamp.now(),
        members: [currentUser.uid],
        admins: [currentUser.uid],
        pendingRequests: [],
        quizzes: [],
        quizGroups: [],
        stats: {
          totalQuizzes: 0,
          activeQuizzes: 0,
          totalMembers: 1
        },
        color: groupData.color || '#8b5cf6',
        badge: groupData.badge || '👥'
      };
      
      await setDoc(groupRef, newGroup);
      
      // Adicionar grupo ao usuário
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userGroups = userDoc.data().groups || [];
        await updateDoc(userRef, {
          groups: arrayUnion(groupRef.id),
          'stats.grupos': userGroups.length + 1
        });
      }
      
      return { id: groupRef.id, ...newGroup };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Buscar grupos públicos
  const searchPublicGroups = async (searchTerm = '') => {
    setLoading(true);
    setError(null);
    
    try {
      let q = query(
        collection(db, 'groups'),
        where('isPublic', '==', true)
      );
      
      const snapshot = await getDocs(q);
      let groups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filtrar grupos que o usuário já é membro
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userGroups = userDoc.data().groups || [];
          groups = groups.filter(g => !userGroups.includes(g.id));
        }
      }
      
      // Buscar por termo
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        groups = groups.filter(g => 
          g.name.toLowerCase().includes(term) ||
          (g.description && g.description.toLowerCase().includes(term))
        );
      }
      
      return groups;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obter grupos do usuário
  const getUserGroups = async () => {
    if (!currentUser) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (!userDoc.exists()) return [];
      
      const userGroups = userDoc.data().groups || [];
      if (userGroups.length === 0) return [];
      
      const groupPromises = userGroups.map(groupId => 
        getDoc(doc(db, 'groups', groupId))
      );
      
      const groupDocs = await Promise.all(groupPromises);
      const groups = groupDocs
        .filter(doc => doc.exists())
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      
      return groups;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obter detalhes de um grupo
  const getGroupDetails = async (groupId) => {
    setLoading(true);
    setError(null);
    
    try {
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (!groupDoc.exists()) {
        throw new Error('Grupo não encontrado');
      }
      
      const groupData = {
        id: groupDoc.id,
        ...groupDoc.data()
      };
      
      // Buscar informações dos membros
      if (groupData.members && groupData.members.length > 0) {
        const memberPromises = groupData.members.slice(0, 10).map(userId =>
          getDoc(doc(db, 'users', userId))
        );
        const memberDocs = await Promise.all(memberPromises);
        groupData.memberDetails = memberDocs
          .filter(doc => doc.exists())
          .map(doc => ({
            uid: doc.id,
            ...doc.data()
          }));
      }
      
      return groupData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Enviar solicitação para entrar no grupo
  const sendJoinRequest = async (groupId) => {
    if (!currentUser) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    setError(null);
    
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Grupo não encontrado');
      }
      
      const groupData = groupDoc.data();
      
      // Verificar se já é membro
      if (groupData.members && groupData.members.includes(currentUser.uid)) {
        throw new Error('Você já é membro deste grupo');
      }
      
      // Verificar se já existe solicitação pendente
      const pendingRequests = groupData.pendingRequests || [];
      if (pendingRequests.includes(currentUser.uid)) {
        throw new Error('Solicitação já enviada');
      }
      
      // Adicionar à lista de solicitações pendentes
      await updateDoc(groupRef, {
        pendingRequests: arrayUnion(currentUser.uid)
      });
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Aceitar solicitação de entrada
  const acceptJoinRequest = async (groupId, userId) => {
    if (!currentUser) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    setError(null);
    
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Grupo não encontrado');
      }
      
      const groupData = groupDoc.data();
      
      // Verificar se o usuário é admin
      if (!groupData.admins || !groupData.admins.includes(currentUser.uid)) {
        throw new Error('Apenas administradores podem aceitar solicitações');
      }
      
      // Remover da lista de pendentes e adicionar aos membros
      await updateDoc(groupRef, {
        pendingRequests: arrayRemove(userId),
        members: arrayUnion(userId),
        'stats.totalMembers': (groupData.stats?.totalMembers || 0) + 1
      });
      
      // Adicionar grupo ao usuário
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userGroups = userDoc.data().groups || [];
        await updateDoc(userRef, {
          groups: arrayUnion(groupId),
          'stats.grupos': userGroups.length + 1
        });
      }
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Rejeitar solicitação de entrada
  const rejectJoinRequest = async (groupId, userId) => {
    if (!currentUser) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    setError(null);
    
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Grupo não encontrado');
      }
      
      const groupData = groupDoc.data();
      
      // Verificar se o usuário é admin
      if (!groupData.admins || !groupData.admins.includes(currentUser.uid)) {
        throw new Error('Apenas administradores podem rejeitar solicitações');
      }
      
      await updateDoc(groupRef, {
        pendingRequests: arrayRemove(userId)
      });
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sair do grupo
  const leaveGroup = async (groupId) => {
    if (!currentUser) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    setError(null);
    
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Grupo não encontrado');
      }
      
      const groupData = groupDoc.data();
      
      // Remover dos membros
      await updateDoc(groupRef, {
        members: arrayRemove(currentUser.uid),
        admins: arrayRemove(currentUser.uid),
        'stats.totalMembers': Math.max((groupData.stats?.totalMembers || 1) - 1, 0)
      });
      
      // Remover grupo do usuário
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userGroups = userDoc.data().groups || [];
        await updateDoc(userRef, {
          groups: arrayRemove(groupId),
          'stats.grupos': Math.max((userDoc.data().stats?.grupos || 0) - 1, 0)
        });
      }
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Criar quiz no grupo
  const createGroupQuiz = async (groupId, quizData) => {
    if (!currentUser) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    setError(null);
    
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Grupo não encontrado');
      }
      
      const groupData = groupDoc.data();
      
      // Verificar se é membro
      if (!groupData.members || !groupData.members.includes(currentUser.uid)) {
        throw new Error('Você precisa ser membro do grupo para criar quizzes');
      }
      
      // Criar quiz
      const quizRef = doc(collection(db, 'quizzes'));
      const endTime = new Date();
      const hours = parseInt(quizData.timeLimit || '24', 10);
      endTime.setHours(endTime.getHours() + hours);
      
      const newQuiz = {
        id: quizRef.id,
        title: quizData.title,
        description: quizData.description || '',
        options: quizData.options,
        createdBy: currentUser.uid,
        groupId: groupId,
        createdAt: Timestamp.now(),
        endTime: endTime,
        votes: {},
        isActive: true,
        results: null
      };
      
      await setDoc(quizRef, newQuiz);
      
      // Adicionar quiz ao grupo
      await updateDoc(groupRef, {
        quizzes: arrayUnion(quizRef.id),
        'stats.totalQuizzes': (groupData.stats?.totalQuizzes || 0) + 1,
        'stats.activeQuizzes': (groupData.stats?.activeQuizzes || 0) + 1
      });
      
      return { id: quizRef.id, ...newQuiz };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obter quizzes do grupo
  const getGroupQuizzes = async (groupId) => {
    setLoading(true);
    setError(null);
    
    try {
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (!groupDoc.exists()) {
        throw new Error('Grupo não encontrado');
      }
      
      const groupData = groupDoc.data();
      const quizIds = groupData.quizzes || [];
      
      if (quizIds.length === 0) return [];
      
      const quizPromises = quizIds.map(quizId =>
        getDoc(doc(db, 'quizzes', quizId))
      );
      
      const quizDocs = await Promise.all(quizPromises);
      const quizzes = quizDocs
        .filter(doc => doc.exists())
        .map(doc => {
          const data = doc.data();
          const endTime = data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime);
          const isActive = data.isActive && endTime > new Date();
          
          return {
            id: doc.id,
            ...data,
            endTime,
            isActive
          };
        })
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
          return bTime - aTime;
        });
      
      return quizzes;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Criar Grupo de Quiz
  const createQuizGroup = async (groupId, quizGroupData) => {
    if (!currentUser) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    setError(null);
    
    try {
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (!groupDoc.exists()) {
        throw new Error('Grupo não encontrado');
      }
      
      const groupData = groupDoc.data();
      if (!groupData.members || !groupData.members.includes(currentUser.uid)) {
        throw new Error('Você precisa ser membro do grupo para criar grupos de quiz');
      }
      
      const quizGroupRef = doc(collection(db, 'quizGroups'));
      // Usar endDateTime se fornecido, caso contrário calcular a partir de timeLimit
      let endTime;
      let hours;
      if (quizGroupData.endDateTime) {
        endTime = quizGroupData.endDateTime instanceof Date 
          ? quizGroupData.endDateTime 
          : new Date(quizGroupData.endDateTime);
        hours = Math.ceil((endTime.getTime() - new Date().getTime()) / (1000 * 60 * 60));
      } else {
        endTime = new Date();
        hours = parseInt(quizGroupData.timeLimit || '24', 10);
        endTime.setHours(endTime.getHours() + hours);
      }
      
      // Se modo Desafios e seleção aleatória, dividir times automaticamente
      let challengeConfig = quizGroupData.challengeConfig || null;
      if (quizGroupData.mode === 'challenge' && 
          quizGroupData.challengeConfig?.teamSelection === 'random') {
        // Buscar membros do grupo
        const members = groupData.members || [];
        // Remover o criador da lista para divisão
        const membersToDivide = members.filter(m => m !== currentUser.uid);
        
        // Embaralhar e dividir em 2 times
        const shuffled = [...membersToDivide].sort(() => Math.random() - 0.5);
        const midPoint = Math.ceil(shuffled.length / 2);
        const team1 = shuffled.slice(0, midPoint);
        const team2 = shuffled.slice(midPoint);
        
        challengeConfig = {
          teamSelection: 'random',
          teams: [team1, team2]
        };
      }
      
      const newQuizGroup = {
        id: quizGroupRef.id,
        groupId: groupId,
        title: quizGroupData.title,
        type: quizGroupData.type, // 1 ou 2
        mode: quizGroupData.mode, // 'normal', 'ghost', 'challenge'
        createdBy: currentUser.uid,
        createdAt: Timestamp.now(),
        endTime: Timestamp.fromDate(endTime),
        timeLimit: hours,
        timeDescription: quizGroupData.timeDescription || '',
        allowEveryoneToMarkCorrect: quizGroupData.allowEveryoneToMarkCorrect !== false,
        challengeConfig: challengeConfig,
        quizzes: [],
        correctAnswers: {},
        ranking: null,
        status: 'active'
      };
      
      await setDoc(quizGroupRef, newQuizGroup);
      
      // Adicionar quizGroup ao grupo
      const groupRef = doc(db, 'groups', groupId);
      const existingQuizGroups = groupData.quizGroups || [];
      await updateDoc(groupRef, {
        quizGroups: arrayUnion(quizGroupRef.id)
      });
      
      return { id: quizGroupRef.id, ...newQuizGroup };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Adicionar múltiplas enquetes ao grupo de quiz
  const addQuizzesToGroup = async (quizGroupId, quizzesArray) => {
    if (!currentUser) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    setError(null);
    
    try {
      const quizGroupDoc = await getDoc(doc(db, 'quizGroups', quizGroupId));
      if (!quizGroupDoc.exists()) {
        throw new Error('Grupo de quiz não encontrado');
      }
      
      const quizGroupData = quizGroupDoc.data();
      if (quizGroupData.createdBy !== currentUser.uid) {
        throw new Error('Apenas o criador pode adicionar enquetes');
      }
      
      const quizIds = [];
      
      for (const quizData of quizzesArray) {
        const quizRef = doc(collection(db, 'quizzes'));
        // Inicializar voterAvatars para cada opção
        const voterAvatars = {};
        quizData.options.forEach((_, index) => {
          voterAvatars[index] = [];
        });
        
        const newQuiz = {
          id: quizRef.id,
          quizGroupId: quizGroupId,
          question: quizData.question,
          options: quizData.options,
          createdBy: currentUser.uid,
          createdAt: Timestamp.now(),
          votes: {},
          correctAnswer: quizData.type === 2 ? quizData.correctAnswer : null, // Tipo 2 tem resposta definida
          voterAvatars: voterAvatars, // optionIndex -> array de userIds
          status: 'active'
        };
        
        await setDoc(quizRef, newQuiz);
        quizIds.push(quizRef.id);
      }
      
      // Atualizar quizGroup com os IDs das enquetes
      await updateDoc(doc(db, 'quizGroups', quizGroupId), {
        quizzes: arrayUnion(...quizIds)
      });
      
      return quizIds;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Votar em uma enquete
  const voteOnQuiz = async (quizId, optionIndex) => {
    if (!currentUser) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    setError(null);
    
    try {
      const quizRef = doc(db, 'quizzes', quizId);
      const quizDoc = await getDoc(quizRef);
      
      if (!quizDoc.exists()) {
        throw new Error('Enquete não encontrada');
      }
      
      const quizData = quizDoc.data();
      
      // Verificar se já votou
      if (quizData.votes && quizData.votes[currentUser.uid] !== undefined) {
        throw new Error('Você já votou nesta enquete');
      }
      
      // Verificar se está ativa
      if (quizData.status !== 'active') {
        throw new Error('Esta enquete está encerrada');
      }
      
      // Obter quizGroup para verificar prazo
      const quizGroupDoc = await getDoc(doc(db, 'quizGroups', quizData.quizGroupId));
      if (quizGroupDoc.exists()) {
        const quizGroupData = quizGroupDoc.data();
        const endTime = quizGroupData.endTime?.toDate ? quizGroupData.endTime.toDate() : new Date(quizGroupData.endTime);
        if (endTime < new Date()) {
          throw new Error('Prazo para votação expirado');
        }
      }
      
      // Atualizar voto
      const updatedVotes = {
        ...quizData.votes,
        [currentUser.uid]: optionIndex
      };
      
      // Atualizar voterAvatars (só se modo normal)
      const updatedVoterAvatars = { ...quizData.voterAvatars };
      if (!updatedVoterAvatars[optionIndex]) {
        updatedVoterAvatars[optionIndex] = [];
      }
      if (!updatedVoterAvatars[optionIndex].includes(currentUser.uid)) {
        updatedVoterAvatars[optionIndex] = [...updatedVoterAvatars[optionIndex], currentUser.uid];
      }
      
      await updateDoc(quizRef, {
        votes: updatedVotes,
        voterAvatars: updatedVoterAvatars
      });
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Marcar resposta correta
  const markCorrectAnswer = async (quizGroupId, quizId, optionIndex) => {
    if (!currentUser) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    setError(null);
    
    try {
      const quizGroupRef = doc(db, 'quizGroups', quizGroupId);
      const quizGroupDoc = await getDoc(quizGroupRef);
      
      if (!quizGroupDoc.exists()) {
        throw new Error('Grupo de quiz não encontrado');
      }
      
      const quizGroupData = quizGroupDoc.data();
      
      // Verificar permissões
      const isCreator = quizGroupData.createdBy === currentUser.uid;
      
      if (!isCreator && !quizGroupData.allowEveryoneToMarkCorrect) {
        throw new Error('Apenas o criador pode marcar resposta correta');
      }
      
      // Se allowEveryoneToMarkCorrect e não é criador, verificar se usuário respondeu todas
      if (!isCreator && quizGroupData.allowEveryoneToMarkCorrect) {
        const allQuizzes = await Promise.all(
          quizGroupData.quizzes.map(qId => getDoc(doc(db, 'quizzes', qId)))
        );
        const allResponded = allQuizzes.every(qDoc => {
          const qData = qDoc.data();
          return qData.votes && qData.votes[currentUser.uid] !== undefined;
        });
        
        if (!allResponded) {
          throw new Error('Você precisa responder todas as enquetes antes de marcar resposta correta');
        }
      }
      
      // Verificar se a enquete já tem resposta correta
      const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
      if (quizDoc.exists()) {
        const quizData = quizDoc.data();
        if (quizData.correctAnswer !== null && quizData.correctAnswer !== undefined) {
          throw new Error('Esta enquete já tem uma resposta correta marcada');
        }
      }
      
      // Atualizar quiz com resposta correta
      await updateDoc(doc(db, 'quizzes', quizId), {
        correctAnswer: optionIndex,
        status: 'completed'
      });
      
      // Atualizar correctAnswers no quizGroup
      const updatedCorrectAnswers = {
        ...quizGroupData.correctAnswers,
        [quizId]: optionIndex
      };
      
      await updateDoc(quizGroupRef, {
        correctAnswers: updatedCorrectAnswers
      });
      
      // Verificar se todas têm resposta e calcular ranking
      const allQuizzes = await Promise.all(
        quizGroupData.quizzes.map(qId => getDoc(doc(db, 'quizzes', qId)))
      );
      const allHaveCorrectAnswer = allQuizzes.every(qDoc => {
        const qData = qDoc.data();
        return qData.correctAnswer !== null && qData.correctAnswer !== undefined;
      });
      
      if (allHaveCorrectAnswer) {
        await calculateRanking(quizGroupId);
      }
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Calcular ranking
  const calculateRanking = async (quizGroupId) => {
    try {
      const quizGroupDoc = await getDoc(doc(db, 'quizGroups', quizGroupId));
      if (!quizGroupDoc.exists()) return;
      
      const quizGroupData = quizGroupDoc.data();
      const quizzes = await Promise.all(
        quizGroupData.quizzes.map(qId => getDoc(doc(db, 'quizzes', qId)))
      );
      
      // Modo Desafios: ranking por time
      if (quizGroupData.mode === 'challenge' && quizGroupData.challengeConfig?.teams) {
        const teams = quizGroupData.challengeConfig.teams;
        const teamScores = teams.map((team, teamIndex) => {
          const teamUserScores = {};
          
          // Coletar pontuações dos membros do time
          team.forEach(userId => {
            teamUserScores[userId] = { userId, correct: 0, total: 0 };
          });
          
          quizzes.forEach(quizDoc => {
            const quizData = quizDoc.data();
            const correctAnswer = quizData.correctAnswer;
            
            if (correctAnswer === null || correctAnswer === undefined) return;
            
            Object.entries(quizData.votes || {}).forEach(([userId, optionIndex]) => {
              if (teamUserScores[userId]) {
                teamUserScores[userId].total++;
                if (optionIndex === correctAnswer) {
                  teamUserScores[userId].correct++;
                }
              }
            });
          });
          
          // Calcular total do time
          const totalCorrect = Object.values(teamUserScores).reduce((sum, score) => sum + score.correct, 0);
          const totalVotes = Object.values(teamUserScores).reduce((sum, score) => sum + score.total, 0);
          
          return {
            teamIndex: teamIndex,
            team: team,
            totalCorrect: totalCorrect,
            totalVotes: totalVotes,
            accuracy: totalVotes > 0 ? Math.round((totalCorrect / totalVotes) * 100) : 0
          };
        });
        
        // Ordenar times por acertos
        teamScores.sort((a, b) => b.totalCorrect - a.totalCorrect);
        
        // Buscar informações dos usuários de cada time
        const rankingWithTeams = await Promise.all(
          teamScores.map(async (teamScore, index) => {
            const teamMembers = await Promise.all(
              teamScore.team.map(async (userId) => {
                const userDoc = await getDoc(doc(db, 'users', userId));
                const userData = userDoc.exists() ? userDoc.data() : { displayName: 'Usuário' };
                return {
                  userId: userId,
                  name: userData.displayName || 'Usuário'
                };
              })
            );
            
            return {
              teamIndex: teamScore.teamIndex,
              teamMembers: teamMembers,
              totalCorrect: teamScore.totalCorrect,
              totalVotes: teamScore.totalVotes,
              accuracy: teamScore.accuracy,
              position: index + 1,
              isWinner: index === 0
            };
          })
        );
        
        // Atualizar quizGroup com ranking de times e status
        await updateDoc(doc(db, 'quizGroups', quizGroupId), {
          ranking: rankingWithTeams,
          rankingType: 'teams',
          status: 'completed'
        });
        
        return rankingWithTeams;
      }
      
      // Modo Normal/Ghost: ranking individual
      const userScores = {};
      
      quizzes.forEach(quizDoc => {
        const quizData = quizDoc.data();
        const correctAnswer = quizData.correctAnswer;
        
        if (correctAnswer === null || correctAnswer === undefined) return;
        
        Object.entries(quizData.votes || {}).forEach(([userId, optionIndex]) => {
          if (!userScores[userId]) {
            userScores[userId] = { userId, correct: 0, total: 0 };
          }
          userScores[userId].total++;
          if (optionIndex === correctAnswer) {
            userScores[userId].correct++;
          }
        });
      });
      
      // Filtrar apenas quem respondeu todas
      const totalQuizzes = quizzes.length;
      const eligibleUsers = Object.values(userScores).filter(score => score.total === totalQuizzes);
      
      // Ordenar por acertos
      eligibleUsers.sort((a, b) => b.correct - a.correct);
      
      // Buscar informações dos usuários
      const rankingWithUsers = await Promise.all(
        eligibleUsers.map(async (score, index) => {
          const userDoc = await getDoc(doc(db, 'users', score.userId));
          const userData = userDoc.exists() ? userDoc.data() : { displayName: 'Usuário' };
          
          // Atribuir título baseado em posição
          let title = '';
          if (index === 0) title = 'Mestre da Previsão';
          else if (index === 1) title = 'Vidente';
          else if (index === 2) title = 'Profeta';
          else title = 'Adivinho';
          
          return {
            userId: score.userId,
            name: userData.displayName || 'Usuário',
            correct: score.correct,
            total: score.total,
            accuracy: Math.round((score.correct / score.total) * 100),
            points: score.correct, // 1 ponto por acerto
            title: title,
            position: index + 1
          };
        })
      );
      
      // Atualizar quizGroup com ranking e status
      await updateDoc(doc(db, 'quizGroups', quizGroupId), {
        ranking: rankingWithUsers,
        rankingType: 'individual',
        status: 'completed'
      });
      
      return rankingWithUsers;
    } catch (err) {
      console.error('Error calculating ranking:', err);
      throw err;
    }
  };

  // Obter detalhes do grupo de quiz
  const getQuizGroupDetails = async (quizGroupId) => {
    setLoading(true);
    setError(null);
    
    try {
      const quizGroupDoc = await getDoc(doc(db, 'quizGroups', quizGroupId));
      if (!quizGroupDoc.exists()) {
        throw new Error('Grupo de quiz não encontrado');
      }
      
      const quizGroupData = {
        id: quizGroupDoc.id,
        ...quizGroupDoc.data()
      };
      
      // Buscar quizzes
      if (quizGroupData.quizzes && quizGroupData.quizzes.length > 0) {
        const quizDocs = await Promise.all(
          quizGroupData.quizzes.map(qId => getDoc(doc(db, 'quizzes', qId)))
        );
        
        quizGroupData.quizzesData = quizDocs
          .filter(doc => doc.exists())
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        
        // Buscar informações dos votantes para avatares (modo normal)
        // E também membros dos times (modo Desafios)
        const allUserIds = new Set();
        
        // Coletar IDs dos votantes (modo normal)
        if (quizGroupData.mode === 'normal') {
          quizGroupData.quizzesData.forEach(quiz => {
            if (quiz.voterAvatars) {
              Object.values(quiz.voterAvatars).forEach(userIds => {
                if (Array.isArray(userIds)) {
                  userIds.forEach(uid => allUserIds.add(uid));
                }
              });
            }
          });
        }
        
        // Coletar IDs dos membros dos times (modo Desafios)
        if (quizGroupData.mode === 'challenge' && quizGroupData.challengeConfig?.teams) {
          quizGroupData.challengeConfig.teams.forEach(team => {
            if (Array.isArray(team)) {
              team.forEach(uid => allUserIds.add(uid));
            }
          });
        }
        
        // Buscar detalhes de todos os usuários de uma vez
        if (allUserIds.size > 0) {
          const userDocs = await Promise.all(
            Array.from(allUserIds).map(uid => getDoc(doc(db, 'users', uid)))
          );
          
          const voterDetailsMap = {};
          userDocs.forEach(userDoc => {
            if (userDoc.exists()) {
              voterDetailsMap[userDoc.id] = {
                uid: userDoc.id,
                ...userDoc.data()
              };
            }
          });
          
          // Adicionar voterDetails a cada quiz (modo normal)
          if (quizGroupData.mode === 'normal') {
            quizGroupData.quizzesData.forEach(quiz => {
              quiz.voterDetails = Object.values(voterDetailsMap);
            });
          }
          
          // Adicionar teamMemberDetails para modo Desafios
          if (quizGroupData.mode === 'challenge') {
            quizGroupData.teamMemberDetails = Object.values(voterDetailsMap);
          }
        }
      }
      
      return quizGroupData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obter quizzes do grupo de quiz
  const getQuizGroupQuizzes = async (quizGroupId) => {
    try {
      const quizGroupDoc = await getDoc(doc(db, 'quizGroups', quizGroupId));
      if (!quizGroupDoc.exists()) {
        throw new Error('Grupo de quiz não encontrado');
      }
      
      const quizGroupData = quizGroupDoc.data();
      if (!quizGroupData.quizzes || quizGroupData.quizzes.length === 0) {
        return [];
      }
      
      const quizDocs = await Promise.all(
        quizGroupData.quizzes.map(qId => getDoc(doc(db, 'quizzes', qId)))
      );
      
      return quizDocs
        .filter(doc => doc.exists())
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Configurar times para modo Desafios
  const setupChallengeTeams = async (quizGroupId, teams) => {
    if (!currentUser) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    setError(null);
    
    try {
      const quizGroupRef = doc(db, 'quizGroups', quizGroupId);
      const quizGroupDoc = await getDoc(quizGroupRef);
      
      if (!quizGroupDoc.exists()) {
        throw new Error('Grupo de quiz não encontrado');
      }
      
      const quizGroupData = quizGroupDoc.data();
      if (quizGroupData.createdBy !== currentUser.uid) {
        throw new Error('Apenas o criador pode configurar times');
      }
      
      await updateDoc(quizGroupRef, {
        challengeConfig: {
          teamSelection: 'manual',
          teams: teams
        }
      });
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obter grupos de quiz de um grupo
  const getGroupQuizGroups = async (groupId) => {
    try {
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (!groupDoc.exists()) {
        throw new Error('Grupo não encontrado');
      }
      
      const groupData = groupDoc.data();
      const quizGroupIds = groupData.quizGroups || [];
      
      if (quizGroupIds.length === 0) return [];
      
      const quizGroupDocs = await Promise.all(
        quizGroupIds.map(qgId => getDoc(doc(db, 'quizGroups', qgId)))
      );
      
      return quizGroupDocs
        .filter(doc => doc.exists())
        .map(doc => {
          const data = doc.data();
          const endTime = data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime);
          const isActive = data.status === 'active' && endTime > new Date();
          
          return {
            id: doc.id,
            ...data,
            endTime,
            isActive
          };
        })
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
          return bTime - aTime;
        });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Encerrar grupo de quiz
  const endQuizGroup = async (quizGroupId) => {
    if (!currentUser) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    setError(null);
    
    try {
      const quizGroupRef = doc(db, 'quizGroups', quizGroupId);
      const quizGroupDoc = await getDoc(quizGroupRef);
      
      if (!quizGroupDoc.exists()) {
        throw new Error('Grupo de quiz não encontrado');
      }
      
      const quizGroupData = quizGroupDoc.data();
      if (quizGroupData.createdBy !== currentUser.uid) {
        throw new Error('Apenas o criador pode encerrar o grupo de quiz');
      }
      
      await updateDoc(quizGroupRef, {
        status: 'completed'
      });
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Deletar grupo de quiz
  const deleteQuizGroup = async (quizGroupId, groupId) => {
    if (!currentUser) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    setError(null);
    
    try {
      const quizGroupRef = doc(db, 'quizGroups', quizGroupId);
      const quizGroupDoc = await getDoc(quizGroupRef);
      
      if (!quizGroupDoc.exists()) {
        throw new Error('Grupo de quiz não encontrado');
      }
      
      const quizGroupData = quizGroupDoc.data();
      if (quizGroupData.createdBy !== currentUser.uid) {
        throw new Error('Apenas o criador pode deletar o grupo de quiz');
      }
      
      // Deletar todos os quizzes associados
      if (quizGroupData.quizzes && quizGroupData.quizzes.length > 0) {
        const deletePromises = quizGroupData.quizzes.map(quizId =>
          deleteDoc(doc(db, 'quizzes', quizId))
        );
        await Promise.all(deletePromises);
      }
      
      // Deletar o quizGroup
      await deleteDoc(quizGroupRef);
      
      // Remover do grupo
      if (groupId) {
        const groupRef = doc(db, 'groups', groupId);
        await updateDoc(groupRef, {
          quizGroups: arrayRemove(quizGroupId)
        });
      }
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Buscar usuários por username/apelido
  const searchUsers = async (searchTerm) => {
    if (!currentUser) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    setError(null);
    
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const term = searchTerm.toLowerCase();
      const users = snapshot.docs
        .map(doc => ({
          uid: doc.id,
          ...doc.data()
        }))
        .filter(user => {
          const username = (user.username || '').toLowerCase();
          const displayName = (user.displayName || '').toLowerCase();
          const email = (user.email || '').toLowerCase();
          
          return username.includes(term) || 
                 displayName.includes(term) || 
                 email.includes(term);
        });
      
      return users;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Enviar convite para usuário (por userId ou email)
  const sendInvite = async (groupId, identifier, type) => {
    if (!currentUser) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    setError(null);
    
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Grupo não encontrado');
      }
      
      const groupData = groupDoc.data();
      
      // Verificar se é admin do grupo
      if (!groupData.admins || !groupData.admins.includes(currentUser.uid)) {
        throw new Error('Apenas admins podem enviar convites');
      }
      
      if (type === 'username') {
        // Convite por userId (usuário já cadastrado)
        const inviteRequest = {
          userId: identifier,
          groupId: groupId,
          invitedBy: currentUser.uid,
          type: 'invite',
          createdAt: Timestamp.now(),
          status: 'pending'
        };
        
        // Adicionar ao array de pendingRequests do grupo
        await updateDoc(groupRef, {
          pendingRequests: arrayUnion({
            userId: identifier,
            invitedBy: currentUser.uid,
            createdAt: Timestamp.now()
          })
        });
        
        // Criar notificação para o usuário (opcional - pode criar collection de notifications)
        // Por enquanto, apenas adiciona à lista de convites pendentes
        
      } else if (type === 'email') {
        // Convite por email (usuário pode não estar cadastrado)
        // Criar documento na collection de invites por email
        const invitesRef = collection(db, 'groupInvites');
        await addDoc(invitesRef, {
          groupId: groupId,
          email: identifier.toLowerCase(),
          invitedBy: currentUser.uid,
          createdAt: Timestamp.now(),
          status: 'pending'
        });
      }
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createGroup,
    searchPublicGroups,
    getUserGroups,
    getGroupDetails,
    sendJoinRequest,
    acceptJoinRequest,
    rejectJoinRequest,
    leaveGroup,
    createGroupQuiz,
    getGroupQuizzes,
    // Novas funções
    createQuizGroup,
    addQuizzesToGroup,
    voteOnQuiz,
    markCorrectAnswer,
    calculateRanking,
    getQuizGroupDetails,
    getQuizGroupQuizzes,
    setupChallengeTeams,
    getGroupQuizGroups,
    endQuizGroup,
    deleteQuizGroup,
    searchUsers,
    sendInvite
  };
}

