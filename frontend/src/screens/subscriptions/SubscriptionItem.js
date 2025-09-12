import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SubscriptionItem({
  name,
  amount,
  currency,
  subscription_type,
  next_due,
  service,
  onPress,
  onManage,
  onDelete,
  busy,
  showDelete = false,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        backgroundColor: '#151515',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
      }}
    >
      {/* Haut de carte : logo + titre + prix */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {service?.logo ? (
          <Image
            source={{ uri: service.logo }}
            style={{ width: 36, height: 36, borderRadius: 8, marginRight: 10 }}
          />
        ) : (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              marginRight: 10,
              backgroundColor: '#222',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text>💳</Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{name}</Text>
          <Text style={{ color: '#9a9a9a', marginTop: 2 }}>
            {subscription_type} • {next_due ? `échéance ${next_due}` : '—'}
          </Text>
        </View>

        <Text style={{ color: '#A6FF00', fontWeight: '700' }}>
          {amount != null ? amount : '—'} {currency || 'EUR'}
        </Text>
      </View>

      {/* === ICI ton bloc d’actions === */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#A6FF00',
            paddingVertical: 10,
            borderRadius: 10,
            flex: 1,
            alignItems: 'center',
          }}
          onPress={onManage}
          disabled={busy}
        >
          <Text style={{ color: '#000', fontWeight: '700' }}>Gérer</Text>
        </TouchableOpacity>

        {showDelete && ( // ⬅️ render seulement si demandé
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: '#ff6b6b',
              paddingVertical: 10,
              borderRadius: 10,
              flex: 1,
              alignItems: 'center',
            }}
            onPress={onDelete}
            disabled={busy}
          >
            <Text style={{ color: '#ff6b6b', fontWeight: '700' }}>
              {busy ? '…' : 'Supprimer'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}
