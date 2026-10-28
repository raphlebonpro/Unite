import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const sections = [
  {
    title: '1. Présentation',
    content: `La présente politique de confidentialité explique comment Unite collecte, utilise, conserve et protège vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD - UE 2016/679) et à la loi française (Loi Informatique et Libertés du 6 janvier 1978 modifiée).

Unite est une application mobile éditée par la micro-entreprise Raphaël LEBON, dont l’objectif est de mettre en relation des utilisateurs souhaitant pratiquer une activité sportive ensemble.

Responsable du traitement :
Unite – micro-entreprise de Raphaël LEBON
SIREN : 989852413
📧 contact@uniteapp.fr`
  },
  {
    title: '2. Données collectées',
    content: `Lors de l’utilisation de Unite, nous pouvons collecter :

Données d’inscription :
- Adresse e-mail
- Nom ou pseudonyme
- Photo de profil (si ajoutée)
- Âge (minimum 16 ans)
- Genre (facultatif)

Données de localisation :
- Position approximative ou précise (uniquement si vous autorisez la géolocalisation)

Données d’usage :
- Sessions créées, rejointes ou supprimées
- Messages échangés dans la messagerie
- Historique d’activités sportives

Données techniques :
- Identifiant d’appareil, type d’appareil, version du système et logs de connexion.`
  },
  {
    title: '3. Finalités et bases légales',
    content: `Vos données sont utilisées pour :
- Permettre la création, la gestion et la suppression de votre compte (exécution du contrat)
- Proposer des sessions sportives proches de chez vous (intérêt légitime)
- Faciliter la mise en relation et la discussion entre utilisateurs (exécution du contrat)
- Garantir la sécurité, la modération et le bon fonctionnement de l’application (intérêt légitime)
- Respecter nos obligations légales (obligation légale)
- Envoyer des notifications ou communications géolocalisées (uniquement avec votre consentement explicite)

Les données de localisation et notifications marketing ne sont collectées et traitées qu’après consentement explicite de l’utilisateur, conformément à l’article 6 §1-a du RGPD.`
  },
  {
    title: '4. Partage et transferts de données',
    content: `Unite ne vend ni ne partage vos données personnelles à des tiers, sauf :
- En cas d’obligation légale ou demande d’autorités compétentes
- À des prestataires techniques strictement nécessaires (hébergement Supabase / Google Cloud, Europe)

Les données sont principalement hébergées dans l’Union Européenne (Google Cloud, région europe-west). Certains traitements techniques peuvent impliquer des transferts vers les États-Unis, encadrés par les clauses contractuelles types de la Commission européenne.`
  },
  {
    title: '5. Sécurité',
    content: `Toutes les données sont hébergées de manière sécurisée sur Supabase (Google Cloud – Europe). L’accès est restreint et protégé par authentification. Des audits réguliers sont réalisés pour prévenir tout accès non autorisé.

En cas de violation de la sécurité des données, Unite notifiera la CNIL et les utilisateurs concernés dans les meilleurs délais.`
  },
  {
    title: '6. Durée de conservation',
    content: `Les données sont conservées jusqu’à la suppression du compte. Après suppression, elles peuvent être archivées jusqu’à 12 mois à des fins légales ou en cas de litige, avant suppression définitive ou anonymisation.`
  },
  {
    title: '7. Vos droits',
    content: `Conformément au RGPD, vous disposez des droits suivants :
- Droit d’accès, de rectification et de suppression de vos données
- Droit à la limitation du traitement
- Droit à la portabilité
- Droit d’opposition
- Droit de retrait du consentement
- Droit d’introduire une réclamation auprès de la CNIL (www.cnil.fr)

Pour exercer vos droits : 📧 contact@uniteapp.fr`
  },
  {
    title: '8. Délégué à la Protection des Données (DPO)',
    content: `Unite n’a pas désigné de Délégué à la Protection des Données, mais toute demande liée à la vie privée peut être adressée à contact@uniteapp.fr.`
  },
  {
    title: '9. Utilisation responsable et modération',
    content: `Vous vous engagez à utiliser Unite de manière respectueuse. Tout abus (propos haineux, harcèlement, etc.) peut entraîner la suspension du compte.

L’éditeur de Unite n’est pas responsable du comportement des utilisateurs lors des rencontres ni des accidents ou litiges survenus entre participants.`
  },
  {
    title: '10. Utilisation par les mineurs',
    content: `L’accès à Unite est réservé aux personnes âgées de 16 ans ou plus. Aucune collecte volontaire de données n’est effectuée auprès des mineurs de moins de 15 ans.`
  },
  {
    title: '11. Propriété intellectuelle',
    content: `Le nom, le logo, le design et les contenus liés à Unite sont la propriété exclusive de la micro-entreprise Unite. Toute reproduction ou utilisation non autorisée est interdite.`
  },
  {
    title: '12. Modifications de la politique',
    content: `Unite peut modifier la présente politique à tout moment. Toute modification importante sera notifiée directement dans l’application.`
  },
];

const ConfidentialiteScreen = () => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.header}>Politique de Confidentialité</Text>
      <Text style={styles.subHeader}>Dernière mise à jour : Octobre 2025</Text>
      {sections.map((section, idx) => (
        <View style={styles.box} key={idx}>
          <Text style={styles.title}>{section.title}</Text>
          <Text style={styles.text}>{section.content}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#f6f7fb', flex: 1 },
  contentContainer: { padding: wp('5.5%'), paddingBottom: hp('7%') },
  header: {
    fontSize: wp('6.1%'),
    fontWeight: 'bold',
    alignSelf: 'center',
    color: '#1a2343',
    marginTop: hp('1.2%'),
    marginBottom: hp('0.5%'),
  },
  subHeader: {
    fontSize: wp('4.2%'),
    color: '#5e6b87',
    alignSelf: 'center',
    marginBottom: hp('2%'),
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: wp('4%'),
    padding: wp('4.8%'),
    marginBottom: hp('2%'),
    borderColor: '#e4e8f1',
    borderWidth: 0.5,
  },
  title: { fontWeight: 'bold', fontSize: wp('4.6%'), color: '#1a2343', marginBottom: hp('1%') },
  text: { fontSize: wp('4.1%'), color: '#313b52', lineHeight: hp('2.6%') },
});

export default ConfidentialiteScreen;
