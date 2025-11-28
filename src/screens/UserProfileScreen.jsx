import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Image
} from 'react-native';
import { ArrowLeft, Flame, Star, Smile, Users } from 'lucide-react-native';
import { useUserData } from '../hooks/useUserData';

function StatCard({ icon, title, value, right, glow }) {
    const Icon = icon;
    return (
        <View style={[styles.statCard, glow && styles.statCardGlow]}>
            <View style={styles.statCardHeader}>
                <Icon size={20} color={glow ? '#fbbf24' : '#9ca3af'} />
                <Text style={[styles.statCardTitle, glow && styles.statCardTitleGlow]}>
                    {title}
                </Text>
            </View>
            <Text style={[styles.statCardValue, glow && styles.statCardValueGlow]}>
                {value}
            </Text>
            {right && (
                <View style={styles.statCardRight}>
                    <Text style={styles.statCardRightText}>{right}</Text>
                </View>
            )}
        </View>
    );
}

export default function UserProfileScreen({ navigation, route }) {
    const { userId } = route.params;
    const { getUserProfile } = useUserData();
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadUserProfile();
    }, [userId]);

    const loadUserProfile = async () => {
        try {
            setLoading(true);
            const profile = await getUserProfile(userId);
            if (profile) {
                setUserProfile(profile);
            } else {
                setError('Usuário não encontrado');
            }
        } catch (err) {
            setError('Erro ao carregar perfil');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
        );
    }

    if (error || !userProfile) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <ArrowLeft size={24} color="#ffffff" />
                    </TouchableOpacity>
                </View>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error || 'Perfil indisponível'}</Text>
                </View>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft size={24} color="#ffffff" />
                </TouchableOpacity>
            </View>

            {/* Profile Info */}
            <View style={styles.profileInfo}>
                <View style={styles.avatar}>
                    {userProfile.photoURL ? (
                        <Image
                            source={{ uri: userProfile.photoURL }}
                            style={styles.avatarImage}
                        />
                    ) : (
                        <Text style={styles.avatarText}>
                            {userProfile.displayName?.charAt(0) || 'U'}
                        </Text>
                    )}
                </View>
                <Text style={styles.userName}>{userProfile.displayName}</Text>
                <Text style={styles.userJoined}>
                    Membro desde {userProfile.createdAt?.toDate ? userProfile.createdAt.toDate().toLocaleDateString() : 'Data desconhecida'}
                </Text>
            </View>

            {/* Stats */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Estatísticas</Text>
                <View style={styles.statsContainer}>
                    <StatCard
                        icon={Flame}
                        title="Sequência"
                        value={userProfile.stats?.fireStreak || 0}
                        right="dias"
                        glow={userProfile.stats?.fireStreak > 0}
                    />
                    <StatCard
                        icon={Star}
                        title="Acertos"
                        value={userProfile.stats?.acertos || 0}
                        right="total"
                        glow={userProfile.stats?.acertos > 0}
                    />
                    <StatCard
                        icon={Smile}
                        title="Votos"
                        value={userProfile.stats?.enquetesVotadas || 0}
                        right="total"
                    />
                    <StatCard
                        icon={Users}
                        title="Grupos"
                        value={userProfile.stats?.grupos || 0}
                        right="total"
                    />
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 16,
    },
    profileInfo: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#8b5cf6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        color: '#ffffff',
        fontSize: 40,
        fontWeight: 'bold',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
    },
    userJoined: {
        fontSize: 14,
        color: '#9ca3af',
    },
    section: {
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 32,
    },
    statCard: {
        backgroundColor: '#1f2937',
        borderRadius: 16,
        padding: 16,
        width: '48%',
        aspectRatio: 1,
        justifyContent: 'space-between',
    },
    statCardGlow: {
        borderWidth: 1,
        borderColor: '#fbbf24',
        shadowColor: '#fbbf24',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    statCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statCardTitle: {
        fontSize: 14,
        color: '#9ca3af',
        marginLeft: 8,
    },
    statCardTitleGlow: {
        color: '#fbbf24',
    },
    statCardValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    statCardValueGlow: {
        color: '#fbbf24',
    },
    statCardRight: {
        position: 'absolute',
        right: 16,
        top: 16,
    },
    statCardRightText: {
        fontSize: 12,
        color: '#9ca3af',
    },
});
