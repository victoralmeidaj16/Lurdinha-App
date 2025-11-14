import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Save } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../hooks/useUserData';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Header from '../components/Header';

const PRIMARY_PURPLE = '#9F63FF';

export default function EditProfileScreen({ navigation }) {
  const { currentUser } = useAuth();
  const { userData, updateUserPhoto } = useUserData();
  const [displayName, setDisplayName] = useState(userData?.displayName || '');
  const [photoURI, setPhotoURI] = useState(userData?.photoURL || null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (userData) {
      setDisplayName(userData.displayName || '');
      setPhotoURI(userData.photoURL || null);
    }
  }, [userData]);

  const pickImage = async (source) => {
    try {
      let result;
      
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar sua câmera.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        setPhotoURI(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Erro', 'O nome não pode estar vazio.');
      return;
    }

    if (displayName.trim().length < 2) {
      Alert.alert('Erro', 'O nome deve ter pelo menos 2 caracteres.');
      return;
    }

    try {
      setSaving(true);

      // Atualizar displayName no Firebase Auth
      if (currentUser && displayName.trim() !== currentUser.displayName) {
        await updateProfile(currentUser, {
          displayName: displayName.trim(),
        });
      }

      // Atualizar displayName no Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: displayName.trim(),
      });

      // Atualizar foto se foi alterada
      if (photoURI && photoURI !== userData?.photoURL && !photoURI.startsWith('http')) {
        await updateUserPhoto(photoURI);
      } else if (photoURI && photoURI !== userData?.photoURL && photoURI.startsWith('http')) {
        // Se já é uma URL (do Firebase), apenas atualizar no Firestore
        await updateDoc(doc(db, 'users', currentUser.uid), {
          photoURL: photoURI,
        });
      }

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o perfil. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Escolher foto',
      'Selecione uma opção',
      [
        { text: 'Câmera', onPress: () => pickImage('camera') },
        { text: 'Galeria', onPress: () => pickImage('gallery') },
        { text: 'Cancelar', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

  const getColorFromName = (name) => {
    const colors = [
      '#8b5cf6', '#FF6B35', '#4CAF50', '#2196F3',
      '#F44336', '#FFC107', '#E91E63', '#9C27B0',
      '#00BCD4', '#FF9800', '#795548', '#607D8B'
    ];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const showImage = photoURI && !photoURI.includes('pravatar');

  return (
    <View style={styles.container}>
      <Header
        title="Editar Perfil"
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Foto de Perfil */}
        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            {showImage ? (
              <Image source={{ uri: photoURI }} style={styles.photo} />
            ) : (
              <View
                style={[
                  styles.photoPlaceholder,
                  { backgroundColor: getColorFromName(displayName) },
                ]}
              >
                <Text style={styles.photoPlaceholderText}>
                  {getInitials(displayName)}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.editPhotoButton}
              onPress={showImageOptions}
              activeOpacity={0.8}
            >
              <Camera size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.photoHint}>
            Toque no ícone para alterar sua foto
          </Text>
        </View>

        {/* Nome */}
        <View style={styles.section}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Seu nome"
            placeholderTextColor="#6b7280"
            maxLength={50}
          />
          <Text style={styles.hint}>
            Este nome será exibido no app e nas suas interações
          </Text>
        </View>

        {/* Email (somente leitura) */}
        <View style={styles.section}>
          <Text style={styles.label}>E-mail</Text>
          <View style={styles.emailContainer}>
            <Text style={styles.emailText}>{currentUser?.email}</Text>
          </View>
          <Text style={styles.hint}>
            O e-mail não pode ser alterado
          </Text>
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving || !displayName.trim()}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Save size={20} color="#ffffff" />
              <Text style={styles.saveButtonText}>Salvar Alterações</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: PRIMARY_PURPLE,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: PRIMARY_PURPLE,
  },
  photoPlaceholderText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#000000',
  },
  photoHint: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#374151',
  },
  emailContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  emailText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: PRIMARY_PURPLE,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 32,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

