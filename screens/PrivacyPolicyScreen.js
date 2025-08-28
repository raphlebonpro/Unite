import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const sections = [
  {
    title: '1. Présentation',
    content: `Cette politique de confidentialité explique comment Unite collecte, utilise, conserve et protège vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi française.
Unite est une application mobile éditée par la micro-entreprise Unite, dont l’objectif est de mettre en relation des utilisateurs souhaitant pratiquer une activité sportive ensemble.`
  },
  {
    title: '2. Données collectées',
    content: `Lors de l’utilisation de Unite, nous pouvons collecter :
Données d’inscription :
- Adresse e-mail
- Nom ou pseudonyme
- Photo de profil (si ajoutée)
- Âge (minimum 15 ans)
- Genre
Données de localisation :
- Position approximative ou précise (uniquement si vous autorisez la géolocalisation, modifiable à tout moment)
Données d’usage :
- Messages envoyés via la messagerie de session
- Sessions créées ou rejointes
Données techniques :
- Identifiant d’appareil, logs de connexion, type d’appareil

À noter :
Les informations comme les sports favoris ou le niveau sportif sont optionnelles et peuvent être renseignées/modifiées depuis la page Profil. Elles ne sont pas obligatoires à l’inscription.`
  },
  {
    title: '3. Utilisation des données (finalités et bases légales)',
    content: `Vos données sont utilisées uniquement pour :
- Permettre la création, la gestion et la suppression de votre compte (exécution du contrat)
- Proposer des sessions sportives proches de chez vous (intérêt légitime)
- Faciliter la mise en relation et la discussion via la messagerie (exécution du contrat)
- Garantir la sécurité, la modération et le bon fonctionnement de l’application (intérêt légitime)
- Respecter nos obligations légales (obligation légale)
- Afficher, le cas échéant, des publicités ou notifications géolocalisées (uniquement avec votre consentement explicite)

Vous pouvez retirer votre consentement à tout moment (par exemple en désactivant la localisation).`
  },
  {
    title: '4. Partage des données',
    content: `Unite ne vend ni ne partage vos données personnelles à des tiers, sauf :
- En cas d’obligation légale ou demande d’autorités compétentes
- À des prestataires techniques strictement nécessaires (hébergement Supabase/Google Cloud en Europe), soumis à obligation de confidentialité

Aucun transfert hors Union Européenne n’a lieu sans information et consentement préalable.`
  },
  {
    title: '5. Sécurité des données',
    content: `Toutes les données sont stockées de manière sécurisée via Supabase (Google Cloud, Europe West), avec authentification protégée, accès restreint et audit régulier.
En cas de violation de la sécurité des données, vous serez notifié dans les meilleurs délais conformément à la réglementation.`
  },
  {
    title: '6. Durée de conservation',
    content: `Vos données sont conservées tant que votre compte est actif.
En cas de suppression du compte (possible à tout moment via l’application, rubrique Paramètres), vos données sont effacées ou anonymisées sous 1 an, sauf obligation légale contraire (par exemple pour gérer d’éventuels litiges).`
  },
  {
    title: '7. Vos droits',
    content: `Conformément au RGPD, vous disposez des droits suivants :
- Accéder à vos données personnelles
- Les rectifier, compléter ou mettre à jour
- Demander leur suppression ou limitation
- Vous opposer à certains traitements (notamment marketing)
- Retirer votre consentement à tout moment
- Demander la portabilité de vos données
- Introduire une réclamation auprès de la CNIL (www.cnil.fr)

Vous pouvez exercer vos droits ou poser toute question à :
📧 contact@uniteapp.fr`
  },
  {
    title: '8. Utilisation responsable et signalements',
    content: `Vous vous engagez à utiliser Unite de manière respectueuse.
Toute utilisation abusive de la messagerie, harcèlement, propos haineux, etc. pourra entraîner la suspension ou la suppression du compte, sans préavis.
L’éditeur de Unite n’est pas responsable du comportement des utilisateurs lors des rencontres ni des accidents ou litiges survenus entre participants.`
  },
  {
    title: '9. Utilisation par les mineurs',
    content: `L’accès à Unite est réservé aux personnes âgées de 15 ans ou plus.
Aucune collecte volontaire de données concernant des mineurs de moins de 15 ans.`
  },
  {
    title: '10. Propriété intellectuelle',
    content: `Le nom, logo, design, et contenus liés à Unite sont la propriété exclusive de la micro-entreprise Unite. Toute reproduction non autorisée est interdite.`
  },
  {
    title: '11. Modifications de la politique',
    content: `Cette politique peut être mise à jour à tout moment. Toute modification importante sera notifiée dans l’application.`
  },
  {
    title: 'Contact responsable du traitement / micro-entreprise Unite',
    content: `📧 contact@uniteapp.fr\nRéclamation CNIL : www.cnil.fr`
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
      <Text style={styles.subHeader}>Dernière mise à jour : Juillet 2025</Text>
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
  container: {
    backgroundColor: '#f6f7fb',
    flex: 1,
  },
  contentContainer: {
    padding: wp('5.5%'),
    paddingBottom: hp('7%'),
  },
  header: {
    fontSize: wp('6.1%'),
    fontWeight: 'bold',
    alignSelf: 'center',
    textAlign: 'center',
    color: '#1a2343',
    marginTop: hp('1.1%'),
    marginBottom: hp('0.3%'),
    letterSpacing: 0.5,
  },
  subHeader: {
    fontSize: wp('4.2%'),
    color: '#5e6b87',
    alignSelf: 'center',
    textAlign: 'center',
    marginBottom: hp('2.1%'),
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: wp('4.3%'),
    padding: wp('4.8%'),
    marginBottom: hp('2.1%'),
    shadowColor: '#1a234320',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#e4e8f1',
  },
  title: {
    fontWeight: 'bold',
    fontSize: wp('4.7%'),
    marginBottom: hp('1.1%'),
    color: '#1a2343',
    letterSpacing: 0.2,
  },
  text: {
    fontSize: wp('4.2%'),
    color: '#313b52',
    lineHeight: hp('2.8%'),
    letterSpacing: 0.1,
  },
});

export default ConfidentialiteScreen;
