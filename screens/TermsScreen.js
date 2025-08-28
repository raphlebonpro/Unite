import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const sections = [
  {
    title: '1. Présentation de l’application',
    content: `Unite est une application mobile éditée par la micro-entreprise Unite, permettant à ses utilisateurs de se rencontrer pour pratiquer des activités sportives ensemble, dans une ambiance conviviale et bienveillante.
L’application est actuellement en version de test (MVP).`
  },
  {
    title: '2. Acceptation des conditions',
    content: `En créant un compte sur Unite, vous acceptez sans réserve les présentes Conditions Générales d’Utilisation.`
  },
  {
    title: '3. Accès réservé aux utilisateurs de 15 ans et plus',
    content: `L’utilisation de Unite est réservée aux personnes âgées de 15 ans ou plus. Toute inscription frauduleuse entraînera la suppression immédiate du compte.`
  },
  {
    title: '4. Création, gestion et suppression du compte',
    content: `Pour utiliser Unite, vous devez créer un compte via e-mail ou Google.
Vous êtes seul responsable de la confidentialité de vos identifiants et de l’utilisation de votre compte.
Vous pouvez supprimer votre compte de manière autonome et immédiate via la page Paramètres de l’application.`
  },
  {
    title: '5. Utilisation de l’application',
    content: `Vous vous engagez à utiliser Unite de manière respectueuse envers les autres utilisateurs.
Il est strictement interdit de :
- Tenir des propos haineux, insultants ou discriminatoires
- Publier du contenu inapproprié ou trompeur
- Harceler, intimider ou importuner d’autres utilisateurs
- Organiser ou promouvoir des activités dangereuses, illégales ou contraires à l’esprit sportif via l’application
- Usurper l’identité d’autrui ou fournir de fausses informations
- Tenter d’exploiter des failles ou de nuire à l’application et à ses utilisateurs
Tout comportement abusif, frauduleux ou non conforme pourra entraîner la suspension ou la suppression du compte, sans préavis.`
  },
  {
    title: '6. Organisation et participation aux sessions',
    content: `Les utilisateurs sont entièrement responsables des sessions sportives qu’ils créent ou rejoignent via Unite.
L’éditeur de Unite n’est en aucun cas responsable :
- des comportements des utilisateurs lors des rencontres
- des éventuels accidents, préjudices, litiges ou différends entre participants
- de l’utilisation inappropriée ou non conforme de l’application par les membres
Il est conseillé de toujours faire preuve de prudence lors des rencontres physiques avec d’autres utilisateurs.`
  },
  {
    title: '7. Localisation',
    content: `L’accès à votre position est optionnel, mais recommandé pour une expérience optimale.
La localisation n’est utilisée que pour afficher les sessions à proximité et n’est jamais partagée avec d’autres utilisateurs.
Elle est collectée uniquement avec votre consentement explicite, et peut être désactivée dans les paramètres de votre appareil à tout moment.`
  },
  {
    title: '8. Messagerie et contenu utilisateur',
    content: `L’application propose une messagerie intégrée pour discuter autour des sessions.
Cette messagerie doit être utilisée dans un esprit bienveillant et respectueux. Tout abus signalé peut entraîner la suppression du compte.
Unite se réserve le droit de supprimer tout contenu inapproprié ou illégal publié via l’application.`
  },
  {
    title: '9. Données personnelles et confidentialité',
    content: `La gestion des données personnelles est détaillée dans la Politique de Confidentialité accessible dans l’application.
Les utilisateurs disposent de droits d’accès, de rectification, de suppression et d’opposition concernant leurs données, conformément au RGPD.`
  },
  {
    title: '10. Sécurité des données',
    content: `Toutes les données sont stockées et gérées via Supabase (Google Cloud, Union Européenne - europe-west3), de manière sécurisée avec authentification protégée et accès limité.`
  },
  {
    title: '11. Propriété intellectuelle',
    content: `Le nom, logo, code et contenus liés à Unite sont la propriété de la micro-entreprise Unite. Toute reproduction non autorisée est interdite.`
  },
  {
    title: '12. Responsabilité',
    content: `L’éditeur ne saurait être tenu responsable des dommages directs ou indirects résultant de l’utilisation de l’application, y compris lors de rencontres physiques entre utilisateurs.
L’éditeur ne garantit pas l’identité ni la fiabilité des utilisateurs, et décline toute responsabilité en cas de comportement dangereux, frauduleux ou illégal de la part des membres.`
  },
  {
    title: '13. Durée de conservation des données',
    content: `Vos données sont conservées tant que votre compte est actif.
Après suppression de votre compte, certaines données peuvent être conservées jusqu’à 1 an à des fins légales ou en cas de litige, puis définitivement supprimées ou anonymisées.`
  },
  {
    title: '14. Modification des conditions',
    content: `Ces conditions peuvent être modifiées à tout moment. Toute modification importante sera signalée via une notification ou affichée dans l’application.`
  },
  {
    title: '15. Juridiction et droit applicable',
    content: `Les présentes CGU sont soumises au droit français.
Tout litige relève de la compétence exclusive des tribunaux français.`
  },
  {
    title: '16. Réclamation et contact',
    content: `Pour toute question, demande de renseignements ou réclamation, contactez :
📧 contact@uniteapp.fr
Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr) en cas de non-respect de vos droits.`
  },
];

const CGUScreen = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.header}>Conditions Générales d’Utilisation</Text>
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
    padding: wp('6.5%'),
    paddingBottom: hp('5%'),
  },
  header: {
    fontSize: wp('6.4%'), // 24 sur un écran 375px
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
    marginBottom: hp('2.3%'),
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: wp('4.3%'),
    padding: wp('4.8%'),
    marginBottom: hp('2.2%'),
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

export default CGUScreen;
