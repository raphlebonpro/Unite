import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const sections = [
  {
    title: '1. Présentation',
    content: `Unite est une application mobile éditée par la micro-entreprise Unite, permettant aux utilisateurs de se rencontrer pour pratiquer des activités sportives ensemble.

Éditeur :
Unite – micro-entreprise de Raphaël LEBON
SIREN : 989852413
📧 contact@uniteapp.fr`
  },
  {
    title: '2. Acceptation des conditions',
    content: `L’inscription et l’utilisation de Unite impliquent l’acceptation pleine et entière des présentes Conditions Générales d’Utilisation.`
  },
  {
    title: '3. Accès réservé',
    content: `Unite est réservée aux personnes âgées de 16 ans ou plus. Toute inscription frauduleuse entraînera la suppression immédiate du compte.`
  },
  {
    title: '4. Création et suppression du compte',
    content: `La création de compte se fait via adresse e-mail ou Google. 
Vous êtes responsable de vos identifiants. Vous pouvez supprimer votre compte à tout moment depuis la page Paramètres.`
  },
  {
    title: '5. Règles d’utilisation',
    content: `Les utilisateurs s’engagent à une utilisation respectueuse. Il est interdit de :
- Harceler, insulter, discriminer
- Publier du contenu trompeur, violent ou sexuellement explicite
- Promouvoir des activités illégales
- Usurper l’identité d’autrui
- Exploiter des failles ou perturber le service

Tout manquement pourra entraîner la suspension ou la suppression du compte sans préavis.`
  },
  {
    title: '6. Sessions sportives',
    content: `Les utilisateurs sont seuls responsables des sessions qu’ils organisent ou rejoignent.
Unite décline toute responsabilité concernant :
- Les comportements des utilisateurs lors des rencontres
- Les accidents, préjudices ou litiges survenus entre participants.`
  },
  {
    title: '7. Localisation',
    content: `La géolocalisation est optionnelle et utilisée uniquement pour afficher des sessions proches de vous. Vous pouvez la désactiver à tout moment.`
  },
  {
    title: '8. Messagerie et contenus',
    content: `Les utilisateurs conservent la propriété de leurs messages et photos, mais accordent à Unite une licence non exclusive et gratuite pour les héberger dans le cadre du bon fonctionnement du service.
Tout contenu inapproprié peut être supprimé sans préavis.`
  },
  {
    title: '9. Données personnelles',
    content: `La gestion des données personnelles est détaillée dans la Politique de Confidentialité de Unite.`
  },
  {
    title: '10. Sécurité et maintenance',
    content: `L’application peut être temporairement indisponible pour maintenance, mise à jour ou cas de force majeure. Unite ne saurait en être tenue responsable.`
  },
  {
    title: '11. Propriété intellectuelle',
    content: `Le nom, logo, code et contenus de Unite sont la propriété exclusive de la micro-entreprise Unite. Toute reproduction non autorisée est interdite.`
  },
  {
    title: '12. Responsabilité',
    content: `Unite ne garantit pas l’identité ni la fiabilité des utilisateurs. L’éditeur décline toute responsabilité en cas de comportements dangereux, illégaux ou frauduleux.`
  },
  {
    title: '13. Résiliation',
    content: `Unite se réserve le droit de suspendre ou supprimer un compte en cas de violation grave des présentes conditions ou comportement inapproprié.`
  },
  {
    title: '14. Droit applicable et juridiction',
    content: `Les présentes CGU sont régies par le droit français. Tout litige relève de la compétence exclusive des tribunaux français.`
  },
  {
    title: '15. Médiation et réclamation',
    content: `En cas de litige non résolu, le consommateur peut recourir à la médiation via la plateforme européenne de règlement en ligne des litiges (RLL) :
https://ec.europa.eu/consumers/odr

Pour toute réclamation :
📧 contact@uniteapp.fr`
  },
];

const CGUScreen = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.header}>Conditions Générales d’Utilisation</Text>
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
  contentContainer: { padding: wp('6%'), paddingBottom: hp('6%') },
  header: {
    fontSize: wp('6.3%'),
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

export default CGUScreen;
