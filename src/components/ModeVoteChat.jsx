import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Send } from 'lucide-react-native';

// Chat ao vivo do lobby entre um jogo e outro, enquanto a sala escolhe a próxima modalidade.
export default function ModeVoteChat({ messages = [], currentUid, onSend }) {
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const scrollRef = useRef(null);
    const visible = messages.slice(-30);

    useEffect(() => {
        scrollRef.current?.scrollToEnd?.({ animated: true });
    }, [messages.length]);

    const handleSend = async () => {
        const trimmed = text.trim();
        if (!trimmed || sending) return;
        setSending(true);
        try {
            await onSend(trimmed);
            setText('');
        } finally {
            setSending(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.kicker}>CHAT AO VIVO</Text>
            <ScrollView
                ref={scrollRef}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                nestedScrollEnabled
            >
                {visible.length === 0 ? (
                    <Text style={styles.empty}>Defenda seu modo favorito 👀</Text>
                ) : visible.map((message) => {
                    const mine = message.uid === currentUid;
                    return (
                        <View key={message.id} style={[styles.bubble, mine && styles.bubbleMine]}>
                            {!mine && <Text style={styles.author} numberOfLines={1}>{message.name}</Text>}
                            <Text style={styles.message}>{message.text}</Text>
                        </View>
                    );
                })}
            </ScrollView>
            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    value={text}
                    onChangeText={setText}
                    placeholder="Mande uma mensagem..."
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    maxLength={120}
                    returnKeyType="send"
                    onSubmitEditing={handleSend}
                    blurOnSubmit={false}
                />
                <TouchableOpacity
                    style={[styles.sendButton, (!text.trim() || sending) && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!text.trim() || sending}
                    accessibilityRole="button"
                    accessibilityLabel="Enviar mensagem"
                >
                    <Send size={18} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
        backgroundColor: 'rgba(0,0,0,0.25)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 14,
    },
    kicker: {
        color: '#C4B5FD',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.4,
        marginBottom: 10,
    },
    list: {
        maxHeight: 180,
    },
    listContent: {
        gap: 6,
        paddingBottom: 4,
    },
    empty: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 13,
        textAlign: 'center',
        paddingVertical: 12,
    },
    bubble: {
        alignSelf: 'flex-start',
        maxWidth: '85%',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 14,
        borderTopLeftRadius: 4,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    bubbleMine: {
        alignSelf: 'flex-end',
        backgroundColor: '#7C3AED',
        borderTopLeftRadius: 14,
        borderTopRightRadius: 4,
    },
    author: {
        color: '#C4B5FD',
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 2,
    },
    message: {
        color: '#fff',
        fontSize: 14,
        lineHeight: 19,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 10,
    },
    input: {
        flex: 1,
        height: 44,
        borderRadius: 22,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        color: '#fff',
        fontSize: 14,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#8B5CF6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.4,
    },
});
