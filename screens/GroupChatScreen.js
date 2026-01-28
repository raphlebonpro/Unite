import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import {
View,
Text,
StyleSheet,
TextInput,
TouchableOpacity,
FlatList,
KeyboardAvoidingView,
Platform,
Image,
SafeAreaView,
Alert,
Modal,
Pressable,
} from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '../context/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import { notifyGroupNewMessage } from '../helpers/notifications';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from '@react-navigation/native';
import { useChatActivity } from '../context/ChatActivityContext';

const BUBBLE_MY = '#1877F2';
const BUBBLE_OTHER = '#fff';
const BUBBLE_SHADOW = "#E7E7E7";
const GRADIENT_COLORS = ['#FF6F3C', '#FFB347'];
const PERSPECTIVE_API_KEY = "AIzaSyBLwtXh-7pCvosyYAj02e0C8saAOr_-GlI";

if (typeof global !== "undefined") global.Buffer = Buffer;

const BAD_WORDS = [
'pd', 'pédé', 'fdp', 'enculé', 'ntm', 'nique ta mère', 'sale negre', 'negro', 'batard', 'tg', 'connard', 'sale noir',
'pute', 'salope', 'bougnoule', 'youpin', 'encule', 'encu', 'nègre', 'negro', 'juif', 'negre', 'arabe',
'nique', 'sale', 'n3gre', 'negr3', 'nik', 'negr0', 'nazi', 'bz', 'race', 'noirs', 'tana', 'pute', 'baise', 'foudroyeur', 'renoi'
];

// --------- DÉTECTION DE LIENS ---------
function containsLink(text) {
// Regex pour détecter les liens type http(s):// ou www.
const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
return urlRegex.test(text);
}

function containsBadWord(text) {
  const lower = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return BAD_WORDS.some(word => {
    // on ne bloque que si le mot est isolé, pas comme sous-chaîne
    const regex = new RegExp(`\\b${word}\\b`, "i");
    return regex.test(lower);
  });
}

// --------- AJOUT DE LA FONCTION DE MODÉRATION -----------
async function analyzeMessageWithPerspective(text) {
try {
  const res = await fetch(
    `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${PERSPECTIVE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        comment: { text },
        languages: ["fr"],
        requestedAttributes: { TOXICITY: {} }
      })
    }
  );
  const data = await res.json();
  const score = data.attributeScores?.TOXICITY?.summaryScore?.value ?? 0;
  return score;
} catch (e) {
  return 0;
}
}
// ---------------------------------------------------------

export default function GroupChatScreen({ route, navigation }) {
  const { groupId } = route.params;
const { user } = useUser();
const [group, setGroup] = useState(null);
const [messages, setMessages] = useState([]);
const [input, setInput] = useState('');
const flatListRef = useRef();

const [showImageModal, setShowImageModal] = useState(false);
const [modalImageUrl, setModalImageUrl] = useState('');

const lastMessageAtRef = useRef(null);

const hasAutoScrolledRef = useRef(false);

const { setActiveGroupChatId } = useChatActivity();

const insets = useSafeAreaInsets();

const APPBAR_H = 56;

// Maintenant tu peux calculer
const headerOffset = Platform.OS === "ios"
  ? insets.top + APPBAR_H   // iOS → notch + header
  : APPBAR_H;               // Android → juste header

useLayoutEffect(() => {
  navigation.setOptions({ headerShown: false });
}, [navigation]);

useEffect(() => {
  const fetchGroup = async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('name, cover_url')
      .eq('id', groupId)
      .single();
    if (!error) setGroup(data);
  };
  fetchGroup();
}, [groupId]);

useFocusEffect(
  React.useCallback(() => {
    setActiveGroupChatId(groupId);

    return () => {
      setActiveGroupChatId(null);
    };
  }, [groupId])
);

const fetchMessages = async () => {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      users:users!messages_sender_id_fkey(id, username, profile_photo)
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) return;

  setMessages(data || []);

  if (!hasAutoScrolledRef.current) {
  requestAnimationFrame(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    hasAutoScrolledRef.current = true;
  });
}

  if (data && data.length > 0) {
    lastMessageAtRef.current = data[data.length - 1].created_at;

    await AsyncStorage.setItem(
      `last_seen_group_${groupId}_${user.id}`,
      lastMessageAtRef.current
    );
  }
};

useEffect(() => {
  if (!messages.length || !user || !groupId) return;
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.sender_id !== user.id) {
    AsyncStorage.getItem(`last_seen_group_${groupId}_${user.id}`).then(lastSeen => {
      if (!lastSeen || new Date(lastMessage.created_at) > new Date(lastSeen)) {
      }
    });
  }
}, [messages]);

useEffect(() => {
  let isActive = true;

  const channel = supabase
    .channel(`group-messages-${groupId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `group_id=eq.${groupId}`,
      },
      async (payload) => {
        if (!isActive) return;

        // 🔥 Ignore tes propres messages (optimistic déjà affiché)
        if (payload.new.sender_id === user.id) return;

        const { data } = await supabase
          .from('messages')
          .select(`
            *,
            users:users!messages_sender_id_fkey(id, username, profile_photo)
          `)
          .eq('id', payload.new.id)
          .single();

        if (!data) return;

        setMessages(prev => {
          if (prev.some(m => m.id === data.id)) return prev;
          return [data, ...prev];
        });

        requestAnimationFrame(() => {
        });
      }
    )
    .subscribe();

  return () => {
    isActive = false;
    supabase.removeChannel(channel);
  };
}, [groupId, user.id]);

