import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { AlertTriangle, Trash2 } from 'lucide-react-native';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { doc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { db, auth } from '../firebase';

export default function DeleteAccountScreen({ navigation }) {
  const { currentUser, logout } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const requiredText = 'DELETAR';
  const isConfirmValid = confirmText === requiredText;

  const handleDeleteAccount = async () => {
    if (!isConfirmValid) {
      Alert.alert('Erro', `Digite "${requiredText}" para confirmar`);
      return;
    }

    Alert.alert(
      'Confirmar Exclusão',
      'Esta ação é IRREVERSÍVEL. Todos os seus dados serão permanentemente excluídos:\n\n' +
      '• Sua conta e perfil\n' +
      '• Todos os grupos que você criou\n' +
      '• Todos os seus votos e respostas\n' +
      '• Todas as suas estatísticas\n\n' +
      'Tem certeza absoluta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sim, Deletar Conta',
          style: 'destructive',
          onPress: async () => {
            // Se ainda não mostrou o campo de senha, mostrar primeiro
            if (!showPasswordInput) {
              setShowPasswordInput(true);
              return;
            }

            // Validar senha
            if (!password || password.length < 6) {
              Alert.alert('Erro', 'Por favor, digite sua senha para confirmar a exclusão.');
              return;
            }

            try {
              setLoading(true);
              
              if (!currentUser?.uid || !currentUser?.email) {
                throw new Error('Usuário não autenticado');
              }

              // 1. Reautenticar o usuário antes de deletar (requisito do Firebase)
              try {
                const credential = EmailAuthProvider.credential(
                  currentUser.email,
                  password
                );
                await reauthenticateWithCredential(auth.currentUser, credential);
              } catch (reauthError) {
                console.error('Reauthentication error:', reauthError);
                if (reauthError.code === 'auth/wrong-password') {
                  Alert.alert('Erro', 'Senha incorreta. Por favor, tente novamente.');
                  setPassword('');
                  setLoading(false);
                  return;
                } else if (reauthError.code === 'auth/too-many-requests') {
                  Alert.alert('Erro', 'Muitas tentativas. Por favor, tente novamente mais tarde.');
                  setPassword('');
                  setLoading(false);
                  return;
                } else {
                  Alert.alert(
                    'Erro de Autenticação',
                    'Não foi possível verificar sua identidade. Por favor, faça logout e login novamente, depois tente excluir a conta.'
                  );
                  setPassword('');
                  setLoading(false);
                  return;
                }
              }

              // 2. Deletar documento do usuário
              await deleteDoc(doc(db, 'users', currentUser.uid));

              // 3. Remover usuário de grupos (como membro)
              const groupsQuery = query(
                collection(db, 'groups'),
                where('members', 'array-contains', currentUser.uid)
              );
              const groupsSnapshot = await getDocs(groupsQuery);
              
              const batch = writeBatch(db);
              groupsSnapshot.forEach((groupDoc) => {
                const groupData = groupDoc.data();
                const updatedMembers = (groupData.members || []).filter(
                  (uid) => uid !== currentUser.uid
                );
                const updatedAdmins = (groupData.admins || []).filter(
                  (uid) => uid !== currentUser.uid
                );
                
                batch.update(groupDoc.ref, {
                  members: updatedMembers,
                  admins: updatedAdmins,
                });
              });
              await batch.commit();

              // 4. Se o usuário criou grupos, marcar como deletados ou transferir
              const createdGroupsQuery = query(
                collection(db, 'groups'),
                where('createdBy', '==', currentUser.uid)
              );
              const createdGroupsSnapshot = await getDocs(createdGroupsQuery);
              
              // Para grupos criados, você pode deletar ou transferir administração
              // Por segurança, vamos apenas remover o criador dos admins
              const createdBatch = writeBatch(db);
              createdGroupsSnapshot.forEach((groupDoc) => {
                const groupData = groupDoc.data();
                const updatedAdmins = (groupData.admins || []).filter(
                  (uid) => uid !== currentUser.uid
                );
                createdBatch.update(groupDoc.ref, {
                  createdBy: updatedAdmins[0] || null,
                  admins: updatedAdmins,
                });
              });
              await createdBatch.commit();

              // 5. Remover votos do usuário em quizzes
              const quizzesQuery = query(collection(db, 'quizzes'));
              const quizzesSnapshot = await getDocs(quizzesQuery);
              
              const quizzesBatch = writeBatch(db);
              quizzesSnapshot.forEach((quizDoc) => {
                const quizData = quizDoc.data();
                if (quizData.votes && quizData.votes[currentUser.uid]) {
                  const updatedVotes = { ...quizData.votes };
                  delete updatedVotes[currentUser.uid];
                  
                  // Atualizar voterAvatars se existir
                  const updatedVoterAvatars = { ...quizData.voterAvatars };
                  Object.keys(updatedVoterAvatars).forEach((optionIndex) => {
                    if (Array.isArray(updatedVoterAvatars[optionIndex])) {
                      updatedVoterAvatars[optionIndex] = updatedVoterAvatars[optionIndex].filter(
                        (uid) => uid !== currentUser.uid
                      );
                    }
                  });
                  
                  quizzesBatch.update(quizDoc.ref, {
                    votes: updatedVotes,
                    voterAvatars: updatedVoterAvatars,
                  });
                }
              });
              await quizzesBatch.commit();

              // 6. Deletar usuário do Firebase Auth
              if (auth.currentUser) {
                await deleteUser(auth.currentUser);
              }

              Alert.alert(
                'Conta Excluída',
                'Sua conta foi excluída com sucesso. Você será desconectado.',
                [
                  {
                    text: 'OK',
                    onPress: async () => {
                      await logout();
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Error deleting account:', error);
              let errorMessage = 'Não foi possível excluir sua conta. Por favor, tente novamente mais tarde.';
              
              if (error.code === 'auth/requires-recent-login') {
                errorMessage = 'Por segurança, você precisa fazer login novamente antes de excluir sua conta. Faça logout e login novamente.';
              } else if (error.message) {
                errorMessage = `Erro: ${error.message}`;
              }
              
              Alert.alert('Erro', errorMessage);
              setPassword('');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Header
          title="Excluir Conta"
          onBack={() => navigation.goBack()}
        />

        <View style={styles.content}>
          <View style={styles.warningCard}>
            <AlertTriangle size={32} color="#F44336" />
            <Text style={styles.warningTitle}>Atenção: Esta ação é irreversível</Text>
            <Text style={styles.warningText}>
              Ao excluir sua conta, todos os seus dados serão permanentemente removidos:
            </Text>
            <View style={styles.warningList}>
              <Text style={styles.warningItem}>• Seu perfil e informações pessoais</Text>
              <Text style={styles.warningItem}>• Todas as suas estatísticas e progresso</Text>
              <Text style={styles.warningItem}>• Seus votos em enquetes</Text>
              <Text style={styles.warningItem}>• Sua participação em grupos</Text>
              <Text style={styles.warningItem}>• Todos os grupos que você criou</Text>
            </View>
          </View>

          <View style={styles.confirmSection}>
            <Text style={styles.confirmLabel}>
              Para confirmar, digite <Text style={styles.confirmRequired}>DELETAR</Text> abaixo:
            </Text>
            <TextInput
              style={[
                styles.confirmInput,
                confirmText.length > 0 && !isConfirmValid && styles.confirmInputError,
              ]}
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="Digite DELETAR"
              placeholderTextColor="#71717a"
              autoCapitalize="characters"
            />
            {confirmText.length > 0 && !isConfirmValid && (
              <Text style={styles.errorText}>
                O texto deve ser exatamente "{requiredText}"
              </Text>
            )}

            {showPasswordInput && (
              <View style={styles.passwordSection}>
                <Text style={styles.passwordLabel}>
                  Por segurança, digite sua senha para confirmar:
                </Text>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Digite sua senha"
                  placeholderTextColor="#71717a"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.passwordHint}>
                  Esta é uma medida de segurança para proteger sua conta.
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.deleteButton,
              (!isConfirmValid || (showPasswordInput && !password) || loading) && styles.deleteButtonDisabled,
            ]}
            onPress={handleDeleteAccount}
            disabled={!isConfirmValid || (showPasswordInput && !password) || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Trash2 size={20} color="#FFFFFF" />
                <Text style={styles.deleteButtonText}>Excluir Minha Conta Permanentemente</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.helpText}>
            Se você tiver dúvidas ou precisar de ajuda, entre em contato conosco através 
            das configurações do aplicativo antes de excluir sua conta.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  warningCard: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderWidth: 2,
    borderColor: '#F44336',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  warningList: {
    alignSelf: 'stretch',
    gap: 8,
  },
  warningItem: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  confirmSection: {
    marginBottom: 24,
  },
  confirmLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  confirmRequired: {
    fontWeight: '700',
    color: '#F44336',
  },
  confirmInput: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#3f3f46',
  },
  confirmInputError: {
    borderColor: '#F44336',
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginTop: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  deleteButtonDisabled: {
    backgroundColor: '#71717a',
    opacity: 0.5,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  helpText: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
    lineHeight: 20,
  },
  passwordSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  passwordLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  passwordInput: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#3f3f46',
    marginBottom: 8,
  },
  passwordHint: {
    fontSize: 12,
    color: '#71717a',
    fontStyle: 'italic',
  },
});

