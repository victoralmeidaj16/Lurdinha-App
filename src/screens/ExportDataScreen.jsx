import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import {
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../hooks/useUserData';
import { useGroups } from '../hooks/useGroups';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function ExportDataScreen({ navigation }) {
  const { currentUser } = useAuth();
  const { userData } = useUserData();
  const { getUserGroups, getGroupQuizGroups } = useGroups();
  const [loading, setLoading] = useState(false);
  const [exported, setExported] = useState(false);

  const exportUserData = async () => {
    if (!currentUser) {
      Alert.alert('Erro', 'Usuário não autenticado');
      return;
    }

    try {
      setLoading(true);
      setExported(false);

      // 1. Dados básicos do usuário
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userDataExport = userDoc.exists() ? userDoc.data() : null;

      // 2. Grupos do usuário
      const userGroups = await getUserGroups();
      const groupsData = userGroups.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        isPublic: group.isPublic,
        createdAt: group.createdAt,
        memberCount: group.members?.length || 0,
      }));

      // 3. Quiz Groups do usuário
      const allQuizGroups = [];
      for (const group of userGroups) {
        try {
          const quizGroups = await getGroupQuizGroups(group.id);
          allQuizGroups.push(...quizGroups.map(qg => ({
            id: qg.id,
            title: qg.title,
            groupId: qg.groupId,
            groupName: qg.groupName,
            status: qg.status,
            createdAt: qg.createdAt,
            endTime: qg.endTime,
          })));
        } catch (error) {
          console.error(`Error fetching quiz groups for group ${group.id}:`, error);
        }
      }

      // 4. Votos do usuário em quizzes
      const votesData = [];
      for (const quizGroup of allQuizGroups) {
        try {
          const quizGroupDoc = await getDoc(doc(db, 'quizGroups', quizGroup.id));
          if (quizGroupDoc.exists()) {
            const quizGroupData = quizGroupDoc.data();
            if (quizGroupData.quizzes) {
              for (const quizId of quizGroupData.quizzes) {
                const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
                if (quizDoc.exists()) {
                  const quizData = quizDoc.data();
                  if (quizData.votes && quizData.votes[currentUser.uid] !== undefined) {
                    votesData.push({
                      quizId: quizId,
                      quizGroupId: quizGroup.id,
                      quizGroupTitle: quizGroup.title,
                      question: quizData.question,
                      vote: quizData.votes[currentUser.uid],
                      votedAt: quizData.votes[`${currentUser.uid}_timestamp`] || 'N/A',
                    });
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching votes for quiz group ${quizGroup.id}:`, error);
        }
      }

      // 5. Compilar todos os dados
      const exportData = {
        exportDate: new Date().toISOString(),
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userData: {
          displayName: userDataExport?.displayName || currentUser.displayName,
          email: currentUser.email,
          photoURL: userDataExport?.photoURL || currentUser.photoURL,
          createdAt: userDataExport?.createdAt || currentUser.metadata?.creationTime,
          stats: userDataExport?.stats || {},
        },
        groups: groupsData,
        quizGroups: allQuizGroups,
        votes: votesData,
        summary: {
          totalGroups: groupsData.length,
          totalQuizGroups: allQuizGroups.length,
          totalVotes: votesData.length,
        },
      };

      // 6. Converter para JSON formatado
      const jsonData = JSON.stringify(exportData, null, 2);

      // 7. Compartilhar os dados
      try {
        await Share.share({
          message: `Dados exportados do Lurdinha App\n\n${jsonData}`,
          title: 'Exportar Dados - Lurdinha',
        });
        setExported(true);
        Alert.alert(
          'Dados Exportados',
          'Seus dados foram preparados para exportação. Use a opção de compartilhamento para salvar ou enviar.',
          [{ text: 'OK' }]
        );
      } catch (shareError) {
        // Se Share não funcionar, mostrar os dados em um alerta
        Alert.alert(
          'Dados Exportados',
          `Seus dados foram preparados. Total: ${exportData.summary.totalGroups} grupos, ${exportData.summary.totalQuizGroups} quiz groups, ${exportData.summary.totalVotes} votos.`,
          [
            { text: 'OK' },
            {
              text: 'Ver JSON',
              onPress: () => {
                Alert.alert('Dados Exportados', jsonData.substring(0, 500) + '...');
              },
            },
          ]
        );
        setExported(true);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert(
        'Erro',
        'Não foi possível exportar seus dados. Tente novamente mais tarde.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Exportar Dados"
        subtitle="Baixe uma cópia dos seus dados"
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <FileText size={24} color="#8A4F9E" />
          <Text style={styles.infoTitle}>Exportação de Dados</Text>
          <Text style={styles.infoText}>
            Você pode solicitar uma cópia de todos os dados que coletamos sobre você.
            Esta é uma funcionalidade exigida pela LGPD (Lei Geral de Proteção de Dados).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>O que será exportado:</Text>
          <View style={styles.listItem}>
            <CheckCircle2 size={16} color="#32D583" />
            <Text style={styles.listText}>Informações da sua conta (nome, e-mail, foto)</Text>
          </View>
          <View style={styles.listItem}>
            <CheckCircle2 size={16} color="#32D583" />
            <Text style={styles.listText}>Estatísticas e histórico de uso</Text>
          </View>
          <View style={styles.listItem}>
            <CheckCircle2 size={16} color="#32D583" />
            <Text style={styles.listText}>Grupos que você participa ou criou</Text>
          </View>
          <View style={styles.listItem}>
            <CheckCircle2 size={16} color="#32D583" />
            <Text style={styles.listText}>Quiz groups que você criou</Text>
          </View>
          <View style={styles.listItem}>
            <CheckCircle2 size={16} color="#32D583" />
            <Text style={styles.listText}>Todos os seus votos em quizzes</Text>
          </View>
        </View>

        <View style={styles.warningCard}>
          <AlertCircle size={20} color="#FBBF24" />
          <Text style={styles.warningText}>
            Os dados serão exportados em formato JSON. Você pode salvar o arquivo ou compartilhá-lo.
          </Text>
        </View>

        {exported && (
          <View style={styles.successCard}>
            <CheckCircle2 size={20} color="#32D583" />
            <Text style={styles.successText}>
              Dados exportados com sucesso! Use a opção de compartilhamento para salvar.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.exportButton, loading && styles.exportButtonDisabled]}
          onPress={exportUserData}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Download size={20} color="#ffffff" />
              <Text style={styles.exportButtonText}>Exportar Meus Dados</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Conforme a LGPD, você tem direito de acessar, corrigir e exportar seus dados pessoais.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#fef3c7',
    lineHeight: 18,
  },
  successCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(50, 213, 131, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(50, 213, 131, 0.2)',
  },
  successText: {
    flex: 1,
    fontSize: 13,
    color: '#d1fae5',
    lineHeight: 18,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8A4F9E',
    borderRadius: 16,
    padding: 18,
    gap: 12,
    marginBottom: 20,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  footer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
});