useEffect(() => {
  fetchMessages();
}, [groupId]);

useEffect(() => {
  const interval = setInterval(async () => {
    if (!groupId) return;

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        users:users!messages_sender_id_fkey(id, username, profile_photo)
      `)
      .eq('group_id', groupId)
      .gt(
        'created_at',
        lastMessageAtRef.current || '1970-01-01'
      )
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) return;

    setMessages(prev => {
      const existingIds = new Set(prev.map(m => m.id));
      const newOnes = data.filter(m => !existingIds.has(m.id));
      return [...newOnes, ...prev];
    });

    lastMessageAtRef.current = data[data.length - 1].created_at;
  }, 2500);

  return () => clearInterval(interval);
}, [groupId]);

// --------- FONCTION ENVOI MESSAGE TEXTE ---------
const sendMessage = async () => {
  const trimmed = input.trim();
  if (trimmed === '') return;

  // 🔒 Modération insultes
  if (containsBadWord(trimmed)) {
    Alert.alert(
      "Message bloqué",
      "Ton message contient des propos insultants, haineux ou inappropriés.\nMerci de reformuler."
    );
    return;
  }

  // 🔒 Blocage des liens
  if (containsLink(trimmed)) {
    Alert.alert(
      "Message bloqué",
      "L’envoi de liens ou d’URL est interdit dans les messages pour des raisons de sécurité."
    );
    return;
  }

  setInput('');

  const tempId = `tmp-${Date.now()}`;

const optimisticMessage = {
  id: tempId,
  group_id: groupId,
  sender_id: user.id,
  content: trimmed,
  created_at: new Date().toISOString(),
  users: {
    id: user.id,
    username: user.username,
    profile_photo: user.profile_photo,
  },
};

setMessages(prev => [optimisticMessage, ...prev]);
setInput('');

  try {
    // 💾 Insertion du message
const { data: inserted, error: msgErr } = await supabase
  .from('messages')
  .insert({
    group_id: groupId,
    sender_id: user.id,
    content: trimmed,
  })
  .select(`
    *,
    users:users!messages_sender_id_fkey(id, username, profile_photo)
  `)
  .single();

  setMessages(prev =>
  prev.map(m => (m.id === tempId ? inserted : m))
);

    // 🔔 Notification push aux autres membres du groupe
    await notifyGroupNewMessage({
      groupId,
      senderId: user.id,
      senderName: user.username || user.email.split('@')[0],
      groupName: group?.name || 'Groupe',
    });

  } catch (err) {
    Alert.alert("Erreur", "Erreur lors de l'envoi du message : " + (err.message || err));
  }
};

// --------- ENVOI MESSAGE IMAGE ---------
const sendImageMessage = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission requise', 'Autorise l’accès à la galerie pour envoyer une image.');
    return;
  }

  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.cancelled || !result.assets || !result.assets[0].uri) {
    return;
  }

  try {
    const asset = result.assets[0];
    const fileUri = asset.uri;
    const fileExt = fileUri.split('.').pop() || 'jpg';
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;

    // 📤 Conversion base64 → buffer
    const fileBase64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
    const fileBuffer = Buffer.from(fileBase64, 'base64');

    // 🧩 Upload vers Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('messages-images')
      .upload(fileName, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });
    if (uploadError) throw uploadError;

    // 🌍 Récupération de l’URL publique
    const { data: urlData, error: urlError } = await supabase
      .storage
      .from('messages-images')
      .getPublicUrl(fileName);
    if (urlError) throw urlError;

    const imageUrl = urlData.publicUrl;

    // 💾 Insertion du message image
    const { error: msgErr } = await supabase.from('messages').insert([
      {
        group_id: groupId,
        sender_id: user.id,
        content: '',
        image_url: imageUrl,
      }
    ]);
    if (msgErr) throw msgErr;

    // 🔔 Notification push aux autres membres
    await notifyGroupNewMessage({
      groupId,
      senderId: user.id,
      senderName: user.username || user.email.split('@')[0],
      groupName: group?.name || 'Groupe',
    });

  } catch (err) {
    Alert.alert("Erreur", "Erreur lors de l'envoi de l'image : " + (err.message || err));
  }
};

// --------- AFFICHAGE DES MESSAGES ---------
const renderItem = ({ item }) => {
  const isMe = item.sender_id === user.id;
  const timeStr = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  // --------- MESSAGE SYSTÈME ---------
if (!item.sender_id && item.content) {
  return (
    <View style={{ alignItems: 'center', marginVertical: 10 }}>
      <Text style={{
        fontSize: hp('1.7%'),
        color: '#888',
        fontStyle: 'italic',
        textAlign: 'center',
        maxWidth: '80%'
      }}>
        {item.content}
      </Text>
    </View>
  );
}
  if (item.image_url) {
    return (
      <View style={isMe ? styles.rowRight : styles.rowLeft}>
        {!isMe &&
          <TouchableOpacity
            onPress={() => navigation.navigate('UserProfile', { userId: item.sender_id })}
            activeOpacity={0.75}
          >
            <Image
              source={
                item.users?.profile_photo
                  ? { uri: item.users.profile_photo }
                  : require('../assets/avatar-default.png')
              }
              style={styles.avatarImg}
            />
          </TouchableOpacity>
        }
        <View>
          {!isMe &&
            <Text style={styles.pseudo}>{item.users?.username || "Utilisateur"}</Text>
          }
          <View style={styles.imageBubble}>
            <TouchableOpacity
              activeOpacity={0.93}
              onPress={() => {
                setModalImageUrl(item.image_url);
                setShowImageModal(true);
              }}
            >
              <Image
                source={{ uri: item.image_url }}
                style={{ width: 150, height: 150, borderRadius: 12, marginBottom: 6, backgroundColor: '#eee' }}
                resizeMode="cover"
              />
            </TouchableOpacity>
            <Text style={[styles.timeInBubble, { alignSelf: 'flex-end' }]}>{timeStr}</Text>
          </View>
        </View>
      </View>
    );
  }

  // MESSAGE TEXTE
  if (isMe) {
    return (
      <View style={styles.rowRight}>
        <View style={styles.myBubble}>
          <Text style={styles.myText}>
            {item.content}
          </Text>
          <Text style={styles.timeInBubble}>{timeStr}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.rowLeft}>
      <TouchableOpacity
        onPress={() => navigation.navigate('UserProfile', { userId: item.sender_id })}
        activeOpacity={0.75}
      >
        <Image
          source={
            item.users?.profile_photo
              ? { uri: item.users.profile_photo }
              : require('../assets/avatar-default.png')
          }
          style={styles.avatarImg}
        />
      </TouchableOpacity>
      <View>
        <Text style={styles.pseudo}>{item.users?.username || "Utilisateur"}</Text>
        <View style={styles.otherBubble}>
          <Text style={styles.otherText}>
            {item.content}
          </Text>
          <Text style={styles.timeInBubbleOther}>{timeStr}</Text>
        </View>
      </View>
    </View>
  );
};

return (
  <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
    {/* HEADER */}
<View
  style={[
    styles.header,
    {
      paddingTop: 0,
      height: APPBAR_H, // 56 strict
    },
  ]}
>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
        <Ionicons name="chevron-back" size={26} color="#232323" />
      </TouchableOpacity>
<TouchableOpacity
  style={styles.headerAvatar}
  onPress={() => navigation.goBack()}
  activeOpacity={0.7}
>
  {group?.cover_url ? (
    <Image
      source={{ uri: group.cover_url }}
      style={styles.headerAvatarImg}
      resizeMode="cover"
    />
  ) : (
    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
      {group?.name ? group.name[0].toUpperCase() : 'G'}
    </Text>
  )}
</TouchableOpacity>
      <TouchableOpacity
        style={{ flex: 1, justifyContent: 'center' }}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Text style={styles.headerTitle} numberOfLines={1}>
          {group?.name || 'Groupe'}
        </Text>
      </TouchableOpacity>
    </View>

    {Platform.OS === 'ios' ? (
      /* iOS */
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={APPBAR_H}
      >
<FlatList
  ref={flatListRef}
  inverted
  data={messages}
  renderItem={renderItem}
  keyExtractor={(item) => String(item.id)}
  showsVerticalScrollIndicator={false}
  keyboardShouldPersistTaps="handled"
  contentContainerStyle={{
  paddingBottom: hp('2%'),
  paddingTop: Platform.OS === 'ios' ? 12 : headerOffset - 30,
  }}
/>

        {/* Input fixé */}
        <View style={styles.inputBarContainer}>
          <View style={styles.textBox}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Message..."
              placeholderTextColor="#AAA"
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              multiline
            />
            <TouchableOpacity
              style={styles.imageButton}
              onPress={sendImageMessage}
            >
              <Ionicons name="image-outline" size={22} color="#444" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.sendButtonWrap}
            onPress={sendMessage}
            activeOpacity={input.trim() === '' ? 1 : 0.7}
            disabled={input.trim() === ''}
          >
            <LinearGradient
              colors={GRADIENT_COLORS}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={styles.sendButton}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    ) : (
      /* Android */
<KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === "android" ? "height" : "padding"}
  keyboardVerticalOffset={Platform.OS === "ios" ? headerOffset : 30}
>
<FlatList
  ref={flatListRef}
  inverted
  data={messages}
  renderItem={renderItem}
  keyExtractor={(item) => String(item.id)}
  showsVerticalScrollIndicator={false}
  keyboardShouldPersistTaps="handled"
  contentContainerStyle={{
  paddingBottom: hp('2,5%'),
  paddingTop: headerOffset - 30,
  }}
  />

  {/* Barre input fixée */}
  <View style={styles.inputBarContainer}>
    <View style={styles.textBox}>
      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        placeholder="Message..."
        placeholderTextColor="#AAA"
        onSubmitEditing={sendMessage}
        returnKeyType="send"
        multiline
      />
      <TouchableOpacity
        style={styles.imageButton}
        onPress={sendImageMessage}
      >
        <Ionicons name="image-outline" size={22} color="#444" />
      </TouchableOpacity>
    </View>
    <TouchableOpacity
      style={styles.sendButtonWrap}
      onPress={sendMessage}
      activeOpacity={input.trim() === '' ? 1 : 0.7}
      disabled={input.trim() === ''}
    >
      <LinearGradient
        colors={GRADIENT_COLORS}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={styles.sendButton}
      >
        <Ionicons name="send" size={18} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
  </View>
</KeyboardAvoidingView>
    )}

    {/* Modal en dehors du ternaire */}
    <Modal
      visible={showImageModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowImageModal(false)}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.96)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onPress={() => setShowImageModal(false)}
      >
        <Image
          source={{ uri: modalImageUrl }}
          style={{
            width: '93%',
            height: '70%',
            borderRadius: 24,
            backgroundColor: '#111',
            resizeMode: 'contain',
          }}
        />
      </Pressable>
    </Modal>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('3.5%'),   // 13
    paddingTop: hp('1.4%'),          // 11
    paddingBottom: hp('1.1%'),       // 9
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F2',
  },
  headerBack: { 
    padding: wp('0.5%'),             // 2
    marginRight: wp('2%')            // 8
  },
headerAvatar: {
  width: 38,
  height: 38,
  borderRadius: 19,
  backgroundColor: '#999',
  alignItems: 'center',
  justifyContent: 'center',
  marginHorizontal: 10,
  overflow: 'hidden', // ✅ important pour que l’image soit arrondie
},
headerAvatarImg: {
  width: 38,
  height: 38,
  borderRadius: 19,
  backgroundColor: '#ddd',
},
  headerTitle: {
    fontSize: hp('2%'),              // 16
    fontWeight: '800',
    color: '#232323',
    maxWidth: wp('45%'),             // 170
    letterSpacing: 0,
  },
  messagesList: { flex: 1 },
  rowRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: wp('3.5%'),   // 13
    marginVertical: hp('0.25%'),     // 2
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: wp('3.5%'),
    marginVertical: hp('0.25%'),
  },
  myBubble: {
    maxWidth: wp('85%'),             // 320
    minWidth: wp('16%'),             // 58
    borderRadius: wp('4.8%'),        // 18
    paddingHorizontal: wp('4%'),     // 15
    paddingVertical: hp('1%'),       // 8
    backgroundColor: BUBBLE_MY,
    alignItems: 'flex-start',
    marginLeft: wp('9%'),            // 35
    marginBottom: hp('0.25%'),       // 2
    shadowColor: BUBBLE_SHADOW,
    shadowOpacity: 0.07,
    shadowRadius: 1,
    elevation: 1,
    position: 'relative',
  },
  otherBubble: {
    maxWidth: wp('85%'),
    minWidth: wp('16%'),
    borderRadius: wp('4.8%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    backgroundColor: BUBBLE_OTHER,
    borderWidth: 1,
    borderColor: '#e4e4e4',
    alignItems: 'flex-start',
    marginBottom: hp('0.25%'),
    shadowColor: BUBBLE_SHADOW,
    shadowOpacity: 0.07,
    shadowRadius: 1,
    elevation: 1,
    position: 'relative',
  },
  myText: {
    color: '#fff',
    fontSize: hp('2%'),              // 15.5
    fontWeight: '400',
    lineHeight: hp('2.6%'),          // 21
    maxWidth: '100%',
    paddingRight: wp('10%'),         // 38
  },
  otherText: {
    color: '#191919',
    fontSize: hp('2%'),
    fontWeight: '400',
    lineHeight: hp('2.6%'),
    maxWidth: '100%',
    paddingRight: wp('10%'),
  },
  timeInBubble: {
    color: '#d6e3fa',
    fontSize: hp('1.5%'),            // 11.5
    position: 'absolute',
    right: wp('4.3%'),               // 16
    bottom: hp('0.7%'),              // 6
  },
  timeInBubbleOther: {
    color: '#bbb',
    fontSize: hp('1.5%'),
    position: 'absolute',
    right: wp('4.3%'),
    bottom: hp('0.7%'),
  },
  pseudo: {
    fontWeight: '700',
    fontSize: hp('1.7%'),            // 13
    color: '#3393ff',
    marginLeft: wp('0.5%'),          // 2
    marginBottom: hp('0.25%'),       // 2
    marginTop: hp('0.12%'),          // 1
  },
  avatarImg: {
    width: wp('8%'),                 // 30
    height: wp('8%'),
    borderRadius: wp('4%'),          // 15
    marginRight: wp('2%'),           // 7
    backgroundColor: '#eee',
  },
  inputBarContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: wp('2.7%'),   // 10
    paddingTop: hp('0.5%'),          // 4
    paddingBottom: hp('0.25%'),      // 2
    backgroundColor: 'transparent',
    minHeight: hp('5.5%'),           // 44
  },
  textBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: wp('6%'),          // 22
    borderWidth: 1,
    borderColor: '#eaeaea',
    paddingHorizontal: wp('3.5%'),   // 13
    minHeight: hp('5.5%'),           // 44
    maxHeight: hp('10%'),            // 80
    marginRight: wp('2%'),           // 7
  },
  input: {
    flex: 1,
    fontSize: hp('2%'),              // 16
    color: '#191919',
    paddingVertical: hp('1.2%'),     // 10
    paddingHorizontal: 0,
    minHeight: hp('3.7%'),           // 30
    maxHeight: hp('10%'),            // 80
  },
  imageButton: {
    padding: wp('0.5%'),             // 2
    marginLeft: wp('0.5%'),          // 2
    borderRadius: wp('3.5%'),        // 13
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonWrap: {
    marginLeft: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: hp('1%'),          // 8
  },
  sendButton: {
    width: wp('8.5%'),               // 32
    height: wp('8.5%'),
    borderRadius: wp('4.25%'),       // 16
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageBubble: {
  borderRadius: wp('4.8%'),
  backgroundColor: 'transparent',
  padding: 0,
  overflow: 'hidden',
}
});
